import { useEffect, useRef, useState } from 'react';
import type { SimDef } from '../../content/types';

/** Reads the current theme colours so canvas drawings match SVG and KaTeX. */
export function themeColors(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const names = ['bg', 'panel', 'line', 'ink', 'ink-dim', 'accent', 'c-active', 'c-given', 'c-result', 'c-error', 'c-done', 'q-x', 'q-f', 'q-slope', 'q-h', 'q-t', 'q-a'];
  return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim() || '#fff']));
}

/** Canvas 2D simulation with play / pause / reset and parameter sliders. */
export function SimCanvas<S>({ sim, height = 320 }: { sim: SimDef<S>; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<Record<string, number>>(() => Object.fromEntries(sim.params.map((p) => [p.id, p.init])));
  const [running, setRunning] = useState(false);
  const state = useRef<S>(sim.init(params));
  const raf = useRef(0);
  const [, tick] = useState(0);

  const draw = () => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth || 640;
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(height * dpr);
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);
    sim.draw(ctx, state.current, w, height, themeColors());
  };

  useEffect(() => {
    state.current = sim.init(params);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, params]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      state.current = sim.step(state.current, dt, params);
      draw();
      tick((n) => (n + 1) % 1e6);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, sim, params]);

  return (
    <div className="sim" data-testid={`sim-${sim.id}`}>
      <canvas ref={ref} className="sim" style={{ height }} role="img" aria-label={sim.title} />
      <div className="ctrls row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={() => setRunning((r) => !r)} data-testid="sim-play">
          {running ? '❚❚ Pause' : '▶ Run'}
        </button>
        <button
          className="btn"
          onClick={() => {
            setRunning(false);
            state.current = sim.init(params);
            draw();
          }}
        >
          ⟲ Reset
        </button>
        {sim.params.map((p) => (
          <label key={p.id} className="ctl inline">
            <span>
              {p.label}: <b className="mono">{p.format ? p.format(params[p.id]) : params[p.id]}</b>
            </span>
            <input type="range" min={p.min} max={p.max} step={p.step} value={params[p.id]} onChange={(e) => setParams((x) => ({ ...x, [p.id]: Number(e.target.value) }))} />
          </label>
        ))}
      </div>
    </div>
  );
}
