import { useEffect, useState } from 'react';
import { python, type PyStatus, type RunResult } from '../../py/client';
import { CodeEditor } from './CodeEditor';

export function usePyStatus(): PyStatus {
  const [s, setS] = useState<PyStatus>(python.status);
  useEffect(() => {
    const un = python.onStatus(setS);
    return () => {
      un();
    };
  }, []);
  return s;
}

export function ResultView({ r }: { r: RunResult }) {
  const passed = r.tests?.filter((t) => t.ok).length ?? 0;
  return (
    <div className="result" data-testid="run-result">
      {r.tests && (
        <>
          <p className={passed === r.tests.length ? 'r-done' : 'r-error'} data-testid="test-summary">
            <b>
              {passed} of {r.tests.length} tests passed
            </b>
            {passed === r.tests.length && r.tests.length > 0 ? ' — well done.' : ''}
          </p>
          <ul className="tests">
            {r.tests.map((t, i) => (
              <li key={i} className={t.ok ? 'ok' : 'bad'}>
                {t.name}
                {!t.ok && t.message && <span className="m">{t.message}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {r.error && !r.tests && <div className="out err">{r.error}</div>}
      {r.stdout && <div className="out">{r.stdout}</div>}
      {r.images.map((b64, i) => (
        <img key={i} className="plot-img" src={`data:image/png;base64,${b64}`} alt={`Plot ${i + 1} produced by your code`} />
      ))}
    </div>
  );
}

/**
 * Editor + Run / Run tests. `tests` are Python test_* functions run after the code.
 * Calls onPass when every test passes.
 */
export function CodeRunner({
  id,
  starter,
  value,
  onChange,
  tests,
  onPass,
  solution,
}: {
  id: string;
  starter: string;
  value: string;
  onChange: (v: string) => void;
  tests?: string;
  onPass?: () => void;
  solution?: string;
}) {
  const [res, setRes] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [stream, setStream] = useState('');
  const py = usePyStatus();

  const go = async (withTests: boolean) => {
    setBusy(true);
    setRes(null);
    setStream('');
    setStatus(py === 'ready' ? 'Running…' : 'Starting Python (first time takes a few seconds)…');
    const r = await python.run(value, withTests ? tests : undefined, (t) => setStream((s) => s + t), setStatus);
    setBusy(false);
    setStatus('');
    setRes(r);
    if (withTests && r.tests && r.tests.length && r.tests.every((t) => t.ok)) onPass?.();
  };

  return (
    <div className="code-wrap" data-testid={`runner-${id}`}>
      <CodeEditor value={value} onChange={onChange} label={`Python editor for ${id}`} testId="editor" />
      <div className="bar">
        <button className="btn" onClick={() => go(false)} disabled={busy}>
          ▶ Run
        </button>
        {tests && (
          <button className="btn primary" onClick={() => go(true)} disabled={busy} data-testid="run-tests">
            ✓ Run tests
          </button>
        )}
        <button className="btn ghost small" onClick={() => onChange(starter)} disabled={busy}>
          Reset to starter
        </button>
        {solution && (
          <details className="sol">
            <summary className="btn ghost small">Show reference solution</summary>
            <pre className="static">{solution}</pre>
          </details>
        )}
        <span className="faint py-status">
          {busy ? status : py === 'loading' ? 'Python loading…' : py === 'ready' ? 'Python ready' : py === 'error' ? 'Python failed to start' : 'Python starts on your first run'}
        </span>
      </div>
      {busy && stream && <div className="out">{stream}</div>}
      {res && <ResultView r={res} />}
    </div>
  );
}
