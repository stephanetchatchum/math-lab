/**
 * A fake speechSynthesis that reproduces real browser quirks.
 * Self-contained (no imports, no closures) so Playwright can inject it with addInitScript.
 */
export interface SpeechQuirks {
  noOnEnd?: boolean; // Chrome: onend never fires (speaking does go false)
  stuckSpeaking?: boolean; // speaking stays true forever, no onend
  needGesture?: boolean; // Safari: ignored until a speak() happens during a user gesture
  noVoicesAtFirst?: boolean; // voices arrive later via voiceschanged
  noBoundary?: boolean; // no word boundary events
  neverStart?: boolean; // engine is broken: nothing ever happens
  msPerWord?: number;
}

export function installSpeechMock(quirks: SpeechQuirks) {
  const g = globalThis as unknown as Record<string, unknown>;
  const q = quirks || {};
  const msPerWord = q.msPerWord ?? 60;
  const spoken: string[] = [];
  const events: string[] = [];
  g.__spoken = spoken;
  g.__speechEvents = events;
  let unlocked = !q.needGesture;
  let voicesReady = !q.noVoicesAtFirst;
  const voices = [
    { name: 'Mock English', lang: 'en-GB', default: true, localService: true, voiceURI: 'mock-en' },
    { name: 'Mock Online', lang: 'en-US', default: false, localService: false, voiceURI: 'mock-online' },
  ];
  const listeners: Record<string, Array<() => void>> = {};
  let current: { u: Record<string, any>; timers: ReturnType<typeof setTimeout>[] } | null = null;

  class Utterance {
    text: string;
    rate = 1;
    volume = 1;
    pitch = 1;
    lang = '';
    voice: unknown = null;
    onstart: ((e: unknown) => void) | null = null;
    onend: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onboundary: ((e: unknown) => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }

  function isGesture(): boolean {
    const nav = (globalThis as any).navigator;
    if ((globalThis as any).__inGesture) return true;
    return !!(nav && nav.userActivation && nav.userActivation.isActive);
  }

  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices() {
      return voicesReady ? voices : [];
    },
    addEventListener(type: string, fn: () => void) {
      (listeners[type] ||= []).push(fn);
    },
    removeEventListener(type: string, fn: () => void) {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
    },
    onvoiceschanged: null as null | (() => void),
    cancel() {
      if (current) {
        const c = current;
        current = null;
        c.timers.forEach(clearTimeout);
        events.push('cancel');
        if (!q.stuckSpeaking) synth.speaking = false;
        c.u.onerror?.({ error: 'interrupted' });
      }
      if (!q.stuckSpeaking) synth.speaking = false;
    },
    pause() {},
    resume() {},
    speak(u: any) {
      if (q.needGesture && !unlocked) {
        if (isGesture()) unlocked = true;
        else {
          events.push('dropped:' + u.text);
          return; // silently ignored, like Safari
        }
      }
      if (q.neverStart) {
        events.push('dead:' + u.text);
        return;
      }
      if (current) synth.cancel();
      const timers: ReturnType<typeof setTimeout>[] = [];
      current = { u, timers };
      spoken.push(u.text);
      synth.speaking = true;
      const words: { i: number; len: number }[] = [];
      const re = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(u.text))) words.push({ i: m.index, len: m[0].length });
      const per = msPerWord / (u.rate || 1);
      timers.push(setTimeout(() => u.onstart?.({}), 5));
      if (!q.noBoundary)
        words.forEach((w, k) =>
          timers.push(setTimeout(() => u.onboundary?.({ name: 'word', charIndex: w.i, charLength: w.len }), 6 + k * per)),
        );
      timers.push(
        setTimeout(() => {
          if (current?.u !== u) return;
          if (q.stuckSpeaking) return; // never ends
          current = null;
          synth.speaking = false;
          if (!q.noOnEnd) u.onend?.({});
        }, 10 + Math.max(1, words.length) * per),
      );
    },
  };

  if (q.noVoicesAtFirst)
    setTimeout(() => {
      voicesReady = true;
      (listeners.voiceschanged || []).forEach((f) => f());
      synth.onvoiceschanged?.();
    }, 300);

  Object.defineProperty(globalThis, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true, writable: true });
  return { synth, Utterance, spoken, events };
}
