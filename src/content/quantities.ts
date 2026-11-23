/**
 * One colour per quantity, everywhere: in SVG strokes, KaTeX (via \Q{name}{...}),
 * code identifiers and readouts. Colours are CSS variables, so themes can
 * adjust brightness while keeping the hue (and the meaning) fixed.
 *
 * In TeX:   \Q{slope}{f'(a)}   →  <span class="q-slope">f'(a)</span>
 *           \R{error}{...}     →  role colour (active, given, result, error, done)
 */
export interface Quantity {
  cls: `q-${string}`;
  name: string;
  meaning: string;
}

export const QUANTITIES: Quantity[] = [
  { cls: 'q-x', name: 'input / position', meaning: 'The input variable x, or position in physics.' },
  { cls: 'q-f', name: 'output / function value', meaning: 'f(x), y — what the function gives back.' },
  { cls: 'q-slope', name: 'rate of change / velocity', meaning: 'Derivatives, slopes, velocity v = dx/dt.' },
  { cls: 'q-h', name: 'small step', meaning: 'h, Δx, Δt, dt — the step size or nudge.' },
  { cls: 'q-t', name: 'time', meaning: 'Time t.' },
  { cls: 'q-a', name: 'acceleration / second derivative', meaning: 'a = dv/dt, f″(x), curvature.' },
];

export const ROLES = [
  { cls: 'r-active', name: 'current / active', meaning: 'What is happening right now.' },
  { cls: 'r-given', name: 'input / given', meaning: 'What you start with.' },
  { cls: 'r-result', name: 'result', meaning: 'What you compute.' },
  { cls: 'r-error', name: 'error / instability', meaning: 'Something going wrong, or the size of an error.' },
  { cls: 'r-done', name: 'done / correct', meaning: 'Finished or checked.' },
] as const;

/** CSS variable for a role or quantity class, usable in SVG/canvas. */
export function colorVar(c: string | undefined): string {
  if (!c) return 'var(--ink)';
  if (c.startsWith('q-')) return `var(--${c})`;
  return `var(--c-${c})`;
}

export const KATEX_MACROS: Record<string, string> = {
  '\\Q': '\\htmlClass{q-#1}{#2}',
  '\\R': '\\htmlClass{r-#1}{#2}',
  '\\dd': '\\mathrm{d}',
};
