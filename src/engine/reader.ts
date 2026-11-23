/**
 * Robust text-to-speech reader on top of the Web Speech API.
 *
 * Browser quirks handled:
 *  - Chrome sometimes never fires `onend`         → poll `speaking`, plus a hard time cap per chunk
 *  - Chrome cuts long utterances (~15 s)          → lines are split into short chunks
 *  - Safari needs a user gesture before speaking  → `play()` speaks a silent primer synchronously
 *  - Voices may load late / never                 → voice is resolved at speak time; default voice works
 *  - No word-boundary events (Firefox/Linux)      → timed word estimate fallback
 *  - Stale callbacks after cancel()               → every utterance carries a token; stale events are ignored
 *  - pause()/resume() are unreliable              → pause = cancel + remember the word; resume re-speaks from there
 *  - Repeated failures                            → stop with a clear message
 */

export interface ReadLine {
  id: string;
  text: string;
  kind?: 'text' | 'code' | 'eq' | 'heading' | 'caption';
}

export type ReaderState = 'idle' | 'playing' | 'paused' | 'error';

export interface ReaderListener {
  onLine?(index: number): void;
  onWord?(index: number, start: number, end: number): void;
  onState?(state: ReaderState): void;
  onError?(message: string): void;
}

export interface ReaderOptions {
  rate?: number;
  voiceName?: string; // '' = auto
  skipCode?: boolean;
  /** Delay after cancel() before speaking again (Chrome needs a beat). */
  cancelDelayMs?: number;
  pollMs?: number;
  startTimeoutMs?: number;
  maxChunk?: number;
  /** Failures in a row before giving up. */
  maxFailures?: number;
  /** Hard cap per chunk = capBaseMs + chars * capPerCharMs / rate. */
  capBaseMs?: number;
  capPerCharMs?: number;
}

type UtterCtor = new (text: string) => SpeechSynthesisUtterance;

interface Chunk { start: number; text: string }

export const SPEECH_FAILED_MSG =
  'Speech isn’t working in this browser right now. Try another voice in the voice menu, reload the page, or use Chrome/Edge/Safari. On Linux, install a speech engine (e.g. speech-dispatcher).';

export function splitChunks(text: string, max = 180): Chunk[] {
  const chunks: Chunk[] = [];
  // sentences: end punctuation followed by space
  const re = /[^.!?;:]+[.!?;:]*\s*/g;
  let m: RegExpExecArray | null;
  const sentences: Chunk[] = [];
  while ((m = re.exec(text))) {
    if (!m[0]) break;
    sentences.push({ start: m.index, text: m[0] });
  }
  if (!sentences.length && text) sentences.push({ start: 0, text });
  for (const s of sentences) {
    if (s.text.length <= max) {
      const prev = chunks[chunks.length - 1];
      // merge tiny sentences to avoid choppy speech
      if (prev && prev.text.length + s.text.length <= max && prev.text.length < 40) prev.text += s.text;
      else chunks.push({ ...s });
      continue;
    }
    // split long sentence at commas/spaces
    let rest = s.text;
    let off = s.start;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(', ', max);
      if (cut < max / 2) cut = rest.lastIndexOf(' ', max);
      if (cut <= 0) cut = max;
      else cut += 1;
      chunks.push({ start: off, text: rest.slice(0, cut) });
      off += cut;
      rest = rest.slice(cut);
    }
    if (rest) chunks.push({ start: off, text: rest });
  }
  return chunks.filter((c) => c.text.trim().length > 0);
}

function wordAt(text: string, i: number): [number, number] {
  let a = Math.max(0, Math.min(i, text.length - 1));
  while (a > 0 && !/\s/.test(text[a - 1])) a--;
  let b = a;
  while (b < text.length && !/\s/.test(text[b])) b++;
  return [a, b];
}

export class Reader {
  private synth: SpeechSynthesis | null;
  private Utter: UtterCtor | null;
  private lines: ReadLine[] = [];
  private chunks: Chunk[][] = [];
  private listeners = new Set<ReaderListener>();
  private opts: Required<ReaderOptions>;
  state: ReaderState = 'idle';
  line = 0;
  private chunk = 0;
  private wordStart = 0; // char offset within current line of last spoken word
  private token = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private failures = 0;
  private primed = false;
  private narrationDone: (() => void) | null = null;

  constructor(synth: SpeechSynthesis | null, Utter: UtterCtor | null, opts: ReaderOptions = {}) {
    this.synth = synth;
    this.Utter = Utter;
    this.opts = {
      rate: 1,
      voiceName: '',
      skipCode: true,
      cancelDelayMs: 60,
      pollMs: 250,
      startTimeoutMs: 2500,
      maxChunk: 180,
      maxFailures: 3,
      capBaseMs: 2500,
      capPerCharMs: 110,
      ...opts,
    };
  }

  get available(): boolean {
    return !!this.synth && !!this.Utter;
  }

  subscribe(l: ReaderListener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit<K extends keyof ReaderListener>(k: K, ...args: Parameters<NonNullable<ReaderListener[K]>>) {
    for (const l of this.listeners) (l[k] as ((...a: unknown[]) => void) | undefined)?.(...args);
  }

  private setState(s: ReaderState) {
    if (this.state === s) return;
    this.state = s;
    this.emit('onState', s);
  }

  setOptions(o: Partial<ReaderOptions>) {
    Object.assign(this.opts, o);
  }
  get options(): Readonly<Required<ReaderOptions>> {
    return this.opts;
  }

  setLines(lines: ReadLine[]) {
    this.stop();
    this.lines = lines;
    this.chunks = lines.map((l) => splitChunks(l.text, this.opts.maxChunk));
    this.line = 0;
  }
  get lineCount() {
    return this.lines.length;
  }

  voices(): SpeechSynthesisVoice[] {
    try {
      return this.synth?.getVoices() ?? [];
    } catch {
      return [];
    }
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const vs = this.voices();
    if (!vs.length) return null;
    if (this.opts.voiceName) {
      const v = vs.find((x) => x.name === this.opts.voiceName);
      if (v) return v;
    }
    const en = vs.filter((v) => /^en(-|_|$)/i.test(v.lang));
    const pool = en.length ? en : vs;
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const ranked = [...pool].sort((a, b) => score(b) - score(a));
    function score(v: SpeechSynthesisVoice) {
      let s = 0;
      if (v.default) s += 2;
      if (v.localService) s += offline ? 10 : 1;
      if (/natural|neural|premium|enhanced|google/i.test(v.name)) s += offline ? 0 : 3;
      return s;
    }
    return ranked[0] ?? null;
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    this.timers = [];
    this.intervals = [];
  }

  /** Must be called from a user gesture (click/keypress) the first time. */
  private prime() {
    if (this.primed || !this.synth || !this.Utter) return;
    this.primed = true;
    try {
      const u = new this.Utter(' ');
      u.volume = 0;
      this.synth.speak(u);
    } catch {
      /* ignore */
    }
  }

  private isSkipped(i: number) {
    return this.opts.skipCode && this.lines[i]?.kind === 'code';
  }

  play(from?: number) {
    if (!this.available) {
      this.fail(SPEECH_FAILED_MSG);
      return;
    }
    this.prime();
    if (from !== undefined) {
      this.line = Math.max(0, Math.min(from, this.lines.length - 1));
      this.chunk = 0;
      this.wordStart = 0;
    } else if (this.state === 'idle' || this.state === 'error') {
      this.chunk = 0;
      this.wordStart = 0;
    }
    while (this.line < this.lines.length && this.isSkipped(this.line)) this.line++;
    if (this.line >= this.lines.length) {
      this.stop();
      return;
    }
    this.failures = 0;
    this.setState('playing');
    this.emit('onLine', this.line);
    this.speakCurrent(this.resumeOffset());
  }

  private resumeOffset(): number {
    const c = this.chunks[this.line]?.[this.chunk];
    if (!c) return 0;
    return Math.max(0, Math.min(this.wordStart - c.start, c.text.length - 1));
  }

  pause() {
    if (this.state !== 'playing') return;
    this.token++;
    this.clearTimers();
    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }
    this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.prime();
    this.setState('playing');
    this.speakCurrent(this.resumeOffset());
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
    else this.play();
  }

  stop() {
    this.token++;
    this.clearTimers();
    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }
    this.chunk = 0;
    this.wordStart = 0;
    const nd = this.narrationDone;
    this.narrationDone = null;
    nd?.();
    if (this.state !== 'error') this.setState('idle');
  }

  next() {
    this.jump(+1);
  }
  prev() {
    this.jump(-1);
  }
  private jump(d: number) {
    let i = this.line + d;
    while (i >= 0 && i < this.lines.length && this.isSkipped(i)) i += d;
    if (i < 0 || i >= this.lines.length) return;
    this.line = i;
    this.chunk = 0;
    this.wordStart = 0;
    this.emit('onLine', i);
    if (this.state === 'playing') {
      this.token++;
      this.clearTimers();
      this.speakCurrent(0);
    }
  }

  private fail(msg: string) {
    this.token++;
    this.clearTimers();
    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }
    this.setState('error');
    this.emit('onError', msg);
    const nd = this.narrationDone;
    this.narrationDone = null;
    nd?.();
  }

  /** Speak current chunk starting at `off` chars into it. */
  private speakCurrent(off: number) {
    const c = this.chunks[this.line]?.[this.chunk];
    if (!c) {
      this.advance();
      return;
    }
    const lineIdx = this.line;
    const base = c.start + off;
    this.utter(c.text.slice(off), {
      onWord: (i, j) => {
        this.wordStart = base + i;
        this.emit('onWord', lineIdx, base + i, base + j);
      },
      onDone: (ok) => {
        if (ok) this.failures = 0;
        else if (++this.failures >= this.opts.maxFailures) {
          this.fail(SPEECH_FAILED_MSG);
          return;
        }
        this.advance();
      },
    });
  }

  private advance() {
    this.chunk++;
    if (this.chunk < (this.chunks[this.line]?.length ?? 0)) {
      this.wordStart = this.chunks[this.line][this.chunk].start;
      this.speakCurrent(0);
      return;
    }
    // next line
    let i = this.line + 1;
    while (i < this.lines.length && this.isSkipped(i)) i++;
    if (i >= this.lines.length) {
      this.chunk = 0;
      this.stop();
      return;
    }
    this.line = i;
    this.chunk = 0;
    this.wordStart = 0;
    this.emit('onLine', i);
    this.speakCurrent(0);
  }

  /**
   * Speak a one-off text (animation captions). Interrupts line reading.
   * Resolves when finished, stopped, or failed — never hangs.
   */
  speakOnce(text: string): Promise<void> {
    if (!this.available) return Promise.resolve();
    this.prime();
    this.token++;
    this.clearTimers();
    const prevDone = this.narrationDone;
    this.narrationDone = null;
    prevDone?.();
    this.setState('playing');
    return new Promise<void>((resolve) => {
      this.narrationDone = resolve;
      this.utter(text, {
        onDone: () => {
          const nd = this.narrationDone;
          this.narrationDone = null;
          this.setState('idle');
          nd?.();
        },
      });
    });
  }

  /** Low-level: one utterance with every safety net. */
  private utter(text: string, cb: { onWord?: (start: number, end: number) => void; onDone: (ok: boolean) => void }) {
    const synth = this.synth!;
    const token = ++this.token;
    this.clearTimers();
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
    const live = () => token === this.token;
    let finished = false;
    let started = false;
    let sawSpeaking = false;
    let gotBoundary = false;
    let lastWord = -1;
    const rate = this.opts.rate;

    const finish = (ok: boolean) => {
      if (finished || !live()) return;
      finished = true;
      this.clearTimers();
      cb.onDone(ok);
    };

    const go = () => {
      if (!live()) return;
      const u = new this.Utter!(text);
      u.rate = rate;
      const v = this.pickVoice();
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else u.lang = 'en-GB';
      const t0 = Date.now();
      u.onstart = () => {
        if (live()) started = true;
      };
      u.onboundary = (e: SpeechSynthesisEvent) => {
        if (!live() || (e.name && e.name !== 'word')) return;
        gotBoundary = true;
        started = true;
        const [a, b] = wordAt(text, e.charIndex);
        lastWord = a;
        cb.onWord?.(a, e.charLength ? a + e.charLength : b);
      };
      u.onend = () => finish(true);
      u.onerror = (e: SpeechSynthesisErrorEvent) => {
        if (!live()) return;
        if (e.error === 'interrupted' || e.error === 'canceled') return; // caused by our own cancel()
        finish(false);
      };
      try {
        synth.speak(u);
      } catch {
        finish(false);
        return;
      }
      // Poll: Chrome may never fire onend.
      this.intervals.push(
        setInterval(() => {
          if (!live()) return;
          const speaking = synth.speaking || synth.pending;
          if (speaking) sawSpeaking = true;
          const elapsed = Date.now() - t0;
          if ((sawSpeaking || started) && !speaking && elapsed > 400) finish(true);
          // Word estimate when the engine gives no boundary events.
          if ((started || sawSpeaking) && !gotBoundary && elapsed > 250 && cb.onWord) {
            const cps = 14 * rate;
            const idx = Math.min(text.length - 1, Math.floor(((elapsed - 150) / 1000) * cps));
            const [a, b] = wordAt(text, Math.max(0, idx));
            if (a > lastWord) {
              lastWord = a;
              cb.onWord(a, b);
            }
          }
        }, this.opts.pollMs),
      );
      // Never started → count as failure.
      this.timers.push(
        setTimeout(() => {
          if (live() && !started && !sawSpeaking && !synth.speaking) finish(false);
        }, this.opts.startTimeoutMs),
      );
      // Hard cap: ~9 chars/s at rate 1 is far slower than any real voice.
      const capMs = this.opts.capBaseMs + (text.length * this.opts.capPerCharMs) / rate;
      this.timers.push(setTimeout(() => finish(true), capMs));
    };

    if (this.opts.cancelDelayMs > 0) this.timers.push(setTimeout(go, this.opts.cancelDelayMs));
    else go();
  }
}

let shared: Reader | null = null;
/** The app-wide reader (one voice at a time). Tests can inject a mock speechSynthesis on window first. */
export function getReader(): Reader {
  if (!shared) {
    const w = typeof window !== 'undefined' ? (window as unknown as { speechSynthesis?: SpeechSynthesis; SpeechSynthesisUtterance?: UtterCtor }) : undefined;
    shared = new Reader(w?.speechSynthesis ?? null, w?.SpeechSynthesisUtterance ?? null);
  }
  return shared;
}
