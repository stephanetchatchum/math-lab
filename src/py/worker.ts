/// <reference lib="webworker" />
/**
 * Pyodide in a Web Worker. The main thread kills and restarts this worker on
 * timeout (infinite loops) or crash. All files come from /pyodide/ on our own
 * origin, cached by the service worker — no CDN.
 */
import { PY_HARNESS } from './harness';
import { PY_PACKAGES } from './version';

type Msg =
  | { id: number; type: 'init'; base: string }
  | { id: number; type: 'run'; code: string; tests?: string }
  | { id: number; type: 'equiv'; a: string; b: string; vars: string[] };

interface PyodideLike {
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(names: string[] | string, opts?: { messageCallback?: (m: string) => void; errorCallback?: (m: string) => void }): Promise<unknown>;
  loadPackagesFromImports(code: string, opts?: { messageCallback?: (m: string) => void }): Promise<unknown>;
  setStdout(o: { batched: (s: string) => void }): void;
  setStderr(o: { batched: (s: string) => void }): void;
  globals: { get(name: string): (...a: unknown[]) => unknown };
}

let ready: Promise<PyodideLike> | null = null;
let currentId = 0;

const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

async function boot(base: string): Promise<PyodideLike> {
  const url = `${base}pyodide/pyodide.mjs`;
  const mod = (await import(/* @vite-ignore */ url)) as { loadPyodide: (o: object) => Promise<PyodideLike> };
  const p = await mod.loadPyodide({ indexURL: `${base}pyodide/` });
  p.setStdout({ batched: (s) => post({ id: currentId, type: 'stdout', text: s + '\n' }) });
  p.setStderr({ batched: (s) => post({ id: currentId, type: 'stderr', text: s + '\n' }) });
  await p.runPythonAsync(PY_HARNESS);
  return p;
}

self.onmessage = async (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  currentId = m.id;
  try {
    if (m.type === 'init') {
      ready ??= boot(m.base);
      await ready;
      post({ id: m.id, type: 'ready' });
      return;
    }
    const p = await (ready ?? Promise.reject(new Error('Python not initialised')));
    if (m.type === 'run') {
      post({ id: m.id, type: 'status', text: 'Loading packages…' });
      await p.loadPackagesFromImports(m.code + '\n' + (m.tests ?? ''), {
        messageCallback: (s) => post({ id: m.id, type: 'status', text: s }),
      });
      post({ id: m.id, type: 'status', text: 'Running…' });
      const fn = p.globals.get('mathlab_run');
      const json = fn(m.code, m.tests ?? null) as string;
      post({ id: m.id, type: 'done', result: JSON.parse(json) });
    } else if (m.type === 'equiv') {
      await p.loadPackage(['sympy']);
      const fn = p.globals.get('mathlab_equiv');
      const r = fn(m.a, m.b, m.vars) as string;
      post({ id: m.id, type: 'done', result: JSON.parse(r) });
    }
  } catch (e) {
    post({ id: m.id, type: 'fatal', error: String((e as Error)?.message ?? e) });
  }
};

export { PY_PACKAGES };
