import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createStore, emptyProgress, today, type ProgressData, type ProgressStore, type TopicProgress } from '../engine/progress';

interface Ctx {
  data: ProgressData;
  update: (fn: (d: ProgressData) => void) => void;
  replace: (d: ProgressData) => void;
  store: ProgressStore;
}
const ProgressCtx = createContext<Ctx | null>(null);

/** Loads progress BEFORE rendering the app, so nothing can overwrite saved work with defaults. */
export function ProgressProvider({ children, store: injected }: { children: ReactNode; store?: ProgressStore }) {
  const store = useMemo(() => injected ?? createStore(), [injected]);
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<ProgressData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.load().then(setData, (e) => setError(String(e)));
  }, [store]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current) {
      const d = pending.current;
      pending.current = null;
      void store.save(d);
    }
  }, [store]);

  useEffect(() => {
    const h = () => flush();
    window.addEventListener('pagehide', h);
    document.addEventListener('visibilitychange', h);
    return () => {
      window.removeEventListener('pagehide', h);
      document.removeEventListener('visibilitychange', h);
    };
  }, [flush]);

  const commit = useCallback(
    (next: ProgressData) => {
      next.updatedAt = new Date().toISOString();
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 250);
      setData(next);
    },
    [flush],
  );

  const update = useCallback(
    (fn: (d: ProgressData) => void) => {
      setData((cur) => {
        const next: ProgressData = structuredClone(cur ?? emptyProgress());
        fn(next);
        const t = today();
        if (!next.activity.includes(t)) next.activity = [...next.activity.slice(-400), t];
        next.updatedAt = new Date().toISOString();
        pending.current = next;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, 250);
        return next;
      });
    },
    [flush],
  );

  if (error) return <div style={{ padding: 40 }}>Couldn’t load your progress: {error}</div>;
  if (!data) return <div className="loading" style={{ padding: 40 }} aria-busy="true">Loading your progress…</div>;
  return <ProgressCtx.Provider value={{ data, update, replace: commit, store }}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error('useProgress outside provider');
  return c;
}

export function topicProgress(d: ProgressData, id: string): TopicProgress {
  return d.topics[id] ?? { step: 0, completed: [], answers: {}, code: {} };
}

export function useTopicProgress(id: string) {
  const { data, update } = useProgress();
  const tp = topicProgress(data, id);
  const set = useCallback(
    (fn: (t: TopicProgress) => void) =>
      update((d) => {
        const t = (d.topics[id] ??= { step: 0, completed: [], answers: {}, code: {} });
        fn(t);
      }),
    [id, update],
  );
  return [tp, set] as const;
}
