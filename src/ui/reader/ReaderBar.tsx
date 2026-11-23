import { useEffect, useState } from 'react';
import { useProgress } from '../state';
import { useReader } from './ReaderProvider';

const RATES = [0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

function typingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return !!el.closest?.('input, textarea, select, [contenteditable="true"], .cm-editor');
}

export function ReaderBar() {
  const r = useReader();
  const { data, update } = useProgress();
  const s = data.settings;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || typingTarget(e.target)) return;
      if (!r.count) return;
      if (e.key === ' ' && !(e.target as HTMLElement)?.closest?.('button, a, [role="slider"]')) {
        e.preventDefault();
        r.toggle();
      } else if (e.key === 'ArrowRight' && r.state !== 'idle') {
        e.preventDefault();
        r.next();
      } else if (e.key === 'ArrowLeft' && r.state !== 'idle') {
        e.preventDefault();
        r.prev();
      } else if (e.key === 'Escape' && r.state !== 'idle') {
        r.stop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [r]);

  const set = (fn: (st: typeof s) => void) => update((d) => fn(d.settings), { activity: false });
  const playing = r.state === 'playing';
  const label = playing ? '❚❚ Pause' : r.state === 'paused' ? '▶ Resume' : '▶ Listen';
  const status =
    r.state === 'idle' ? (r.count ? 'Ready' : 'Nothing to read here') : `Line ${Math.min(r.line + 1, r.count)} of ${r.count}`;

  return (
    <div className={`readerbar${open ? ' open' : ''}`} role="toolbar" aria-label="Reader">
      <button className={`btn ${playing ? 'on' : ''}`} onClick={() => r.toggle()} disabled={!r.count} data-testid="listen">
        {label}
      </button>
      <button className="btn" onClick={() => r.prev()} disabled={r.state === 'idle'} aria-label="Previous line" title="Previous line (←)">
        ⏮
      </button>
      <button className="btn" onClick={() => r.next()} disabled={r.state === 'idle'} aria-label="Next line" title="Next line (→)">
        ⏭
      </button>
      <button className="btn" onClick={() => r.stop()} disabled={r.state === 'idle'} aria-label="Stop" title="Stop (Esc)">
        ■
      </button>
      <span className="status" aria-live="polite" data-testid="reader-status">
        {status}
      </span>
      <button className="btn ghost small mobile-only" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ⚙ More
      </button>
      <span className="more row">
        <select className="btn" aria-label="Speed" value={s.rate} onChange={(e) => set((st) => void (st.rate = Number(e.target.value)))}>
          {RATES.map((x) => (
            <option key={x} value={x}>
              {x}×
            </option>
          ))}
        </select>
        <select className="btn voice" aria-label="Voice" value={s.voice} onChange={(e) => set((st) => void (st.voice = e.target.value))}>
          <option value="">Auto voice</option>
          {r.voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} {v.localService ? '· offline' : '· online'}
            </option>
          ))}
        </select>
        <button className={`btn ${s.skipCode ? 'on' : ''}`} aria-pressed={s.skipCode} onClick={() => set((st) => void (st.skipCode = !st.skipCode))}>
          Skip code
        </button>
        <button className={`btn ${s.narrate ? 'on' : ''}`} aria-pressed={s.narrate} onClick={() => set((st) => void (st.narrate = !st.narrate))} title="Speak animation captions and wait for them">
          🔊 Narrate
        </button>
        <button className="btn" aria-label="Smaller text" onClick={() => set((st) => void (st.textScale = Math.max(0.85, +(st.textScale - 0.1).toFixed(2))))}>
          A−
        </button>
        <button className="btn" aria-label="Larger text" onClick={() => set((st) => void (st.textScale = Math.min(1.6, +(st.textScale + 0.1).toFixed(2))))}>
          A+
        </button>
      </span>
      {r.error && (
        <span className="err" role="alert">
          {r.error}
        </span>
      )}
      {!r.available && <span className="err">This browser has no speech engine.</span>}
      {/* pages (the topic player) portal their Back / Next buttons here */}
      <span id="bar-slot" className="bar-slot" />
    </div>
  );
}
