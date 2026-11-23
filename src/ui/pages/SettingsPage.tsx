import { useEffect, useRef, useState } from 'react';
import { emptyProgress, migrate, type Settings } from '../../engine/progress';
import { downloadEverything, formatMB, offlineState, onOfflineChange, pythonCacheStatus, checkCore } from '../../offline/sw';
import { python } from '../../py/client';
import { useProgress } from '../state';
import { useReader } from '../reader/ReaderProvider';
import { ROLES, QUANTITIES } from '../../content/quantities';

export default function SettingsPage() {
  const { data, update, replace, store } = useProgress();
  const s = data.settings;
  const set = (fn: (x: Settings) => void) => update((d) => fn(d.settings));
  const reader = useReader();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `math-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importJson = async (f: File) => {
    try {
      const d = migrate(JSON.parse(await f.text()));
      replace(d);
      setMsg(`Imported progress from ${f.name}.`);
    } catch (e) {
      setMsg(`Couldn’t import: ${(e as Error).message}`);
    }
  };

  return (
    <div className="settings">
      <h1>Settings</h1>

      <section className="card">
        <h2>Look</h2>
        <div className="row" role="radiogroup" aria-label="Theme">
          {(
            [
              ['slate', 'Slate (default)'],
              ['chalk', 'Chalkboard'],
              ['paper', 'Paper (light)'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={s.theme === v} className={`btn ${s.theme === v ? 'on' : ''}`} onClick={() => set((x) => void (x.theme = v))} data-testid={`theme-${v}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span>Text size: {Math.round(s.textScale * 100)}%</span>
          <button className="btn small" onClick={() => set((x) => void (x.textScale = Math.max(0.85, +(x.textScale - 0.1).toFixed(2))))}>
            A−
          </button>
          <button className="btn small" onClick={() => set((x) => void (x.textScale = Math.min(1.6, +(x.textScale + 0.1).toFixed(2))))}>
            A+
          </button>
        </div>
        <label className="row" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={s.focus} onChange={(e) => set((x) => void (x.focus = e.target.checked))} /> Focus mode (hide everything except the current step)
        </label>
        <label className="row">
          Reduce motion:
          <select className="btn" value={s.reducedMotion} onChange={(e) => set((x) => void (x.reducedMotion = e.target.value as Settings['reducedMotion']))}>
            <option value="system">Follow my system</option>
            <option value="on">Always reduce</option>
            <option value="off">Don’t reduce</option>
          </select>
        </label>
        <h3>Colour meanings</h3>
        <div className="legend">
          {ROLES.map((r) => (
            <span key={r.cls} className={r.cls} title={r.meaning}>
              {r.name}
            </span>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 6 }}>
          {QUANTITIES.map((q) => (
            <span key={q.cls} className={q.cls} title={q.meaning}>
              {q.name}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Listening</h2>
        <div className="row">
          <label>
            Speed{' '}
            <select className="btn" value={s.rate} onChange={(e) => set((x) => void (x.rate = Number(e.target.value)))}>
              {[0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
          <label>
            Voice{' '}
            <select className="btn" value={s.voice} onChange={(e) => set((x) => void (x.voice = e.target.value))}>
              <option value="">Auto (prefers an offline voice when offline)</option>
              {reader.voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang}) {v.localService ? '· works offline' : '· needs internet'}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="row">
          <input type="checkbox" checked={s.skipCode} onChange={(e) => set((x) => void (x.skipCode = e.target.checked))} /> Skip code when reading
        </label>
        <label className="row">
          <input type="checkbox" checked={s.narrate} onChange={(e) => set((x) => void (x.narrate = e.target.checked))} /> Narrate animations (speak each caption and wait for it)
        </label>
        <p className="faint small">
          Voices marked “needs internet” (for example Chrome’s Google voices) stop working offline. Pick a voice marked “works offline” if you study without a connection.
        </p>
      </section>

      <OfflineCard />

      <section className="card">
        <h2>Your progress</h2>
        <p className="dim">
          Saved in this browser ({store.kind === 'local' ? 'localStorage' : 'Supabase'}). Export a copy to move it to another device or keep a backup.
        </p>
        <div className="row">
          <button className="btn" onClick={exportJson} data-testid="export">
            ⬇ Export progress (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} data-testid="import">
            ⬆ Import progress
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} data-testid="import-file" />
          <button
            className="btn ghost"
            onClick={() => {
              if (confirm('Reset ALL progress? Export first if you want a backup.')) {
                replace({ ...emptyProgress(), settings: data.settings });
                setMsg('Progress reset.');
              }
            }}
          >
            Reset progress…
          </button>
        </div>
        {msg && (
          <p role="status" className="verdict info">
            {msg}
          </p>
        )}
      </section>
    </div>
  );
}

function OfflineCard() {
  const [, force] = useState(0);
  const [py, setPy] = useState<{ have: number; total: number; bytes: number; totalBytes: number } | null>(null);
  const [dl, setDl] = useState<{ done: number; total: number; file: string } | null>(null);
  const [err, setErr] = useState('');
  const refresh = async () => {
    await checkCore();
    setPy(await pythonCacheStatus());
  };
  useEffect(() => {
    void refresh();
    return onOfflineChange(() => force((n) => n + 1));
  }, []);
  const pyReady = !!py && py.total > 0 && py.have === py.total;
  const ready = offlineState.coreReady && pyReady;
  return (
    <section className="card">
      <h2>Offline</h2>
      <p data-testid="offline-status" className={ready ? 'r-done' : 'dim'}>
        {ready ? (
          <b>Offline ready ✓</b>
        ) : (
          <>
            Lessons {offlineState.coreReady ? '✓ cached' : '… not cached yet'} · Python{' '}
            {py ? `${py.have} of ${py.total} files (${formatMB(py.bytes)} of ${formatMB(py.totalBytes)})` : 'checking…'}
          </>
        )}
      </p>
      <p className="dim small">
        Lessons, animations, KaTeX and fonts are saved on your first visit. Python with numpy, scipy, sympy and matplotlib is about {py ? formatMB(py.totalBytes) : '50 MB'};
        it is saved as you use it, or all at once here.
      </p>
      {!pyReady && (
        <button
          className="btn primary"
          disabled={!!dl || !offlineState.online}
          data-testid="download-all"
          onClick={async () => {
            setErr('');
            try {
              await downloadEverything((done, total, file) => setDl({ done, total, file }));
              setDl(null);
              await refresh();
              void python.init(); // warm up so the first run offline is instant
            } catch (e) {
              setErr((e as Error).message);
              setDl(null);
            }
          }}
        >
          ⬇ Download everything for offline
        </button>
      )}
      {dl && (
        <div style={{ marginTop: 10 }}>
          <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={dl.total} aria-valuenow={dl.done}>
            <i style={{ width: `${(dl.done / dl.total) * 100}%` }} />
          </div>
          <p className="faint small">
            {formatMB(dl.done)} of {formatMB(dl.total)} · {dl.file}
          </p>
        </div>
      )}
      {err && <p className="r-error">{err}</p>}
      {!offlineState.online && <p className="r-error">You’re offline right now.</p>}
    </section>
  );
}
