/**
 * Small helpers for writing topic files: scenes, frames, sampling.
 * Pure functions only, so `npm run verify` can run every animation in Node.
 */
import type { AnimationDef, Eq, Frame, Pt, Scene, SceneItem } from './types';

export const range = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
export const logRange = (a: number, b: number, n: number) => range(Math.log10(a), Math.log10(b), n).map((v) => Math.pow(10, v));

/** Format a number for captions: 3 significant figures, no trailing junk. */
export const fmt = (v: number, sig = 3) => {
  if (!Number.isFinite(v)) return String(v);
  if (v !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5)) return v.toExponential(sig - 1).replace('e', '×10^');
  return String(+v.toPrecision(sig));
};

export function scene(x: [number, number], y: [number, number], items: SceneItem[], alt: string, extra: Partial<Scene> = {}): Scene {
  return { x, y, items, alt, ...extra };
}

export function frame(sc: Scene, caption: string, eq?: Eq): Frame {
  return eq ? { scene: sc, caption, eq } : { scene: sc, caption };
}

export function anim(id: string, title: string, frames: Frame[]): AnimationDef {
  return { id, title, frames };
}

/** Secant through (a, f(a)) and (a+h, f(a+h)). */
export function secant(f: (x: number) => number, a: number, h: number): { slope: number; p: Pt; q: Pt } {
  const p: Pt = [a, f(a)];
  const q: Pt = [a + h, f(a + h)];
  return { slope: (q[1] - p[1]) / h, p, q };
}
