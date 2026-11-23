/**
 * Calculus 1.2 — The derivative.
 * Every number quoted in the text was checked in Python (see `npm run verify`
 * and scripts/checks/derivative.py).
 */
import type { AnimationDef, Frame, MeterData, Pt, SandboxDef, Scene, SceneItem, SimDef, Topic } from '../../types';
import { anim, fmt, frame, range, scene } from '../../lib';

const R = String.raw;

// ------------------------------------------------------------------ shared maths

const sq = (x: number) => x * x;
const fwd = (f: (x: number) => number, x: number, h: number) => (f(x + h) - f(x)) / h;
const ctr = (f: (x: number) => number, x: number, h: number) => (f(x + h) - f(x - h)) / (2 * h);

// ------------------------------------------------------------------ animations

/** Secant through x = 1 on y = x² swinging into the tangent. */
function secantToTangent(): AnimationDef {
  const a = 1;
  const hs = [1.5, 1, 0.75, 0.5, 0.3, 0.2, 0.1, 0.05, 0.01];
  const frames: Frame[] = hs.map((h, k) => {
    const m = (sq(a + h) - sq(a)) / h;
    const last = k === hs.length - 1;
    const items: SceneItem[] = [
      { kind: 'fn', f: sq, role: 'q-f', width: 3.5 },
      { kind: 'line', through: [a, 1], slope: 2, role: 'result', dash: true, width: 2 },
      { kind: 'line', through: [a, 1], slope: m, role: 'active', width: 3 },
      { kind: 'segment', a: [a, -0.6], b: [a + h, -0.6], role: 'q-h', width: 3 },
      { kind: 'label', at: [a + h / 2, -0.95], text: `h = ${h}`, role: 'q-h', anchor: 'middle', hand: true, size: 20 },
      { kind: 'point', at: [a, 1], role: 'q-x', label: 'P', labelDir: 'nw' },
      { kind: 'point', at: [a + h, sq(a + h)], role: 'active', label: 'Q', labelDir: 'se' },
      { kind: 'label', at: [-0.4, 6.3], text: `secant slope = ${fmt(m, 4)}`, role: 'q-slope', hand: true, size: 24 },
    ];
    const sc = scene([-0.5, 3], [-1.2, 7], items, `Graph of y equals x squared. Secant through x equals 1 and x equals ${1 + h}, slope ${fmt(m, 4)}. The tangent at x equals 1, slope 2, is dashed.`);
    const cap =
      k === 0
        ? `Start with a big step, h = 1.5. The secant through P and Q has slope ${fmt(m, 4)}.`
        : last
          ? `h = 0.01: slope ${fmt(m, 4)}. The secant is almost on top of the tangent, whose slope is exactly 2.`
          : `h = ${h}: Q slides towards P and the slope drops to ${fmt(m, 4)}. It is always 2 plus h.`;
    return frame(sc, cap, {
      tex: R`\frac{(1+\Q{h}{${h}})^2-1^2}{\Q{h}{${h}}} = 2+\Q{h}{${h}} = \Q{slope}{${fmt(m, 4)}}`,
      say: `1 plus ${h}, squared, minus 1, over ${h}, equals 2 plus ${h}, which is ${fmt(m, 4)}`,
    });
  });
  return anim('secant-tangent', 'A secant becomes the tangent', frames);
}

/** Zoom in on a curve until it looks straight (local linearity). */
function zoomIn(): AnimationDef {
  const f = (x: number) => Math.sin(x) + 0.3 * x * x;
  const df = (x: number) => Math.cos(x) + 0.6 * x;
  const a = 1;
  const widths = [6, 3, 1.5, 0.6, 0.2, 0.05];
  const frames = widths.map((w, k) => {
    const hw = w / 2;
    const hh = (w * 400) / 640 / 2;
    const sc = scene(
      [a - hw, a + hw],
      [f(a) - hh, f(a) + hh],
      [
        { kind: 'fn', f, role: 'q-f', width: 3.5 },
        { kind: 'line', through: [a, f(a)], slope: df(a), role: 'result', dash: true, width: 2 },
        { kind: 'point', at: [a, f(a)], role: 'q-x', r: 5 },
      ],
      `Window of width ${w} around x equals 1 on the curve sine x plus 0.3 x squared, with its tangent dashed.`,
      { grid: false },
    );
    const cap = [
      'Window 6 units wide: the curve clearly bends away from its tangent (dashed).',
      'Zoom in, width 3. Still curved, but less obviously.',
      'Width 1.5: the curve hugs the tangent near the point.',
      'Width 0.6: you would struggle to tell them apart.',
      'Width 0.2: curve and tangent overlap.',
      'Width 0.05: indistinguishable. Up close, a differentiable function is a straight line, and its slope is the derivative.',
    ][k];
    return frame(sc, cap);
  });
  return anim('zoom', 'Zoom in until it is straight', frames);
}

/** Build f′ for sin x point by point from tangent slopes. */
function buildDerivative(): AnimationDef {
  const xs = range(0, 2 * Math.PI, 9);
  const frames = xs.map((x0, k) => {
    const pts: SceneItem[] = xs.slice(0, k + 1).map((x) => ({ kind: 'point' as const, at: [x, Math.cos(x)] as Pt, role: 'q-slope' as const, r: 5 }));
    const items: SceneItem[] = [
      { kind: 'fn', f: Math.sin, role: 'q-f', width: 3 },
      { kind: 'segment', a: [x0 - 0.7, Math.sin(x0) - 0.7 * Math.cos(x0)], b: [x0 + 0.7, Math.sin(x0) + 0.7 * Math.cos(x0)], role: 'result', width: 3 },
      { kind: 'point', at: [x0, Math.sin(x0)], role: 'q-x', r: 5 },
      { kind: 'vline', x: x0, role: 'muted' },
      ...pts,
    ];
    if (k === xs.length - 1) items.push({ kind: 'fn', f: Math.cos, role: 'q-slope', width: 2.5, dash: true });
    const s = Math.cos(x0);
    const cap =
      k === 0
        ? 'At x = 0 the tangent to sine x has slope 1. Plot that slope as a height: an orange point.'
        : k === 2
          ? 'At the top of the wave, x = 1.57, the tangent is flat: slope 0.'
          : k === 4
            ? 'At x = 3.14 the curve falls as steeply as it ever does: slope −1.'
            : k === xs.length - 1
              ? 'Join the orange points: the slope of sine x traces out cos x. That curve is the derivative function.'
              : `At x = ${fmt(x0, 3)} the slope is ${fmt(s, 2)}.`;
    return frame(scene([0, 2 * Math.PI], [-1.4, 1.4], items, `Sine curve with its tangent at x equals ${fmt(x0, 3)}; orange points mark slopes found so far.`), cap);
  });
  return anim('build-derivative', 'The derivative is a function', frames);
}

/** Forward-difference error for sin at x = 1, h = 10^-1 … 10^-15, computed in IEEE double precision (same as NumPy). */
export function forwardErrors(): { k: number; h: number; err: number }[] {
  return Array.from({ length: 15 }, (_, i) => {
    const h = Math.pow(10, -(i + 1));
    return { k: i + 1, h, err: Math.abs(fwd(Math.sin, 1, h) - Math.cos(1)) };
  });
}

function errorReveal(): AnimationDef {
  const data = forwardErrors();
  const frames = data.map((d, i) => {
    const pts: Pt[] = data.slice(0, i + 1).map((e) => [Math.log10(e.h), Math.log10(e.err)]);
    const best = data.slice(0, i + 1).reduce((a, b) => (b.err < a.err ? b : a));
    const items: SceneItem[] = [
      { kind: 'polyline', points: pts, role: 'error', width: 2.5 },
      ...pts.map((p) => ({ kind: 'point' as const, at: p, role: 'error' as const, r: 4.5 })),
    ];
    if (i === data.length - 1) items.push({ kind: 'vline', x: Math.log10(best.h), role: 'done', label: 'best h' });
    const cap =
      i === 0
        ? `h = 10⁻¹: error ${fmt(d.err)}. Moving left means a smaller step.`
        : d.k <= 6
          ? `h = 10⁻${d.k}: error ${fmt(d.err)}. Ten times smaller step, ten times smaller error: truncation error falls like h.`
          : d.k === 8
            ? `h = 10⁻⁸: error ${fmt(d.err)}, the smallest we will get.`
            : d.k < 15
              ? `h = 10⁻${d.k}: error ${fmt(d.err)}. Now rounding error, which grows like 1 over h, takes over.`
              : `h = 10⁻¹⁵: error ${fmt(d.err)}, worse than h = 0.1. Shrinking the step past about 10⁻⁸ only makes things worse.`;
    return frame(
      scene([-16, 0], [-10, 0], items, `Log-log plot of forward-difference error against step size for sine at 1. ${i + 1} points shown.`, {
        logTicks: { x: true, y: true },
        xLabel: 'step h',
        yLabel: 'error',
      }),
      cap,
    );
  });
  return anim('error-v', 'The error as h shrinks (computed in double precision)', frames);
}

// ------------------------------------------------------------------ sandbox

type Fdef = { label: string; f: (x: number) => number; df: (x: number) => number | null; y: [number, number] };
const FUNCS: Record<string, Fdef> = {
  sq: { label: 'x²', f: sq, df: (x) => 2 * x, y: [-1, 6] },
  sin: { label: 'sin x', f: Math.sin, df: Math.cos, y: [-1.6, 1.6] },
  exp: { label: 'eˣ', f: Math.exp, df: Math.exp, y: [-0.5, 6] },
  abs: { label: '|x|', f: Math.abs, df: (x) => (x === 0 ? null : Math.sign(x)), y: [-1, 2.5] },
  cbrt: { label: '∛x', f: Math.cbrt, df: (x) => (x === 0 ? null : 1 / (3 * Math.cbrt(x) ** 2)), y: [-1.6, 1.6] },
};

const secantLab: SandboxDef = {
  id: 'secant-lab',
  title: 'Secant lab',
  intro: 'Drag the point along the curve and slide the step {{\\Q{h}{h}|h}}. The yellow line is your finite-difference secant; the dashed green line is the true tangent. The meter underneath shows how the error depends on {{\\Q{h}{h}|h}} at this point.',
  choices: [
    { id: 'f', label: 'Function', init: 'sq', options: Object.entries(FUNCS).map(([value, d]) => ({ value, label: d.label })) },
    {
      id: 'kind',
      label: 'Difference',
      init: 'fwd',
      options: [
        { value: 'fwd', label: 'Forward: (f(a+h) − f(a)) / h' },
        { value: 'ctr', label: 'Central: (f(a+h) − f(a−h)) / 2h' },
      ],
    },
  ],
  sliders: [{ id: 'h', label: 'step h', min: -15, max: 0, step: 0.05, init: -0.3, log: true, role: 'q-h', format: (v) => v.toExponential(1) }],
  points: [
    {
      id: 'a',
      label: 'point a on the curve',
      init: [1, 1],
      role: 'q-x',
      constrain: (p, s) => {
        const F = FUNCS[s.choices.f];
        const x = Math.round(p[0] * 100) / 100;
        return [x, F.f(x)];
      },
    },
  ],
  render: (s) => {
    const F = FUNCS[s.choices.f];
    const a = s.points.a[0];
    const h = s.values.h;
    const central = s.choices.kind === 'ctr';
    const approx = central ? ctr(F.f, a, h) : fwd(F.f, a, h);
    const exact = F.df(a);
    const fa = F.f(a);
    const items: SceneItem[] = [{ kind: 'fn', f: F.f, role: 'q-f', width: 3.5 }];
    if (exact !== null) items.push({ kind: 'line', through: [a, fa], slope: exact, role: 'result', dash: true, width: 2 });
    const left = central ? a - h : a;
    items.push({ kind: 'line', through: [left, F.f(left)], slope: approx, role: 'active', width: 2.5 });
    if (h > 0.02) {
      items.push({ kind: 'point', at: [a + h, F.f(a + h)], role: 'active', r: 5 });
      if (central) items.push({ kind: 'point', at: [a - h, F.f(a - h)], role: 'active', r: 5 });
    }
    const err = exact === null ? null : Math.abs(approx - exact);
    return {
      scene: scene([-2, 3], F.y, items, `Graph of ${F.label} with the secant at a equals ${a} and step ${h.toExponential(1)}.`),
      readouts: [
        { label: 'point a', value: fmt(a, 3), role: 'q-x' },
        { label: 'step h', value: h.toExponential(2), role: 'q-h' },
        { label: central ? 'central difference' : 'forward difference', value: approx.toPrecision(10), role: 'q-slope' },
        { label: "true f′(a)", value: exact === null ? 'does not exist' : exact.toPrecision(10), role: 'result' },
        { label: 'error', value: err === null ? '—' : err === 0 ? '0' : err.toExponential(2), role: 'error' },
      ],
      note:
        exact === null
          ? 'No derivative here: switch between forward and central, or make h smaller. The answer never settles on one number.'
          : h < 1e-9 && !central
            ? 'Below about 10⁻⁸ the forward difference gets worse: rounding error grows like 1/h.'
            : undefined,
    };
  },
  meter: (s): MeterData => {
    const F = FUNCS[s.choices.f];
    const a = s.points.a[0];
    const exact = F.df(a);
    const hs = Array.from({ length: 61 }, (_, i) => Math.pow(10, -i / 4));
    const curve = (g: typeof fwd) => (exact === null ? [] : hs.map((h): Pt => [h, Math.max(1e-17, Math.abs(g(F.f, a, h) - exact))]));
    const digits = (g: typeof fwd) => {
      if (exact === null) return 0;
      const e = Math.abs(g(F.f, a, s.values.h) - exact);
      return Math.max(0, Math.round(-Math.log10(Math.max(e, 1e-17) / Math.max(1e-300, Math.abs(exact) || 1)) * 10) / 10);
    };
    return {
      title: 'Cost / accuracy meter',
      xLabel: 'step h',
      yLabel: 'error',
      curves: [
        { label: 'forward (2 evaluations of f, error ∝ h)', role: 'active', points: curve(fwd) },
        { label: 'central (2 evaluations of f, error ∝ h²)', role: 'q-slope', points: curve(ctr) },
      ],
      marker: { x: s.values.h, label: 'your h' },
      ops: [
        { label: 'correct digits, forward', value: digits(fwd) },
        { label: 'correct digits, central', value: digits(ctr) },
      ],
    };
  },
  tryThis: [
    'Pick {{x^2|x squared}}, keep the point at {{x=1|x equals 1}} and slide {{\\Q{h}{h}|h}} down. The secant slope heads for 2.',
    'Switch to the central difference. At the same {{h|h}} the error is far smaller, and on the meter its line is twice as steep.',
    'Push {{h|h}} below {{10^{-8}|ten to the minus eight}}. The error stops falling and climbs: that is rounding error.',
    'Choose {{|x||absolute x}} and drag the point to 0. Forward gives 1, and central gives 0. Neither is a derivative.',
  ],
};

// ------------------------------------------------------------------ hook simulation

interface Fall {
  t: number;
  y: number;
  v: number;
  marks: { t: number; y: number }[];
}
const fallSim: SimDef<Fall> = {
  id: 'falling-ball',
  title: 'A dropped ball, photographed every 0.1 s',
  params: [{ id: 'g', label: 'g (m/s²)', min: 1, max: 20, step: 0.01, init: 9.81 }],
  init: () => ({ t: 0, y: 0, v: 0, marks: [{ t: 0, y: 0 }] }),
  // velocity Verlet: exact for constant acceleration, so the sim matches y = g t² / 2
  step: (s, dt, p) => {
    if (s.t >= 2) return s;
    const step = Math.min(dt, 2 - s.t);
    const y = s.y + s.v * step + 0.5 * p.g * step * step;
    const v = s.v + p.g * step;
    const t = s.t + step;
    const marks = Math.floor(t * 10 + 1e-9) > Math.floor(s.t * 10 + 1e-9) ? [...s.marks, { t: Math.round(t * 10) / 10, y: 0.5 * p.g * (Math.round(t * 10) / 10) ** 2 }] : s.marks;
    return { t, y, v, marks };
  },
  draw: (ctx, s, w, h, c) => {
    const top = 24, bot = h - 20;
    const Y = (y: number) => top + (y / 20) * (bot - top);
    const X = w * 0.32;
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.font = '13px "Atkinson Hyperlegible", sans-serif';
    ctx.fillStyle = c['ink-dim'];
    for (let m = 0; m <= 20; m += 5) {
      ctx.beginPath();
      ctx.moveTo(X - 70, Y(m));
      ctx.lineTo(X - 58, Y(m));
      ctx.stroke();
      ctx.fillText(`${m} m`, X - 112, Y(m) + 4);
    }
    s.marks.forEach((mk) => {
      ctx.fillStyle = c['q-x'];
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(X, Y(mk.y), 7, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (Math.round(mk.t * 10) % 5 === 0) {
        ctx.fillStyle = c['ink-dim'];
        ctx.fillText(`${mk.t.toFixed(1)} s`, X + 14, Y(mk.y) + 4);
      }
    });
    ctx.fillStyle = c['c-active'];
    ctx.beginPath();
    ctx.arc(X, Y(s.y), 12, 0, 7);
    ctx.fill();
    ctx.fillStyle = c.ink;
    ctx.font = '22px "Caveat Brush", cursive';
    ctx.fillText(`t = ${s.t.toFixed(2)} s`, w * 0.58, 60);
    ctx.fillStyle = c['q-x'];
    ctx.fillText(`fallen ${s.y.toFixed(2)} m`, w * 0.58, 92);
    const n = s.marks.length;
    if (n >= 2) {
      const a = s.marks[n - 2], b = s.marks[n - 1];
      ctx.fillStyle = c['q-slope'];
      ctx.fillText(`last 0.1 s: ${((b.y - a.y) / 0.1).toFixed(2)} m/s on average`, w * 0.58, 124);
    }
  },
  check: { steps: 200, dt: 0.01, measure: (s, p) => Math.abs(s.y - 0.5 * p.g * s.t * s.t) + Math.abs(s.v - p.g * s.t), tol: 1e-9 },
};

// ------------------------------------------------------------------ figure

const fig: Scene = scene(
  [-0.5, 3],
  [-1.2, 7],
  [
    { kind: 'fn', f: sq, role: 'q-f', width: 3.5 },
    { kind: 'line', through: [1, 1], slope: 3, role: 'active', width: 3 },
    { kind: 'line', through: [1, 1], slope: 2, role: 'result', dash: true, width: 2.5 },
    { kind: 'segment', a: [1, 1], b: [2, 1], role: 'q-h', width: 2.5, dash: true },
    { kind: 'segment', a: [2, 1], b: [2, 4], role: 'q-f', width: 2.5, dash: true },
    { kind: 'label', at: [1.5, 0.45], text: 'h = 1', role: 'q-h', anchor: 'middle', hand: true, size: 20 },
    { kind: 'label', at: [2.1, 2.4], text: 'rise = 3', role: 'q-f', hand: true, size: 20 },
    { kind: 'point', at: [1, 1], role: 'q-x', label: '(1, 1)', labelDir: 'nw' },
    { kind: 'point', at: [2, 4], role: 'active', label: '(2, 4)', labelDir: 'se' },
    { kind: 'label', at: [2.55, 6.4], text: 'secant, slope 3', role: 'active', anchor: 'end', hand: true, size: 20 },
    { kind: 'label', at: [-0.4, 3.3], text: 'tangent, slope 2', role: 'result', hand: true, size: 20 },
  ],
  'Parabola y equals x squared. The secant through (1, 1) and (2, 4) has slope 3; the dashed tangent at (1, 1) has slope 2.',
);

// ------------------------------------------------------------------ the topic

const topic: Topic = {
  id: 'calc-derivative',
  course: 'calculus',
  number: '1.2',
  title: 'The derivative',
  blurb: 'Rate of change, tangent lines, first principles.',
  icon: '∂',
  prereqs: ['calc-limits'],
  formulas: [
    { name: 'Definition of the derivative', tex: R`f'(a)=\lim_{h\to 0}\frac{f(a+h)-f(a)}{h}`, say: 'f prime of a equals the limit, as h goes to zero, of f of a plus h minus f of a, over h' },
    { name: 'Average rate of change', tex: R`\frac{f(b)-f(a)}{b-a}`, say: 'f of b minus f of a, over b minus a' },
    { name: 'Linear approximation', tex: R`f(a+h)\approx f(a)+f'(a)\,h`, say: 'f of a plus h is approximately f of a plus f prime of a times h' },
    { name: 'Forward difference', tex: R`f'(x)\approx\frac{f(x+h)-f(x)}{h},\quad \text{error }\approx\tfrac12 |f''|\,h`, say: 'f prime of x is approximately f of x plus h minus f of x, over h, with error about one half f double prime times h' },
    { name: 'Central difference', tex: R`f'(x)\approx\frac{f(x+h)-f(x-h)}{2h},\quad \text{error }\approx\tfrac16 |f'''|\,h^2`, say: 'f prime of x is approximately f of x plus h minus f of x minus h, over 2 h, with error about one sixth f triple prime times h squared' },
    { name: 'Best forward-difference step', tex: R`h^\ast\approx 2\sqrt{\varepsilon\,|f|/|f''|}\approx 10^{-8}`, say: 'the best step h star is about 2 times the square root of epsilon f over f double prime, roughly ten to the minus eight' },
    { name: 'Power rule', tex: R`\frac{d}{dx}x^n=n\,x^{n-1}`, say: 'd by d x of x to the n equals n x to the n minus 1' },
    { name: 'Sine and cosine', tex: R`\frac{d}{dx}\sin x=\cos x,\quad \frac{d}{dx}\cos x=-\sin x`, say: 'd by d x of sine x equals cos x; d by d x of cos x equals minus sine x' },
    { name: 'Exponential', tex: R`\frac{d}{dx}e^x=e^x`, say: 'd by d x of e to the x equals e to the x' },
  ],
  steps: [
    // 1 ─ Hook
    {
      id: 'hook',
      kind: 'hook',
      question: 'A ball is dropped. How fast is it moving at exactly t = 1 s?',
      sim: fallSim,
      teaser: R`Speed is distance over time, and that needs **two** moments. "At exactly 1 s" gives you only one. Press Run: the photos tell you average speeds over 0.1 s gaps, never the speed at an instant. The derivative is the idea that makes "speed at an instant" meaningful, and it is how every simulation steps through time.`,
    },

    // 2 ─ Learn, part 1
    {
      id: 'learn-1',
      kind: 'learn',
      title: 'Learn: the idea',
      part: 1,
      partCount: 3,
      sections: [
        {
          id: 'fits',
          title: 'Where this fits',
          blocks: [
            { type: 'p', text: 'Calculus has two big ideas: rates of change and accumulation. This topic is the first one. The **derivative** is the exact rate at which a quantity changes at a single instant.' },
            { type: 'p', text: 'It builds on [[limit|limits]] from the previous topic. Everything after it leans on it: the differentiation rules, Taylor series, differential equations, optimisation, and the finite differences inside almost every simulation.' },
            {
              type: 'note',
              kind: 'compsci',
              text: 'A simulation is mostly derivatives. Newton’s second law, the heat equation and an epidemic model are all statements about rates of change. A computer can’t take a limit, so it approximates derivatives with small steps. Knowing exactly what is being approximated is how you judge a simulation.',
            },
          ],
        },
        {
          id: 'what',
          title: 'What a derivative is',
          blocks: [
            {
              type: 'p',
              text: R`Take a [[function]] {{\Q{f}{f}|f}} and a point {{\Q{x}{a}|a}}. Step a distance {{\Q{h}{h}|h}} to the right. The output changes by {{f(a+h)-f(a)|f of a plus h minus f of a}}. Divide by the step and you get the [[average-rate|average rate of change]] across it, the [[difference-quotient|difference quotient]]:`,
            },
            {
              type: 'eq',
              eq: {
                tex: R`\frac{\Q{f}{f(\Q{x}{a}+\Q{h}{h})}-\Q{f}{f(\Q{x}{a})}}{\Q{h}{h}}`,
                say: 'f of a plus h, minus f of a, all over h',
                label: 'difference quotient',
              },
            },
            { type: 'p', text: R`The **derivative** of {{f|f}} at {{a|a}} is the number this ratio approaches as the step shrinks to zero:` },
            {
              type: 'eq',
              eq: {
                tex: R`\Q{slope}{f'(\Q{x}{a})} = \lim_{\Q{h}{h}\to 0}\frac{f(a+\Q{h}{h})-f(a)}{\Q{h}{h}}`,
                say: 'f prime of a equals the limit, as h goes to zero, of f of a plus h minus f of a, over h',
                label: 'definition',
              },
            },
            {
              type: 'p',
              text: R`If this limit exists, as one finite number whether {{h|h}} approaches 0 from above or below, {{f|f}} is [[differentiable]] at {{a|a}}. If it doesn’t exist, {{f|f}} has no derivative at {{a|a}}. There is no fallback value.`,
            },
            {
              type: 'note',
              kind: 'remember',
              text: R`Notation. {{f'(a)|f prime of a}}, {{\left.\frac{df}{dx}\right|_{x=a}|d f by d x, at x equals a}} and, for time derivatives in physics, {{\dot{x}|x dot}} all mean this same limit.`,
            },
            {
              type: 'note',
              kind: 'units',
              text: 'A derivative has units of output divided by input. Position in metres and time in seconds give a derivative, the [[velocity]], in metres per second.',
            },
          ],
        },
        {
          id: 'picture',
          title: 'Picture it',
          blocks: [
            {
              type: 'p',
              text: R`On a graph, the difference quotient is the slope of the [[secant|secant line]] through two points of the curve: {{(a, f(a))|a, f of a}} and {{(a+h, f(a+h))|a plus h, f of a plus h}}. Slope is rise over run, and the run is {{\Q{h}{h}|h}}.`,
            },
            {
              type: 'figure',
              scene: fig,
              caption: R`For {{f(x)=x^2|f of x equals x squared}} at {{a=1|a equals 1}} with {{h=1|h equals 1}}: the secant (yellow) has slope 3. The tangent (dashed green) has slope 2.`,
            },
            {
              type: 'p',
              text: R`Now let {{\Q{h}{h}|h}} shrink. The second point slides along the curve towards the first, and the secant swings round. Its limiting position is the [[tangent|tangent line]]. The slope of the tangent is the derivative.`,
            },
            {
              type: 'p',
              text: 'So one number has two pictures: the rate of change at an instant, and the slope of the tangent line. The next step animates the swing.',
            },
          ],
        },
        {
          id: 'how',
          title: 'How it works: first principles',
          blocks: [
            { type: 'p', text: R`Let’s compute a derivative straight from the definition ("from first principles"), for {{f(x)=x^2|f of x equals x squared}} at any point {{a|a}}. Expand the top first:` },
            {
              type: 'eq',
              eq: {
                tex: R`\frac{(a+\Q{h}{h})^2-a^2}{\Q{h}{h}}=\frac{a^2+2a\Q{h}{h}+\Q{h}{h}^2-a^2}{\Q{h}{h}}=\frac{2a\Q{h}{h}+\Q{h}{h}^2}{\Q{h}{h}}`,
                say: 'a plus h squared, minus a squared, over h, equals a squared plus 2 a h plus h squared minus a squared, over h, which is 2 a h plus h squared, over h',
              },
            },
            { type: 'p', text: R`Now divide by {{\Q{h}{h}|h}}. That is allowed because inside a limit {{h|h}} is never zero: we only look at what happens as it gets close.` },
            { type: 'eq', eq: { tex: R`\frac{2a\Q{h}{h}+\Q{h}{h}^2}{\Q{h}{h}} = 2a+\Q{h}{h}\qquad(\Q{h}{h}\neq 0)`, say: '2 a h plus h squared, over h, equals 2 a plus h, for h not zero' } },
            { type: 'p', text: R`Finally let {{h\to 0|h go to zero}}. Nothing is left to cause trouble:` },
            { type: 'eq', eq: { tex: R`\Q{slope}{f'(a)}=\lim_{\Q{h}{h}\to 0}(2a+\Q{h}{h})=\Q{slope}{2a}`, say: 'f prime of a equals the limit as h goes to zero of 2 a plus h, which is 2 a' } },
            {
              type: 'p',
              text: R`Check it against the picture. At {{a=1|a equals 1}} the slope is 2, and the secant slopes for {{h=1,\ 0.5,\ 0.1,\ 0.01|h equals 1, 0.5, 0.1 and 0.01}} are 3, 2.5, 2.1 and 2.01. Each is exactly {{2+h|2 plus h}}.`,
            },
            {
              type: 'note',
              kind: 'why',
              text: R`The leftover {{\Q{h}{h}|h}} in {{2a+h|2 a plus h}} measures how far the curve bends away from a straight line. It vanishes in the limit. On a computer, which must stop at some {{h|h}}, it is exactly the error you make.`,
            },
          ],
        },
        {
          id: 'why',
          title: 'Why it’s true: the best straight line',
          blocks: [
            { type: 'p', text: 'Why should a limit of secant slopes earn the name "slope of the curve"? Look at how well the tangent line predicts the function near {{a|a}}. Write the true value as the tangent’s prediction plus an error {{E(h)|E of h}}:' },
            { type: 'eq', eq: { tex: R`f(a+\Q{h}{h}) = f(a) + \Q{slope}{f'(a)}\,\Q{h}{h} + \R{error}{E(\Q{h}{h})}`, say: 'f of a plus h equals f of a, plus f prime of a times h, plus E of h', label: 'linear approximation' } },
            {
              type: 'p',
              text: R`Rearrange: {{\frac{E(h)}{h}|E of h over h}} is the difference quotient minus {{f'(a)|f prime of a}}. By the definition that goes to zero. So the error shrinks **faster than the step itself**.`,
            },
            {
              type: 'p',
              text: R`No other line through {{(a, f(a))|a, f of a}} does this. A line with slope {{m\neq f'(a)|m not equal to f prime of a}} leaves {{\frac{E(h)}{h}\to f'(a)-m|E of h over h tending to f prime of a minus m}}, which is not zero. The tangent is the unique best [[linear-approx|linear approximation]].`,
            },
            {
              type: 'note',
              kind: 'intuition',
              text: 'Zoom in far enough on a differentiable curve and it looks straight: you are seeing its tangent. The derivative is the slope of what you see under the microscope.',
            },
          ],
        },
      ],
    },

    // 3 ─ Watch it
    {
      id: 'watch',
      kind: 'watch',
      intro: 'Three short animations. Press play, or step through with ▶|. Turn on Narrate in the bar below to hear each caption.',
      anims: [secantToTangent(), zoomIn(), buildDerivative()],
    },

    // 4 ─ Quick recall
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        {
          id: 'rc-secant',
          prompt: R`The difference quotient {{\frac{f(a+h)-f(a)}{h}|f of a plus h minus f of a, over h}} is the slope of which line?`,
          answer: {
            kind: 'mc',
            options: ['The tangent line at {{a|a}}', 'The secant line through {{(a, f(a))|a, f of a}} and {{(a+h, f(a+h))|a plus h, f of a plus h}}', 'The horizontal line through {{(a, f(a))|a, f of a}}', 'The line through the origin and {{(a, f(a))|a, f of a}}'],
            correct: 1,
          },
          explain: 'It is rise over run between two points of the curve: a secant. The tangent only appears in the limit as h goes to zero.',
        },
        {
          id: 'rc-quotient',
          prompt: R`For {{f(x)=x^2|f of x equals x squared}}, the difference quotient at {{a|a}} simplifies to what, **before** taking the limit? Use {{a|a}} and {{h|h}}.`,
          answer: { kind: 'expr', expr: '2*a + h', vars: ['a', 'h'] },
          explain: R`Expanding gives {{\frac{2ah+h^2}{h}=2a+h|2 a h plus h squared over h, which is 2 a plus h}}. The limit then removes the {{h|h}}.`,
        },
        {
          id: 'rc-zero',
          prompt: R`Why can’t we simply put {{h=0|h equals zero}} into the difference quotient?`,
          answer: {
            kind: 'mc',
            options: ['It gives 0 / 0, which has no value', 'Because f is not defined at a', 'Because h must be negative', 'It always gives infinity'],
            correct: 0,
          },
          explain: 'Top and bottom are both zero at h = 0. The limit asks what the quotient approaches, which is why we simplify first and only then let h go to zero.',
        },
      ],
    },

    // 5 ─ Learn, part 2
    {
      id: 'learn-2',
      kind: 'learn',
      title: 'Learn: deeper',
      part: 2,
      partCount: 3,
      sections: [
        {
          id: 'function',
          title: 'The derivative is a function',
          blocks: [
            { type: 'p', text: R`Compute {{f'(a)|f prime of a}} at every point and you get a new function, {{\Q{slope}{f'}|f prime}}. For {{f(x)=x^2|f of x equals x squared}} it is {{\Q{slope}{f'(x)=2x}|f prime of x equals 2 x}}.` },
            {
              type: 'p',
              text: R`The sign of {{f'|f prime}} gives the direction. Where {{f'(x)>0|f prime of x is positive}} the function increases. Where it is negative the function decreases. Where it is zero the graph is momentarily flat, which is where maxima and minima hide.`,
            },
            { type: 'p', text: R`Differentiate again and you get the second derivative {{\Q{a}{f''}|f double prime}}, the rate of change of the slope. It measures how the graph bends. In physics the chain is position, [[velocity]], [[acceleration]]:` },
            {
              type: 'eq',
              eq: {
                tex: R`\Q{x}{x(t)}\ \longrightarrow\ \Q{slope}{v(t)=\frac{dx}{dt}}\ \longrightarrow\ \Q{a}{a(t)=\frac{dv}{dt}=\frac{d^2x}{dt^2}}`,
                say: 'position x of t, then velocity v equals d x by d t, then acceleration a equals d v by d t, which is d two x by d t squared',
              },
            },
            { type: 'note', kind: 'compsci', text: R`Newton’s law {{F=ma|F equals m a}} fixes the **second** derivative of position. Almost every mechanics simulation steps these two rates forward in time.` },
          ],
        },
        {
          id: 'fails',
          title: 'Where derivatives fail',
          blocks: [
            {
              type: 'p',
              text: R`**A corner.** Take {{f(x)=|x||f of x equals absolute x}} at 0. The quotient is {{\frac{|h|}{h}|absolute h over h}}: it equals 1 for positive {{h|h}} and −1 for negative {{h|h}}. Two different one-sided limits, so there is no derivative.`,
            },
            {
              type: 'p',
              text: R`**A vertical tangent.** For {{f(x)=\sqrt[3]{x}|f of x equals the cube root of x}} at 0 the quotient is {{h^{-2/3}|h to the minus two thirds}}, which grows without bound. The tangent is vertical and its slope is not a number.`,
            },
            { type: 'p', text: R`**A jump or a hole.** If {{f|f}} is not [[continuous]] at {{a|a}}, the top of the quotient does not shrink while the bottom does, so the quotient blows up.` },
            {
              type: 'p',
              text: R`That last case is a theorem: differentiable implies continuous. Write {{f(a+h)-f(a)=h\cdot\frac{f(a+h)-f(a)}{h}|f of a plus h minus f of a equals h times the difference quotient}}. As {{h\to0|h goes to zero}} this tends to {{0\cdot f'(a)=0|zero times f prime of a, which is zero}}.`,
            },
            { type: 'p', text: R`The converse is false. {{|x||absolute x}} is continuous at 0 and still has no derivative there.` },
            {
              type: 'note',
              kind: 'pitfall',
              text: R`A computer happily returns a number at a corner. For {{|x||absolute x}} at 0 the forward difference gives 1, the backward gives −1 and the central gives 0, for every step. When the answer depends on the formula you chose, suspect a non-smooth point.`,
            },
          ],
        },
        {
          id: 'basics',
          title: 'Derivatives of the basic functions',
          blocks: [
            {
              type: 'p',
              text: R`Three results come straight from the definition and are used everywhere. For a whole-number power, expand {{(x+h)^n|x plus h to the n}} with the binomial theorem. Every term after the first two contains {{h^2|h squared}} or more, so after dividing by {{h|h}} they vanish in the limit.`,
            },
            { type: 'eq', eq: { tex: R`\frac{d}{dx}x^n = n\,x^{n-1}`, say: 'd by d x of x to the n equals n x to the n minus 1', label: 'power rule' } },
            { type: 'p', text: 'The rule holds for every real power, not only whole numbers. You will prove that in the next topic, with the chain rule.' },
            {
              type: 'p',
              text: R`For sine, the angle-addition formula turns the quotient into {{\sin x\,\frac{\cos h-1}{h}+\cos x\,\frac{\sin h}{h}|sine x times cos h minus 1 over h, plus cos x times sine h over h}}. With {{h|h}} in radians those two limits are 0 and 1.`,
            },
            { type: 'eq', eq: { tex: R`\frac{d}{dx}\sin x=\cos x,\qquad \frac{d}{dx}\cos x=-\sin x`, say: 'd by d x of sine x equals cos x, and d by d x of cos x equals minus sine x' } },
            {
              type: 'p',
              text: R`For the exponential, {{\frac{e^{x+h}-e^x}{h}=e^x\,\frac{e^h-1}{h}|e to the x plus h minus e to the x, over h, equals e to the x times e to the h minus 1, over h}}. The number {{e|e}} is exactly the base for which {{\frac{e^h-1}{h}\to1|e to the h minus 1 over h tends to 1}}.`,
            },
            { type: 'eq', eq: { tex: R`\frac{d}{dx}e^x=e^x`, say: 'd by d x of e to the x equals e to the x' } },
            {
              type: 'note',
              kind: 'units',
              text: R`The sine rule needs radians. Measured in degrees, the derivative of {{\sin x|sine x}} would be {{\frac{\pi}{180}\cos x|pi over 180 times cos x}}. NumPy’s trigonometric functions use radians.`,
            },
          ],
        },
      ],
    },

    // 6 ─ Play with it
    { id: 'play', kind: 'play', sandbox: secantLab },

    // 7 ─ Predict, then reveal
    {
      id: 'predict',
      kind: 'predict',
      question: R`A computer finds the derivative of {{\sin x|sine x}} at {{x=1|x equals 1}} with the forward difference, for {{h=10^{-1}, 10^{-2},\dots,10^{-15}|h equals ten to the minus 1, ten to the minus 2, and so on to ten to the minus 15}}. What happens to the error as {{h|h}} shrinks?`,
      answer: {
        kind: 'mc',
        options: ['It keeps shrinking, about ten times per step', 'It shrinks, then grows again', 'It stays about the same', 'It shrinks until it is exactly zero'],
        correct: 1,
      },
      reveal: errorReveal(),
      explain: R`Two errors compete. The [[truncation-error|truncation error]] is about {{\tfrac12|f''|\,h|one half f double prime times h}}, so it falls as {{h|h}} falls. The [[rounding-error|rounding error]] is about {{\frac{2\varepsilon|f|}{h}|2 epsilon f over h}}, so it grows. Their sum is smallest near {{h\approx10^{-8}|h about ten to the minus eight}}.`,
    },

    // 8 ─ Learn, part 3
    {
      id: 'learn-3',
      kind: 'learn',
      title: 'Learn: computing it',
      part: 3,
      partCount: 3,
      sections: [
        {
          id: 'costs',
          title: 'Costs and numerical issues',
          blocks: [
            { type: 'p', text: R`A computer can’t take a limit. It picks a small step {{\Q{h}{h}|h}} and uses the difference quotient itself, a [[finite-difference|finite difference]]. Two errors then fight each other.` },
            {
              type: 'p',
              text: R`**Truncation error.** Taylor’s theorem (topic 1.7) says {{f(a+h)=f(a)+f'(a)h+\tfrac12 f''(\xi)h^2|f of a plus h equals f of a plus f prime of a h plus one half f double prime of xi h squared}} for some {{\xi|xi}} between {{a|a}} and {{a+h|a plus h}}. So the forward difference is off by {{\tfrac12 f''(\xi)\,h|one half f double prime of xi times h}}.`,
            },
            {
              type: 'p',
              text: R`**Rounding error.** Each value of {{f|f}} is stored with relative error about [[machine-epsilon|machine epsilon]], {{\varepsilon\approx2.2\times10^{-16}|epsilon, about 2.2 times ten to the minus sixteen}}. Subtracting nearly equal values cancels the good digits ([[cancellation]]), and dividing by a tiny {{h|h}} magnifies what is left.`,
            },
            {
              type: 'eq',
              eq: {
                tex: R`\R{error}{\text{error}(\Q{h}{h})}\approx \underbrace{\tfrac12|f''|\,\Q{h}{h}}_{\text{truncation}}+\underbrace{\frac{2\varepsilon|f|}{\Q{h}{h}}}_{\text{rounding}}`,
                say: 'the error at step h is about one half f double prime times h, the truncation part, plus 2 epsilon f over h, the rounding part',
              },
            },
            {
              type: 'p',
              text: R`The sum is smallest where the two parts balance: {{h^\ast\approx2\sqrt{\varepsilon|f|/|f''|}|h star, about 2 root epsilon f over f double prime}}, roughly {{10^{-8}|ten to the minus eight}} for ordinary functions. The best error is also about {{10^{-8}|ten to the minus eight}}. Only half of the 16 digits survive.`,
            },
            {
              type: 'p',
              text: R`The **central difference** {{\frac{f(a+h)-f(a-h)}{2h}|f of a plus h minus f of a minus h, over 2 h}} cancels the {{h^2|h squared}} terms of the two Taylor expansions. Its truncation error is {{\tfrac16 f'''(\xi)\,h^2|one sixth f triple prime of xi times h squared}}. The best step is near {{10^{-5}|ten to the minus five}}, giving errors near {{10^{-11}|ten to the minus eleven}}.`,
            },
            {
              type: 'p',
              text: R`**Cost.** If {{f(a)|f of a}} is already known, a forward difference costs one new evaluation and a central difference two. A gradient in {{n|n}} variables then costs {{n|n}} or {{2n|2 n}} evaluations. That matters when one evaluation is a whole simulation.`,
            },
            { type: 'note', kind: 'compsci', text: 'This V-shaped trade-off, error falling and then rising as h shrinks, appears all over numerical methods. You will meet it again in numerical differentiation (topic 6.5).' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'p', text: 'Use **sympy** when you have a formula and want the exact derivative:' },
            {
              type: 'code',
              code: "import sympy as sp\nx = sp.symbols('x')\nf = x**3 - 2*x\ndf = sp.diff(f, x)      # 3*x**2 - 2\nprint(df, df.subs(x, 2))  # 3*x**2 - 2  10",
              say: 'With sympy: make the symbol x, the expression x cubed minus 2 x, and call diff. The derivative is 3 x squared minus 2, which is 10 at x equals 2.',
              colors: { df: 'q-slope', f: 'q-f', x: 'q-x' },
            },
            { type: 'p', text: 'Use a **finite difference** when you only have values, for example from a black-box simulation:' },
            {
              type: 'code',
              code: 'import numpy as np\n\ndef central_diff(f, x, h=1e-5):\n    return (f(x + h) - f(x - h)) / (2 * h)\n\nprint(central_diff(np.sin, 1.0))  # 0.540302305...\nprint(np.cos(1.0))                # 0.540302305...',
              say: 'A central difference in NumPy: f of x plus h minus f of x minus h, over 2 h, with h equal to ten to the minus five. For sine at 1 it agrees with cos of 1 to about eleven digits.',
              colors: { h: 'q-h', x: 'q-x' },
            },
            { type: 'p', text: 'Use `np.gradient` for sampled data. It applies central differences inside the array and one-sided differences at the two ends:' },
            {
              type: 'code',
              code: 'import numpy as np\nt = np.linspace(0, 2, 201)     # time in s, step 0.01 s\nx = 0.5 * 9.81 * t**2          # position in m\nv = np.gradient(x, t)          # velocity in m/s\nprint(t[100], v[100])          # 1.0  9.81 (up to rounding)',
              say: 'Sample the position of a falling ball every hundredth of a second. np dot gradient of x with respect to t gives the velocity at each sample: 9.81 metres per second at t equals 1 second.',
              colors: { v: 'q-slope', x: 'q-x', t: 'q-t' },
            },
            {
              type: 'note',
              kind: 'python',
              text: R`Don’t use {{h=10^{-20}|h equals ten to the minus twenty}} "to be safe". In double precision {{1.0+10^{-20}|1 plus ten to the minus twenty}} is exactly 1.0, so the top of the quotient is zero and the "derivative" is 0.`,
            },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                R`Putting {{h=0|h equal to zero}} straight into the quotient gives {{\frac00|zero over zero}}. Simplify first, then take the limit.`,
                'Mixing up the average rate over an interval with the instantaneous rate at a point. They agree only in the limit, or for straight lines.',
                R`Believing a smaller {{h|h}} is always better on a computer. Below about {{10^{-8}|ten to the minus eight}} the forward difference gets worse.`,
                'Forgetting units. A derivative’s units are output units divided by input units.',
                R`Using degrees. The rule {{(\sin x)'=\cos x|the derivative of sine x is cos x}} only holds in radians.`,
                R`Assuming continuous means differentiable. {{|x||absolute x}} is continuous everywhere but has no derivative at 0.`,
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            {
              type: 'p',
              text: R`Every time-stepping simulation starts from a derivative. An equation such as {{\frac{dy}{dt}=g(y)|d y by d t equals g of y}} says "the rate is known". Euler’s method replaces the derivative by a forward difference: {{y_{n+1}=y_n+\Delta t\,g(y_n)|y n plus 1 equals y n plus delta t times g of y n}}.`,
            },
            { type: 'p', text: 'Spatial derivatives become stencils on a grid. Heat, wave and fluid solvers combine values at neighbouring grid points with central differences. The truncation error of the stencil decides how fine the grid must be.' },
            {
              type: 'p',
              text: R`Optimisers and root finders need derivatives too. Newton’s method uses {{f'|f prime}} to find zeros, and gradient descent uses the gradient to walk downhill. When {{f|f}} is a simulation, its derivative comes from finite differences or from automatic differentiation.`,
            },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                R`The derivative {{f'(a)|f prime of a}} is the limit of the difference quotient as {{h\to0|h goes to zero}}: the instantaneous rate of change.`,
                'Geometrically it is the slope of the tangent line: the limit of secant lines, and the best straight-line approximation near the point.',
                'It fails to exist at corners, vertical tangents and jumps. Differentiable implies continuous, not the other way round.',
                R`Basic results: {{(x^n)'=nx^{n-1}|x to the n, differentiated, is n x to the n minus 1}}, {{(\sin x)'=\cos x|sine differentiates to cos}}, {{(e^x)'=e^x|e to the x is its own derivative}}.`,
                R`On a computer, forward differences have error of order {{h|h}} and central differences of order {{h^2|h squared}}, while rounding error grows like {{1/h|1 over h}}. So there is a best step.`,
              ],
            },
          ],
        },
      ],
    },

    // 9 ─ Worked example
    {
      id: 'worked',
      kind: 'worked',
      problem: R`Find the derivative of {{f(x)=\frac1x|f of x equals 1 over x}} at a point {{a\neq0|a not equal to zero}}, from the definition.`,
      lines: [
        { tex: R`f'(a)=\lim_{h\to0}\frac{\frac{1}{a+h}-\frac1a}{h}`, say: 'f prime of a equals the limit as h goes to zero of: 1 over a plus h, minus 1 over a, all over h', why: 'Wrote down the definition with f(x) = 1/x.' },
        { tex: R`=\lim_{h\to0}\frac1h\cdot\frac{a-(a+h)}{a(a+h)}`, say: 'equals the limit of 1 over h, times a minus a plus h, over a times a plus h', why: 'Put the two fractions over the common denominator a(a + h).' },
        { tex: R`=\lim_{h\to0}\frac1h\cdot\frac{-h}{a(a+h)}`, say: 'equals the limit of 1 over h, times minus h over a times a plus h', why: 'Simplified the top: a − (a + h) = −h.' },
        { tex: R`=\lim_{h\to0}\frac{-1}{a(a+h)}`, say: 'equals the limit of minus 1 over a times a plus h', why: 'Cancelled h. Allowed, because h ≠ 0 inside the limit.' },
        { tex: R`=-\frac{1}{a^2}`, say: 'equals minus 1 over a squared', why: 'Let h → 0. Nothing divides by zero any more, since a ≠ 0.' },
      ],
      takeaway: R`The recipe never changes: write the quotient, do algebra until the lone {{h|h}} in the denominator cancels, then let {{h\to0|h go to zero}}. Here the slope {{-1/a^2|minus 1 over a squared}} is always negative: {{1/x|1 over x}} decreases on each side of 0.`,
    },

    // 10 ─ Your turn
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-quad',
          prompt: R`Use the definition to find {{f'(2)|f prime of 2}} for {{f(x)=x^2-3x|f of x equals x squared minus 3 x}}.`,
          answer: { kind: 'numeric', value: 1, absTol: 1e-9 },
          hints: [
            R`Work out {{f(2+h)|f of 2 plus h}} and {{f(2)|f of 2}} separately first.`,
            R`{{f(2+h)=h^2+h-2|f of 2 plus h equals h squared plus h minus 2}} and {{f(2)=-2|f of 2 equals minus 2}}.`,
            R`The quotient is {{\frac{h^2+h}{h}=h+1|h squared plus h, over h, which is h plus 1}}. What does it approach as {{h\to0|h goes to zero}}?`,
          ],
          solution: [
            { tex: R`f(2+h)=(2+h)^2-3(2+h)=4+4h+h^2-6-3h=h^2+h-2`, say: 'f of 2 plus h equals 2 plus h squared minus 3 times 2 plus h, which is h squared plus h minus 2', why: 'Substituted 2 + h and expanded.' },
            { tex: R`f(2)=4-6=-2`, say: 'f of 2 equals 4 minus 6, which is minus 2', why: 'Evaluated at the point.' },
            { tex: R`\frac{f(2+h)-f(2)}{h}=\frac{h^2+h}{h}=h+1`, say: 'the quotient is h squared plus h over h, which is h plus 1', why: 'Subtracted, then cancelled h (h ≠ 0).' },
            { tex: R`f'(2)=\lim_{h\to0}(h+1)=1`, say: 'f prime of 2 equals the limit of h plus 1, which is 1', why: 'Let h → 0.' },
          ],
          solutionFinal: '1',
          truth: 'diff(x**2 - 3*x, x).subs(x, 2)',
        },
        {
          id: 'yt-cube',
          prompt: R`Use the definition to find the derivative function {{f'(x)|f prime of x}} for {{f(x)=x^3|f of x equals x cubed}}. Type it in terms of {{x|x}}.`,
          answer: { kind: 'expr', expr: '3*x^2', vars: ['x'] },
          hints: [
            R`Expand {{(x+h)^3|x plus h cubed}}. It has four terms.`,
            R`{{(x+h)^3=x^3+3x^2h+3xh^2+h^3|x plus h cubed equals x cubed plus 3 x squared h plus 3 x h squared plus h cubed}}.`,
            R`After cancelling, the quotient is {{3x^2+3xh+h^2|3 x squared plus 3 x h plus h squared}}. Let {{h\to0|h go to zero}}.`,
          ],
          solution: [
            { tex: R`\frac{(x+h)^3-x^3}{h}=\frac{3x^2h+3xh^2+h^3}{h}`, say: 'x plus h cubed minus x cubed, over h, equals 3 x squared h plus 3 x h squared plus h cubed, over h', why: 'Expanded with the binomial theorem; x³ cancels.' },
            { tex: R`=3x^2+3xh+h^2`, say: 'equals 3 x squared plus 3 x h plus h squared', why: 'Divided every term by h (h ≠ 0).' },
            { tex: R`f'(x)=\lim_{h\to0}\left(3x^2+3xh+h^2\right)=3x^2`, say: 'f prime of x equals the limit, which is 3 x squared', why: 'Let h → 0; the terms with h vanish.' },
          ],
          solutionFinal: '3*x**2',
          truth: 'diff(x**3, x)',
        },
        {
          id: 'yt-tank',
          prompt: R`A tank holds {{V(t)|V of t}} litres at time {{t|t}} minutes. You measure {{V(10)=500|V of 10 equals 500}} L and {{V(10.5)=488|V of 10.5 equals 488}} L. Estimate the rate of change of the volume near {{t=10|t equals 10}} min. Include units.`,
          answer: { kind: 'numeric', value: -24, relTol: 1e-3, unit: 'L/min' },
          hints: [
            'You only have two measurements, so use a difference quotient: change in volume over change in time.',
            R`{{\Delta V=488-500=-12|delta V equals 488 minus 500, which is minus 12}} L and {{\Delta t=0.5|delta t equals 0.5}} min.`,
            'Divide, and keep the sign: the tank is emptying. Units are litres per minute.',
          ],
          solution: [
            { tex: R`\frac{dV}{dt}\approx\frac{V(10.5)-V(10)}{10.5-10}`, say: 'd V by d t is approximately V of 10.5 minus V of 10, over 10.5 minus 10', why: 'Forward difference with step h = 0.5 min.' },
            { tex: R`=\frac{488-500}{0.5}\ \tfrac{\text{L}}{\text{min}}=-24\ \text{L/min}`, say: 'equals 488 minus 500 over 0.5, which is minus 24 litres per minute', why: 'Divided; units are litres over minutes.' },
          ],
          solutionFinal: '-24',
          truth: '(488 - 500) / (10.5 - 10)',
        },
        {
          id: 'yt-sqrt',
          prompt: R`Put the steps of the first-principles derivation of {{\frac{d}{dx}\sqrt{x}|d by d x of root x}} (for {{x>0|x positive}}) in the right order.`,
          answer: {
            kind: 'order',
            steps: [
              R`Write the quotient {{\frac{\sqrt{x+h}-\sqrt{x}}{h}|root of x plus h, minus root x, over h}}.`,
              R`Multiply top and bottom by {{\sqrt{x+h}+\sqrt{x}|root of x plus h, plus root x}}.`,
              R`The top becomes {{(x+h)-x=h|x plus h minus x, which is h}}.`,
              R`Cancel {{h|h}} to get {{\frac{1}{\sqrt{x+h}+\sqrt{x}}|1 over root of x plus h plus root x}}.`,
              R`Let {{h\to0|h go to zero}}: the result is {{\frac{1}{2\sqrt{x}}|1 over 2 root x}}.`,
            ],
          },
          hints: [
            'Square roots on top suggest the conjugate trick from limits.',
            'You must multiply by the conjugate before the top can simplify to h.',
            'Only after h is cancelled can you let h → 0 safely.',
          ],
          solution: [
            { tex: R`\frac{\sqrt{x+h}-\sqrt{x}}{h}\cdot\frac{\sqrt{x+h}+\sqrt{x}}{\sqrt{x+h}+\sqrt{x}}`, say: 'the quotient times the conjugate over itself', why: 'Multiplied by the conjugate (which equals 1).' },
            { tex: R`=\frac{(x+h)-x}{h\left(\sqrt{x+h}+\sqrt{x}\right)}=\frac{1}{\sqrt{x+h}+\sqrt{x}}`, say: 'equals x plus h minus x over h times the sum of roots, which is 1 over root x plus h plus root x', why: 'Difference of squares on top, then cancelled h.' },
            { tex: R`\lim_{h\to0}\frac{1}{\sqrt{x+h}+\sqrt{x}}=\frac{1}{2\sqrt{x}}`, say: 'the limit as h goes to zero is 1 over 2 root x', why: 'Let h → 0; both roots become √x.' },
          ],
          solutionFinal: '1/(2*sqrt(x))',
          truth: 'diff(sqrt(x), x)',
        },
      ],
    },

    // 11 ─ Compute it
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-central',
        title: 'A central-difference derivative',
        prompt: "Write `central_diff(f, x, h)` that returns the central difference {{\\frac{f(x+h)-f(x-h)}{2h}|f of x plus h minus f of x minus h, over 2 h}}. Then set `d` to the derivative of {{g(x)=e^{\\sin x}|g of x equals e to the sine x}} at {{x=0.5|x equals 0.5}} with {{h=10^{-5}|h equals ten to the minus five}}. The tests compare `d` with the exact value {{\\cos(0.5)\\,e^{\\sin 0.5}|cos 0.5 times e to the sine 0.5}} and check that halving {{h|h}} divides the error by about 4.",
        starter: 'import numpy as np\n\ndef central_diff(f, x, h):\n    # return the central-difference approximation of f\'(x)\n    pass\n\ndef g(x):\n    return np.exp(np.sin(x))\n\nd = None  # use central_diff with h = 1e-5\n',
        solution: 'import numpy as np\n\ndef central_diff(f, x, h):\n    return (f(x + h) - f(x - h)) / (2 * h)\n\ndef g(x):\n    return np.exp(np.sin(x))\n\nd = central_diff(g, 0.5, 1e-5)\n',
        tests: [
          'import numpy as np',
          'exact = np.cos(0.5) * np.exp(np.sin(0.5))',
          '',
          'def test_d_is_accurate():',
          '    assert d is not None, "set d to your estimate"',
          '    assert abs(d - exact) < 1e-9, f"d = {d!r}, exact = {exact!r}"',
          '',
          'def test_exact_for_a_parabola():',
          '    # a central difference has no truncation error for x**2',
          '    assert abs(central_diff(lambda x: x**2, 3.0, 0.1) - 6.0) < 1e-9',
          '',
          'def test_error_is_second_order():',
          '    e1 = abs(central_diff(g, 0.5, 1e-2) - exact)',
          '    e2 = abs(central_diff(g, 0.5, 5e-3) - exact)',
          '    ratio = e1 / e2',
          '    assert 3.6 < ratio < 4.4, f"halving h divided the error by {ratio:.2f}; expected about 4"',
        ].join('\n'),
        hints: [
          'The function body is one line: evaluate f on both sides of x and divide by the full width, 2h.',
          'Call it as central_diff(g, 0.5, 1e-5). Pass the function g itself, not g(0.5).',
          'If the ratio test fails, check you divide by 2 * h, not 2h or h.',
        ],
        colors: { h: 'q-h', x: 'q-x', d: 'q-slope' },
      },
    },

    // 12 ─ Fill the gap
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: 'This experiment reproduces the V-shaped error curve from the "predict" step. Fill the three gaps so the code computes the forward-difference error for each step size.',
      template:
        'import numpy as np\n\nx = 1.0\nexact = np.cos(x)\nhs = 10.0 ** -np.arange(1, 16)      # 1e-1, 1e-2, ..., 1e-15\nerrors = []\nfor h in hs:\n    approx = (np.sin(x + ⟦a⟧) - np.sin(x)) / ⟦b⟧\n    errors.append(abs(approx - ⟦c⟧))\n\nbest_h = hs[np.argmin(errors)]\nprint(best_h)\n',
      blanks: [
        { id: 'a', answers: ['h'], check: 'exact', hint: 'Step forward from x by the current step size.' },
        { id: 'b', answers: ['h'], check: 'exact', hint: 'Divide the rise by the run.' },
        { id: 'c', answers: ['exact', 'np.cos(x)', 'np.cos(1.0)', 'np.cos(1)'], check: 'exact', hint: 'Compare with the true derivative of sin at x.' },
      ],
      tests: [
        'def test_fifteen_errors():',
        '    assert len(errors) == 15',
        '',
        'def test_first_error_is_truncation():',
        '    want = abs((np.sin(1.1) - np.sin(1.0)) / 0.1 - np.cos(1.0))',
        '    assert abs(errors[0] - want) < 1e-12, errors[0]',
        '',
        'def test_best_step_is_near_1e_minus_8():',
        '    assert 1e-10 <= best_h <= 1e-6, f"best_h = {best_h}"',
      ].join('\n'),
    },

    // 13 ─ Where it's used
    {
      id: 'used',
      kind: 'used',
      items: [
        {
          field: 'Motion tracking',
          title: 'Velocity from position data',
          text: 'GPS tracks, motion capture and particle tracking in experiments record positions. Velocities and accelerations come from finite differences such as `np.gradient`. Differencing amplifies measurement noise, so the data are usually smoothed first.',
        },
        {
          field: 'Circuit simulation',
          title: 'Newton’s method in SPICE',
          text: 'SPICE-family circuit simulators solve the nonlinear equations of a circuit at every time step with Newton’s method. That needs the derivative of each device’s current–voltage curve.',
        },
        {
          field: 'Weather and climate',
          title: 'Derivatives on a grid',
          text: 'Atmosphere and ocean models replace the spatial derivatives in the fluid equations by differences between neighbouring grid points (or by related finite-volume and spectral methods). Grid spacing and truncation error set what the model can resolve.',
        },
        {
          field: 'Machine learning',
          title: 'Gradients for training',
          text: 'Training a neural network needs the derivative of the loss with respect to millions of parameters. Finite differences would need an extra evaluation per parameter, so frameworks use automatic differentiation. Finite differences are kept to test it: "gradient checking".',
        },
        {
          field: 'Molecular dynamics',
          title: 'Force is a derivative',
          text: R`The force between atoms is minus the derivative of the potential energy, {{F=-\frac{dU}{dr}|F equals minus d U by d r}}. Every time step of a molecular dynamics simulation evaluates it for every pair of nearby atoms.`,
        },
      ],
    },

    // 14 ─ Problems
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-average',
          title: 'Average rate of change',
          difficulty: 'easy',
          prompt: "Write `slope_between(f, a, b)` returning the average rate of change {{\\frac{f(b)-f(a)}{b-a}|f of b minus f of a, over b minus a}}.",
          starter: 'def slope_between(f, a, b):\n    pass\n',
          solution: 'def slope_between(f, a, b):\n    return (f(b) - f(a)) / (b - a)\n',
          tests: [
            'import math',
            'def test_parabola():',
            '    assert abs(slope_between(lambda x: x**2, 1, 3) - 4) < 1e-12',
            'def test_sine_over_half_a_period():',
            '    assert abs(slope_between(math.sin, 0, math.pi)) < 1e-12',
            'def test_order_of_endpoints_does_not_matter():',
            '    f = lambda x: x**3',
            '    assert abs(slope_between(f, 2, -1) - slope_between(f, -1, 2)) < 1e-12',
          ].join('\n'),
          hints: ['Rise over run.', 'The rise is f(b) − f(a); the run is b − a.', 'return (f(b) - f(a)) / (b - a)'],
        },
        {
          id: 'pb-tangent',
          title: 'The tangent line',
          difficulty: 'easy',
          prompt: "Write `tangent_line(f, df, a)` returning `(m, c)` such that {{y=mx+c|y equals m x plus c}} is the tangent to {{f|f}} at {{x=a|x equals a}}. Here `df` is the derivative function.",
          starter: 'def tangent_line(f, df, a):\n    m = None\n    c = None\n    return m, c\n',
          solution: 'def tangent_line(f, df, a):\n    m = df(a)\n    c = f(a) - m * a\n    return m, c\n',
          tests: [
            'import math',
            'def test_parabola_at_1():',
            '    m, c = tangent_line(lambda x: x**2, lambda x: 2*x, 1.0)',
            '    assert abs(m - 2) < 1e-12 and abs(c + 1) < 1e-12, (m, c)',
            'def test_exp_at_0():',
            '    m, c = tangent_line(math.exp, math.exp, 0.0)',
            '    assert abs(m - 1) < 1e-12 and abs(c - 1) < 1e-12, (m, c)',
            'def test_touches_the_curve():',
            '    m, c = tangent_line(math.sin, math.cos, 0.7)',
            '    assert abs(m * 0.7 + c - math.sin(0.7)) < 1e-12',
          ].join('\n'),
          hints: ['The slope of the tangent is the derivative at a.', 'The line must pass through (a, f(a)), so f(a) = m·a + c.', 'c = f(a) − m·a'],
        },
        {
          id: 'pb-data',
          title: 'Velocity from data',
          difficulty: 'medium',
          prompt: "Write `derivative_from_data(t, x)` for **equally spaced** times `t`. Return a NumPy array `v` of the same length. Inside, use central differences {{\\frac{x_{i+1}-x_{i-1}}{t_{i+1}-t_{i-1}}|x i plus 1 minus x i minus 1, over t i plus 1 minus t i minus 1}}. At the first and last points use forward and backward differences. (This is what `np.gradient` does, so don’t call it.)",
          starter: 'import numpy as np\n\ndef derivative_from_data(t, x):\n    t = np.asarray(t, dtype=float)\n    x = np.asarray(x, dtype=float)\n    v = np.zeros_like(x)\n    # fill v\n    return v\n',
          solution:
            'import numpy as np\n\ndef derivative_from_data(t, x):\n    t = np.asarray(t, dtype=float)\n    x = np.asarray(x, dtype=float)\n    v = np.zeros_like(x)\n    v[1:-1] = (x[2:] - x[:-2]) / (t[2:] - t[:-2])\n    v[0] = (x[1] - x[0]) / (t[1] - t[0])\n    v[-1] = (x[-1] - x[-2]) / (t[-1] - t[-2])\n    return v\n',
          tests: [
            'import numpy as np',
            'def test_matches_numpy_gradient():',
            '    t = np.linspace(0, 3, 31)',
            '    x = np.sin(t) + 0.2 * t**2',
            '    assert np.allclose(derivative_from_data(t, x), np.gradient(x, t), rtol=1e-12, atol=1e-12)',
            'def test_exact_inside_for_a_parabola():',
            '    t = np.linspace(0, 2, 21)',
            '    v = derivative_from_data(t, 4.905 * t**2)',
            '    assert np.allclose(v[1:-1], 9.81 * t[1:-1], atol=1e-9)',
            'def test_same_length():',
            '    t = np.arange(5.0)',
            '    assert len(derivative_from_data(t, t**3)) == 5',
          ].join('\n'),
          hints: [
            'Slices help: x[2:] − x[:-2] gives all the "next minus previous" differences at once.',
            'v[1:-1] = (x[2:] - x[:-2]) / (t[2:] - t[:-2]) fills every interior point.',
            'For the ends: v[0] uses points 0 and 1; v[-1] uses points −2 and −1.',
          ],
          colors: { v: 'q-slope', x: 'q-x', t: 'q-t' },
        },
      ],
      outside: [
        { source: 'Paul’s Online Math Notes', item: 'Calculus I → Derivatives → "The Definition of the Derivative" (practice problems)', why: 'Many first-principles computations, with full solutions.' },
        { source: 'Khan Academy', item: 'Differential Calculus → "Derivatives: definition and basic rules"', why: 'Short exercises on secant slopes, tangent slopes and the limit definition.' },
        { source: '3Blue1Brown', item: 'Essence of Calculus, chapter 2: "The paradox of the derivative"', why: 'A visual take on "rate of change at an instant".' },
        { source: 'OpenStax Calculus Volume 1 (also on LibreTexts)', item: 'Section 3.1 "Defining the Derivative" and section 3.2 "The Derivative as a Function", end-of-section exercises', why: 'Graded exercises from easy to hard.' },
        { source: 'MIT OpenCourseWare', item: '18.01SC Single Variable Calculus → Unit 1 "Differentiation", Part A', why: 'Lecture videos, recitations and problem sets with solutions.' },
      ],
    },

    // 15 ─ Recap
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'Explain to a friend, in three to five sentences, what a derivative is and why a computer can only approximate it. Try to use the words "limit", "secant" and "step size".',
      quiz: [
        {
          id: 'qz-fd',
          prompt: R`Use the forward difference with {{h=0.1|h equals 0.1}} to estimate the derivative of {{x^2|x squared}} at {{x=3|x equals 3}}.`,
          answer: { kind: 'numeric', value: 6.1, relTol: 1e-6 },
          explain: R`{{\frac{3.1^2-3^2}{0.1}=\frac{9.61-9}{0.1}=6.1|3.1 squared minus 9, over 0.1, equals 6.1}}. The exact derivative is 6: the extra 0.1 is {{h|h}}, the truncation error.`,
        },
        {
          id: 'qz-corner',
          prompt: 'Which function is continuous at 0 but has no derivative there?',
          answer: { kind: 'mc', options: ['{{x^2|x squared}}', '{{|x||absolute x}}', '{{\\sin x|sine x}}', '{{e^x|e to the x}}'], correct: 1 },
          explain: 'The absolute value has a corner at 0: slope −1 on the left, +1 on the right.',
        },
        {
          id: 'qz-order',
          prompt: R`Ignoring rounding, halving {{h|h}} in a **central** difference divides the error by about…`,
          answer: { kind: 'mc', options: ['2', '4', '8', '1 (no change)'], correct: 1 },
          explain: R`Its error is proportional to {{h^2|h squared}}, and {{(h/2)^2=h^2/4|h over 2, squared, equals h squared over 4}}.`,
        },
      ],
    },
  ],
};

export default topic;
