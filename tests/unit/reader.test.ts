import { describe, it, expect, beforeEach } from 'vitest';
import { Reader, splitChunks, SPEECH_FAILED_MSG, type ReadLine } from '../../src/engine/reader';
import { installSpeechMock, type SpeechQuirks } from '../mocks/speechMock';

const LINES: ReadLine[] = [
  { id: 'a', text: 'The derivative is a rate of change.' },
  { id: 'b', text: 'print(x)', kind: 'code' },
  { id: 'c', text: 'd v by d t equals minus g.' },
  { id: 'd', text: 'That is all.' },
];

function make(q: SpeechQuirks, extra = {}) {
  const m = installSpeechMock({ msPerWord: 4, ...q });
  const r = new Reader(m.synth as unknown as SpeechSynthesis, m.Utterance as any, {
    cancelDelayMs: 5, pollMs: 20, startTimeoutMs: 150, capBaseMs: 200, capPerCharMs: 5, ...extra,
  });
  r.setLines(LINES);
  const log = { lines: [] as number[], words: [] as number[], errors: [] as string[], states: [] as string[] };
  r.subscribe({
    onLine: (i) => log.lines.push(i),
    onWord: (i) => log.words.push(i),
    onError: (e) => log.errors.push(e),
    onState: (s) => log.states.push(s),
  });
  return { r, m, log };
}

function untilIdle(r: Reader, ms = 4000) {
  return new Promise<void>((res, rej) => {
    const t0 = Date.now();
    const id = setInterval(() => {
      if (r.state === 'idle' || r.state === 'error') { clearInterval(id); res(); }
      else if (Date.now() - t0 > ms) { clearInterval(id); rej(new Error('timeout, state=' + r.state)); }
    }, 10);
  });
}

function gesture(fn: () => void) {
  (globalThis as any).__inGesture = true;
  try { fn(); } finally { (globalThis as any).__inGesture = false; }
}

describe('splitChunks', () => {
  it('keeps offsets exact', () => {
    const t = 'One. Two two two two two two two two two two two two two two two two, three three three three three three three three three three. Four!';
    const cs = splitChunks(t, 40);
    for (const c of cs) expect(t.slice(c.start, c.start + c.text.length)).toBe(c.text);
    expect(cs.every((c) => c.text.length <= 40)).toBe(true);
  });
});

describe('Reader under browser quirks', () => {
  beforeEach(() => { (globalThis as any).__inGesture = false; });

  it('normal browser: reads every line, skips code, highlights words', async () => {
    const { r, m, log } = make({});
    gesture(() => r.play());
    await untilIdle(r);
    expect(log.lines).toEqual([0, 2, 3]);
    expect(m.spoken.filter((s) => s.trim())).toEqual([LINES[0].text, LINES[2].text, LINES[3].text]);
    expect(log.words.length).toBeGreaterThan(5);
    expect(log.errors).toEqual([]);
  });

  it('reads code when skipCode is off', async () => {
    const { r, log } = make({}, { skipCode: false });
    gesture(() => r.play());
    await untilIdle(r);
    expect(log.lines).toEqual([0, 1, 2, 3]);
  });

  it('Chrome: onend never fires → polling advances', async () => {
    const { r, log } = make({ noOnEnd: true });
    gesture(() => r.play());
    await untilIdle(r);
    expect(log.lines).toEqual([0, 2, 3]);
    expect(log.errors).toEqual([]);
  });

  it('stuck speaking flag → hard time cap advances', async () => {
    const { r, log } = make({ stuckSpeaking: true });
    gesture(() => r.play());
    await untilIdle(r, 6000);
    expect(log.lines).toEqual([0, 2, 3]);
  });

  it('Safari: needs a gesture; the primer in play() unlocks it', async () => {
    const { r, m, log } = make({ needGesture: true });
    gesture(() => r.play());
    await untilIdle(r);
    expect(m.spoken).toContain(LINES[3].text);
    expect(log.errors).toEqual([]);
  });

  it('no voices at first → still speaks with the default voice', async () => {
    const { r, m } = make({ noVoicesAtFirst: true });
    gesture(() => r.play());
    await untilIdle(r);
    expect(m.spoken).toContain(LINES[0].text);
  });

  it('no boundary events → timed word fallback still moves the highlight', async () => {
    const { r, log } = make({ noBoundary: true, msPerWord: 80 }, { pollMs: 20, capBaseMs: 3000 });
    gesture(() => r.play());
    await untilIdle(r, 8000);
    expect(log.words.length).toBeGreaterThan(0);
  });

  it('broken engine → clear message after repeated failures', async () => {
    const { r, log } = make({ neverStart: true });
    gesture(() => r.play());
    await untilIdle(r);
    expect(r.state).toBe('error');
    expect(log.errors).toEqual([SPEECH_FAILED_MSG]);
  });

  it('stale callbacks are ignored after next()', async () => {
    const { r, log } = make({ msPerWord: 30 });
    gesture(() => r.play());
    await new Promise((res) => setTimeout(res, 40));
    r.next();
    await untilIdle(r);
    expect(log.lines[0]).toBe(0);
    expect(log.lines).toContain(2);
    // line 0 must not be "finished" later and push us back
    expect(log.lines.filter((x) => x === 0).length).toBe(1);
  });

  it('pause and resume continue from the current word', async () => {
    const { r, m } = make({ msPerWord: 30 });
    gesture(() => r.play());
    await new Promise((res) => setTimeout(res, 120));
    r.pause();
    expect(r.state).toBe('paused');
    const before = m.spoken.length;
    gesture(() => r.resume());
    await untilIdle(r);
    const resumed = m.spoken[before];
    expect(LINES[0].text.endsWith(resumed) || resumed === LINES[2].text).toBe(true);
  });

  it('speakOnce resolves even when onend never fires', async () => {
    const { r } = make({ noOnEnd: true });
    await r.speakOnce('frame caption one');
    expect(r.state).toBe('idle');
  });
});
