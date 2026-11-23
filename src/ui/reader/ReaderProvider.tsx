import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getReader, type ReadLine, type ReaderState } from '../../engine/reader';
import { useProgress } from '../state';

interface ReaderCtx {
  state: ReaderState;
  line: number;
  count: number;
  error: string;
  voices: SpeechSynthesisVoice[];
  available: boolean;
  /** Pages call this with their readable lines (order = reading order). */
  setLines: (lines: ReadLine[]) => void;
  play: (from?: number) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  /** Narrate one caption (animations). Resolves when done; resolves immediately if narration is off. */
  narrate: (text: string) => Promise<void>;
}

const Ctx = createContext<ReaderCtx | null>(null);

function reducedMotion() {
  return document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Highlight the spoken word inside line element `el`, using the CSS Custom Highlight API when present. */
function highlightWord(el: Element, a: number, b: number) {
  document.querySelectorAll('.word-active').forEach((n) => n.classList.remove('word-active'));
  const hl = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
  hl?.delete('ml-word');
  const segs = [...el.querySelectorAll<HTMLElement>('[data-a]')];
  // Offsets: line-level elements (eq, code, caption) have no segments → highlight whole element.
  const seg = segs.find((s) => a >= Number(s.dataset.a) && a < Number(s.dataset.b));
  if (!seg) return;
  const sa = Number(seg.dataset.a);
  const isText = seg.classList.contains('seg') && !seg.classList.contains('seg-math') && !seg.classList.contains('term');
  const node = isText ? firstText(seg) : null;
  const HL = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  if (node && hl && HL) {
    const len = node.textContent?.length ?? 0;
    const r = document.createRange();
    r.setStart(node, Math.max(0, Math.min(len, a - sa)));
    r.setEnd(node, Math.max(0, Math.min(len, b - sa)));
    hl.set('ml-word', new HL(r));
  } else {
    seg.classList.add('word-active'); // fallback: whole segment
  }
}
function firstText(n: Node): Text | null {
  if (n.nodeType === Node.TEXT_NODE) return n as Text;
  for (const c of n.childNodes) {
    const t = firstText(c);
    if (t) return t;
  }
  return null;
}

export function ReaderProvider({ children }: { children: ReactNode }) {
  const reader = getReader();
  const { data } = useProgress();
  const s = data.settings;
  const [state, setState] = useState<ReaderState>(reader.state);
  const [line, setLine] = useState(0);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => reader.voices());
  const narrateOn = useRef(s.narrate);
  narrateOn.current = s.narrate;
  const loc = useLocation();

  useEffect(() => {
    reader.setOptions({ rate: s.rate, voiceName: s.voice, skipCode: s.skipCode });
  }, [reader, s.rate, s.voice, s.skipCode]);

  useEffect(() => {
    const clear = () => {
      document.querySelectorAll('[data-line].reading').forEach((n) => n.classList.remove('reading'));
      document.querySelectorAll('.word-active').forEach((n) => n.classList.remove('word-active'));
      (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.delete('ml-word');
    };
    const un = reader.subscribe({
      onState: (st) => {
        setState(st);
        if (st === 'idle') clear();
        if (st === 'playing') setError('');
      },
      onError: (m) => setError(m),
      onLine: (i) => {
        setLine(i);
        clear();
        const el = document.querySelector(`[data-line="${i}"]`);
        if (el) {
          el.classList.add('reading');
          el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
        }
      },
      onWord: (i, a, b) => {
        const el = document.querySelector(`[data-line="${i}"]`);
        if (el) highlightWord(el, a, b);
      },
    });
    return () => {
      un();
    };
  }, [reader]);

  // voices can arrive late
  useEffect(() => {
    const synth = (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!synth) return;
    const upd = () => setVoices(reader.voices());
    upd();
    synth.addEventListener?.('voiceschanged', upd);
    const t = setTimeout(upd, 1500);
    return () => {
      synth.removeEventListener?.('voiceschanged', upd);
      clearTimeout(t);
    };
  }, [reader]);

  // pause when the tab is hidden; stop on navigation
  useEffect(() => {
    const h = () => {
      if (document.hidden) reader.pause();
    };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [reader]);
  useEffect(() => {
    reader.stop();
  }, [loc.pathname, reader]);

  const setLines = useCallback(
    (lines: ReadLine[]) => {
      reader.setLines(lines);
      setCount(lines.length);
      setLine(0);
    },
    [reader],
  );

  const value: ReaderCtx = {
    state,
    line,
    count,
    error,
    voices,
    available: reader.available,
    setLines,
    play: (from) => reader.play(from),
    toggle: () => reader.toggle(),
    stop: () => reader.stop(),
    next: () => reader.next(),
    prev: () => reader.prev(),
    narrate: (text) => (narrateOn.current && reader.available ? reader.speakOnce(text) : Promise.resolve()),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReader(): ReaderCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useReader outside ReaderProvider');
  return c;
}

/** Register a page's lines while it is mounted. */
export function useReadable(lines: ReadLine[], key: string) {
  const { setLines } = useReader();
  useEffect(() => {
    setLines(lines);
    return () => setLines([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setLines]);
}
