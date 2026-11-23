/**
 * Main-thread Python client: one worker, one job at a time, hard timeout,
 * automatic restart after a timeout or crash.
 */
export interface TestResult { name: string; ok: boolean; message: string }
export interface RunResult {
  ok: boolean;
  error: string | null;
  tests: TestResult[] | null;
  images: string[]; // base64 PNG
  stdout: string;
  timedOut?: boolean;
}

type Listener = (s: PyStatus) => void;
export type PyStatus = 'cold' | 'loading' | 'ready' | 'busy' | 'error';

const TIMEOUT = Number(import.meta.env?.VITE_PY_TIMEOUT_MS ?? 15000) || 15000;
const BOOT_TIMEOUT = 120000;

class PythonClient {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<Listener>();
  status: PyStatus = 'cold';
  lastError = '';

  onStatus(l: Listener) {
    this.listeners.add(l);
    l(this.status);
    return () => this.listeners.delete(l);
  }
  private set(s: PyStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  private spawn() {
    this.worker?.terminate();
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.ready = null;
  }

  /** Start Python (downloads ~13 MB the first time; cached for offline afterwards). */
  init(): Promise<void> {
    if (this.ready) return this.ready;
    if (!this.worker) this.spawn();
    this.set('loading');
    const w = this.worker!;
    const id = this.nextId++;
    this.ready = new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        this.lastError = 'Python took too long to start.';
        this.set('error');
        this.restart();
        reject(new Error(this.lastError));
      }, BOOT_TIMEOUT);
      const on = (ev: MessageEvent) => {
        if (ev.data.id !== id) return;
        if (ev.data.type === 'ready') {
          clearTimeout(t);
          w.removeEventListener('message', on);
          this.set('ready');
          resolve();
        } else if (ev.data.type === 'fatal') {
          clearTimeout(t);
          w.removeEventListener('message', on);
          this.lastError = ev.data.error;
          this.set('error');
          this.ready = null;
          this.spawn();
          reject(new Error(ev.data.error));
        }
      };
      w.addEventListener('message', on);
      w.postMessage({ id, type: 'init', base: import.meta.env.BASE_URL });
    });
    return this.ready;
  }

  private restart() {
    this.spawn();
    this.set('cold');
  }

  private job<T>(msg: object, onStream?: (text: string) => void, onStatus?: (s: string) => void, timeoutMs = TIMEOUT): Promise<{ result?: T; timedOut?: boolean; fatal?: string }> {
    const run = async () => {
      await this.init();
      const w = this.worker!;
      const id = this.nextId++;
      this.set('busy');
      return new Promise<{ result?: T; timedOut?: boolean; fatal?: string }>((resolve) => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const arm = () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            w.removeEventListener('message', on);
            w.removeEventListener('error', onErr);
            this.restart(); // kill the infinite loop
            resolve({ timedOut: true });
          }, timeoutMs);
        };
        const on = (ev: MessageEvent) => {
          const d = ev.data;
          if (d.id !== id) return;
          if (d.type === 'stdout' || d.type === 'stderr') onStream?.(d.text);
          else if (d.type === 'status') {
            onStatus?.(d.text);
            // package downloads shouldn't count against the run time limit
            if (d.text !== 'Running…') arm();
          } else if (d.type === 'done' || d.type === 'fatal') {
            if (timer) clearTimeout(timer);
            w.removeEventListener('message', on);
            w.removeEventListener('error', onErr);
            this.set('ready');
            resolve(d.type === 'done' ? { result: d.result } : { fatal: d.error });
          }
        };
        const onErr = () => {
          if (timer) clearTimeout(timer);
          w.removeEventListener('message', on);
          this.restart();
          resolve({ fatal: 'Python crashed and was restarted.' });
        };
        w.addEventListener('message', on);
        w.addEventListener('error', onErr);
        arm();
        w.postMessage({ ...msg, id });
      });
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => undefined);
    return p;
  }

  async run(code: string, tests?: string, onStream?: (t: string) => void, onStatus?: (s: string) => void): Promise<RunResult> {
    let stdout = '';
    try {
      const r = await this.job<Omit<RunResult, 'stdout'>>({ type: 'run', code, tests }, (t) => {
        stdout += t;
        onStream?.(t);
      }, onStatus);
      if (r.timedOut)
        return { ok: false, error: `Stopped after ${TIMEOUT / 1000} s. Is there an infinite loop? Python was restarted.`, tests: tests ? [{ name: 'finishes in time', ok: false, message: 'timed out' }] : null, images: [], stdout, timedOut: true };
      if (r.fatal) return { ok: false, error: r.fatal, tests: null, images: [], stdout };
      return { ...r.result!, stdout };
    } catch (e) {
      return { ok: false, error: `Python couldn't start: ${(e as Error).message}. If you're offline, use Settings → “Download everything for offline” next time you're online.`, tests: null, images: [], stdout };
    }
  }

  async equiv(a: string, b: string, vars: string[]): Promise<boolean | null> {
    try {
      const r = await this.job<boolean | null>({ type: 'equiv', a, b, vars }, undefined, undefined, 30000);
      return r.result ?? null;
    } catch {
      return null;
    }
  }
}

export const python = new PythonClient();
