/**
 * Foundations 0.3 — Exponentials and logarithms.
 */
import type { AnimationDef, Readout, SandboxDef, Scene, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, scene } from '../../lib';

const R = String.raw;

// ------------------------------------------------------------------ animations

function doublingAnim(): AnimationDef {
  const ns = [0, 2, 4, 6, 8, 10];
  return anim(
    'doubling',
    'Adding versus multiplying',
    ns.map((n) => {
      const items: SceneItem[] = [];
      for (let k = 0; k <= n; k++) {
        items.push({ kind: 'rect', x: k - 0.35, y: 0, w: 0.3, h: 1 + k, role: 'given', opacity: 0.5 });
        items.push({ kind: 'rect', x: k + 0.05, y: 0, w: 0.3, h: Math.min(2 ** k, 70), role: 'q-slope', opacity: 0.6 });
        if (2 ** k > 70) items.push({ kind: 'label', at: [k + 0.2, 72], text: '↑', role: 'q-slope', anchor: 'middle', size: 18 });
      }
      items.push({ kind: 'label', at: [-0.6, 78], text: `after ${n} steps: +1 each step → ${1 + n},  ×2 each step → ${2 ** n}`, role: 'active', hand: true, size: 20 });
      const cap =
        n === 0
          ? 'Two quantities start at 1. Blue adds 1 each step. Orange doubles each step.'
          : n <= 4
            ? `After ${n} steps: blue is ${1 + n}, orange is ${2 ** n}. At first the difference is small.`
            : n < 10
              ? `After ${n} steps: ${1 + n} against ${2 ** n}. Doubling has run away.`
              : 'After 10 steps: 11 against 1024. Growth by a constant factor always beats growth by a constant amount, eventually.';
      return frame(scene([-1, 11], [0, 82], items, `Bar chart after ${n} steps: linear growth reaches ${1 + n}, doubling reaches ${2 ** n}.`), cap);
    }),
  );
}

function compoundAnim(): AnimationDef {
  const ns = [1, 2, 4, 12, 365];
  const val = (n: number) => (1 + 1 / n) ** n;
  return anim(
    'compound',
    'Compounding more often: the number e appears',
    ns.map((n, i) => {
      const pts = ns.slice(0, i + 1).map((m, j) => ({ kind: 'point' as const, at: [j, val(m)] as [number, number], role: 'q-f' as const, r: 6 }));
      const items: SceneItem[] = [
        { kind: 'hline', y: Math.E, role: 'result', label: 'e ≈ 2.71828' },
        { kind: 'hline', y: 2, role: 'muted', label: '2' },
        ...pts,
        ...ns.slice(0, i + 1).map((m, j) => ({ kind: 'label' as const, at: [j, 1.8] as [number, number], text: `n = ${m}`, role: 'muted' as const, anchor: 'middle' as const, size: 14 })),
      ];
      return frame(
        scene([-0.5, 4.5], [1.7, 2.9], items, `Value of 1 plus 1 over n, to the n, for n up to ${n}: ${fmt(val(n), 6)}.`, { grid: false, axes: false }),
        `100% interest per year, paid ${n === 1 ? 'once' : `${n} times`} a year: one euro grows to ${fmt(val(n), 6)}.`,
        { tex: R`\left(1+\tfrac{1}{${n}}\right)^{${n}}=${fmt(val(n), 6)}`, say: `1 plus 1 over ${n}, to the power ${n}, equals ${fmt(val(n), 6)}` },
      );
    }).concat([
      frame(
        scene([-0.5, 4.5], [1.7, 2.9], [{ kind: 'hline', y: Math.E, role: 'result', label: 'e ≈ 2.71828' }, { kind: 'hline', y: 2, role: 'muted', label: '2' }, ...ns.map((m, j) => ({ kind: 'point' as const, at: [j, val(m)] as [number, number], role: 'q-f' as const, r: 6 })), ...ns.map((m, j) => ({ kind: 'label' as const, at: [j, 1.8] as [number, number], text: `n = ${m}`, role: 'muted' as const, anchor: 'middle' as const, size: 14 }))], 'The values approach the line at e.', { grid: false, axes: false }),
        'Compounding ever more often never passes a limit. That limit is the number e, about 2.71828.',
        { tex: R`e=\lim_{n\to\infty}\left(1+\tfrac1n\right)^n\approx2.71828`, say: 'e equals the limit as n goes to infinity of 1 plus 1 over n, to the n, about 2.71828' },
      ),
    ]),
  );
}

function logScaleAnim(): AnimationDef {
  const f = (t: number) => 3 * Math.exp(0.6 * t);
  const lin = scene([0, 8], [0, 400], [{ kind: 'fn', f, role: 'q-f', width: 3.5 }], 'Exponential curve on ordinary axes, rising steeply.', { xLabel: 't', yLabel: 'N' });
  const log = scene([0, 8], [0, 3], [{ kind: 'fn', f: (t) => Math.log10(f(t)), role: 'q-f', width: 3.5 }], 'The same exponential on a logarithmic vertical axis: a straight line.', { xLabel: 't', yLabel: 'N', logTicks: { y: true } });
  return anim('logscale', 'A log scale turns exponentials into straight lines', [
    frame(lin, 'On ordinary axes the exponential hugs zero, then shoots up. The early part is invisible.'),
    frame(log, 'Put the vertical axis on a log scale: each grid step is ten times bigger. Now the curve is a straight line.'),
    frame(log, 'Why: log of N equals log of N0 plus k t times log e. That is linear in t. The slope gives the growth rate.', { tex: R`\log_{10}N=\log_{10}N_0+(k\log_{10}e)\,t`, say: 'log of N equals log of N 0 plus k log e times t' }),
  ]);
}

function lakeReveal(): AnimationDef {
  return anim(
    'lake',
    'The lily-pad lake',
    [25, 26, 27, 28, 29, 30].map((d) => {
      const frac = 2 ** (d - 30);
      return frame(
        scene([0, 10], [0, 4], [
          { kind: 'rect', x: 0.5, y: 0.5, w: 9, h: 2.4, role: 'given', opacity: 0.15 },
          { kind: 'rect', x: 0.5, y: 0.5, w: 9 * frac, h: 2.4, role: 'result', opacity: 0.6 },
          { kind: 'label', at: [5, 3.4], text: `day ${d}: ${fmt(frac * 100, 3)}% covered`, role: 'active', anchor: 'middle', hand: true, size: 26 },
        ], `Lake on day ${d}, ${fmt(frac * 100, 3)} percent covered.`, { axes: false, grid: false, size: [640, 260] }),
        d === 30 ? 'Day 30: covered. It was half covered only one day earlier, on day 29.' : d === 29 ? 'Day 29: half covered.' : `Day ${d}: only ${fmt(frac * 100, 3)} percent covered. It looks like nothing is happening.`,
      );
    }),
  );
}

// ------------------------------------------------------------------ sandbox

const growthLab: SandboxDef = {
  id: 'growth-lab',
  title: 'Growth and decay lab',
  intro: R`{{N(t)=N_0e^{kt}|N of t equals N 0 e to the k t}}. Change the rate {{k|k}} and the start {{N_0|N 0}}, and switch the vertical axis between linear and logarithmic.`,
  sliders: [
    { id: 'k', label: 'rate k (per unit time)', min: -1, max: 1, step: 0.01, init: 0.3, role: 'q-slope' },
    { id: 'N0', label: 'start N₀', min: 1, max: 100, step: 1, init: 10, role: 'q-f' },
  ],
  choices: [{ id: 'scale', label: 'Vertical axis', init: 'lin', options: [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'logarithmic' }] }],
  render: (s) => {
    const { k, N0 } = s.values;
    const N = (t: number) => N0 * Math.exp(k * t);
    const T = 10;
    const log = s.choices.scale === 'log';
    const ymax = Math.max(N0, N(T)) * 1.1;
    const sc: Scene = log
      ? scene([0, T], [-1, Math.max(2, Math.ceil(Math.log10(ymax)))], [{ kind: 'fn', f: (t) => Math.log10(N(t)), role: 'q-f', width: 3.5 }], `N of t on a log scale with k equal to ${k}.`, { logTicks: { y: true }, xLabel: 't', yLabel: 'N' })
      : scene([0, T], [0, ymax], [{ kind: 'fn', f: N, role: 'q-f', width: 3.5 }], `N of t on a linear scale with k equal to ${k}.`, { xLabel: 't', yLabel: 'N' });
    const readouts: Readout[] = [
      { label: 'N(10)', value: fmt(N(T), 4), role: 'q-f' as const },
      { label: 'growth factor per unit time eᵏ', value: fmt(Math.exp(k), 4), role: 'q-slope' as const },
    ];
    if (k > 0) readouts.push({ label: 'doubling time ln 2 / k', value: fmt(Math.LN2 / k, 4), role: 'result' as const });
    if (k < 0) readouts.push({ label: 'half-life ln 2 / |k|', value: fmt(Math.LN2 / -k, 4), role: 'result' as const });
    return { scene: sc, readouts, note: k === 0 ? 'k = 0: no change at all.' : undefined };
  },
  tryThis: [
    'Switch to the log scale. Whatever k you choose, the curve is a straight line. How does its slope depend on k?',
    R`Set {{k=0.69|k equals 0.69}}. The doubling time is almost exactly 1: {{\ln2\approx0.693|ln 2 is about 0.693}}.`,
    'Make k negative. The curve decays towards zero but never reaches it. Read off the half-life.',
  ],
};

// ------------------------------------------------------------------ topic

const hookScene: Scene = scene(
  [0, 42],
  [0, 450000],
  [
    { kind: 'fn', f: (n) => (0.1e-3 * 2 ** n) / 1000, role: 'q-slope', width: 3.5 },
    { kind: 'hline', y: 384400, role: 'result', label: 'distance to the Moon ≈ 384 400 km' },
    { kind: 'label', at: [2, 300000], text: 'thickness after n folds (km)', role: 'q-slope', hand: true, size: 20 },
  ],
  'Thickness of a sheet of paper after n folds, in kilometres. It stays near zero until about 30 folds, then passes the distance to the Moon at 42 folds.',
  { xLabel: 'folds n' },
);

const topic: Topic = {
  id: 'f-explog',
  course: 'foundations',
  number: '0.3',
  title: 'Exponentials and logarithms',
  blurb: 'Growth, decay, log scales and the number e.',
  icon: 'eˣ',
  prereqs: ['f-functions'],
  glossary: [
    { id: 'exponential', term: 'Exponential function', def: 'A function {{b^x|b to the x}} (or {{e^{kx}|e to the k x}}) that multiplies by the same factor for every unit step in x. It models growth or decay at a rate proportional to the current amount.' },
    { id: 'logarithm', term: 'Logarithm', def: 'The inverse of an exponential: {{\\log_b y=x|log base b of y equals x}} exactly when {{b^x=y|b to the x equals y}}. It answers "which power?". Defined only for {{y>0|y positive}}.' },
    { id: 'e-number', term: 'The number e', def: 'About 2.71828. The limit of {{(1+1/n)^n|1 plus 1 over n, to the n}}, and the base for which the exponential is its own derivative.' },
    { id: 'natural-log', term: 'Natural logarithm', def: 'The logarithm with base {{e|e}}, written {{\\ln|ln}}. In NumPy it is `np.log`; base 10 is `np.log10`.' },
    { id: 'half-life', term: 'Half-life', def: 'The time for a decaying quantity to halve: {{\\ln2/|k||ln 2 over absolute k}} for {{N_0e^{kt}|N 0 e to the k t}} with {{k<0|k negative}}.' },
    { id: 'log-scale', term: 'Logarithmic scale', def: 'An axis on which equal distances mean equal factors (1, 10, 100, …). Exponentials appear as straight lines on a log vertical axis; power laws on log–log axes.' },
    { id: 'overflow', term: 'Overflow', def: 'A result too large for floating point. In double precision anything above about {{1.8\\times10^{308}|1.8 times ten to the 308}} becomes `inf`; `np.exp(710)` overflows.' },
  ],
  formulas: [
    { name: 'Exponential growth or decay', tex: R`N(t)=N_0\,e^{kt}`, say: 'N of t equals N 0 times e to the k t' },
    { name: 'Definition of the logarithm', tex: R`\log_b y=x\iff b^x=y\quad(y>0)`, say: 'log base b of y equals x exactly when b to the x equals y, for y positive' },
    { name: 'Log laws', tex: R`\log(xy)=\log x+\log y,\quad \log\frac xy=\log x-\log y,\quad \log x^k=k\log x`, say: 'log of x y equals log x plus log y; log of x over y equals log x minus log y; log of x to the k equals k log x' },
    { name: 'Change of base', tex: R`\log_b x=\frac{\ln x}{\ln b}`, say: 'log base b of x equals ln x over ln b' },
    { name: 'Doubling time and half-life', tex: R`T_{2}=\frac{\ln 2}{k},\qquad T_{1/2}=\frac{\ln 2}{|k|}`, say: 'doubling time equals ln 2 over k; half-life equals ln 2 over absolute k' },
    { name: 'The number e', tex: R`e=\lim_{n\to\infty}\left(1+\tfrac1n\right)^n\approx2.71828`, say: 'e equals the limit of 1 plus 1 over n, to the n, about 2.71828' },
    { name: 'Log-sum-exp (stable)', tex: R`\log\sum_i e^{x_i}=m+\log\sum_i e^{x_i-m},\quad m=\max_i x_i`, say: 'log of the sum of e to the x i equals m plus log of the sum of e to the x i minus m, where m is the largest x i' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'Fold a sheet of paper 0.1 mm thick in half 42 times. How thick is the stack?',
      scene: hookScene,
      teaser: R`About 440 000 km: further than the Moon. Each fold doubles the thickness, so after 42 folds it is {{2^{42}\approx4.4\times10^{12}|2 to the 42, about 4.4 times ten to the twelve}} sheets. (No one can actually fold paper that often, but the arithmetic is real.) Exponentials grow in a way our intuition badly underestimates; logarithms are the tool for taming them.`,
    },
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
            { type: 'p', text: 'Whenever a quantity changes at a rate proportional to itself, you get an exponential: bacteria, radioactive atoms, money at interest, the early phase of an epidemic, a cooling cup of tea.' },
            { type: 'p', text: 'Logarithms undo exponentials. They turn multiplication into addition, which is why log scales appear on every plot of errors and convergence in numerical work.' },
            { type: 'note', kind: 'compsci', text: 'A good iterative method often cuts its error by a constant factor each step: exponential decay of the error. Plotting it on a log axis shows a straight line whose slope is the speed of the method.' },
          ],
        },
        {
          id: 'what',
          title: 'What an exponential is',
          blocks: [
            { type: 'p', text: R`A linear function adds the same **amount** for each unit step. An [[exponential]] multiplies by the same **factor**. {{f(x)=b^x|f of x equals b to the x}} with {{b>0|b positive}} multiplies by {{b|b}} whenever {{x|x}} increases by 1.` },
            { type: 'eq', eq: { tex: R`f(x+1)=b\cdot f(x)\qquad\text{(constant ratio)}`, say: 'f of x plus 1 equals b times f of x, a constant ratio', label: 'exponential' } },
            { type: 'p', text: R`If {{b>1|b is greater than 1}} it grows; if {{0<b<1|b is between 0 and 1}} it decays. The exponent laws from 0.1 define {{b^x|b to the x}} for every real {{x|x}}, and every such graph passes through {{(0,1)|0, 1}}.` },
            { type: 'note', kind: 'remember', text: R`{{x^2|x squared}} is a power function: the variable is in the base. {{2^x|2 to the x}} is an exponential: the variable is in the exponent. Exponentials eventually beat every power.` },
          ],
        },
        {
          id: 'picture',
          title: 'Picture it',
          blocks: [
            {
              type: 'figure',
              scene: scene([-3, 3], [-0.5, 6], [
                { kind: 'fn', f: (x) => 2 ** x, role: 'q-slope', width: 3.5 },
                { kind: 'fn', f: Math.exp, role: 'q-f', width: 3.5 },
                { kind: 'fn', f: (x) => 0.5 ** x, role: 'given', width: 3.5 },
                { kind: 'point', at: [0, 1], role: 'active', r: 6, label: '(0, 1)', labelDir: 'se' },
                { kind: 'label', at: [1.5, 5.3], text: 'eˣ', role: 'q-f', hand: true, size: 24 },
                { kind: 'label', at: [2.2, 3.4], text: '2ˣ', role: 'q-slope', hand: true, size: 24 },
                { kind: 'label', at: [-2.6, 4.6], text: '(1/2)ˣ', role: 'given', hand: true, size: 24 },
              ], 'Graphs of 2 to the x, e to the x and one half to the x, all passing through the point 0, 1.'),
              caption: R`Growth ({{2^x|2 to the x}}, {{e^x|e to the x}}) and decay ({{(1/2)^x|one half to the x}}). All pass through {{(0,1)|0, 1}}, all stay above zero, and all approach the axis on one side without touching it.`,
            },
            { type: 'p', text: R`The time to double is fixed. Starting anywhere, {{2^x|2 to the x}} doubles every time {{x|x}} increases by 1, whatever its current size. That is the signature of exponential growth.` },
          ],
        },
        {
          id: 'logs',
          title: 'Logarithms: which power?',
          blocks: [
            { type: 'p', text: R`The [[logarithm]] answers "which power?": {{\log_b y=x|log base b of y equals x}} exactly when {{b^x=y|b to the x equals y}}. So {{\log_{10}1000=3|log base 10 of 1000 is 3}} and {{\log_2 8=3|log base 2 of 8 is 3}}. It is the [[inverse-function|inverse]] of the exponential.` },
            { type: 'p', text: R`The log laws are the exponent laws read backwards. Since {{b^m b^n=b^{m+n}|b to the m times b to the n equals b to the m plus n}}, taking logs gives {{\log(xy)=\log x+\log y|log of x y equals log x plus log y}}: multiplication becomes addition.` },
            { type: 'eq', eq: { tex: R`\log(xy)=\log x+\log y,\qquad \log x^k=k\log x,\qquad \log_b x=\frac{\ln x}{\ln b}`, say: 'log of x y equals log x plus log y; log of x to the k equals k log x; log base b of x equals ln x over ln b', label: 'log laws' } },
            { type: 'note', kind: 'pitfall', text: R`{{\log(x+y)|log of x plus y}} has no simplification. And {{\log y|log of y}} is only defined for {{y>0|y positive}}: no power of a positive base is zero or negative.` },
          ],
        },
        {
          id: 'why-e',
          title: 'Why e is the natural base',
          blocks: [
            { type: 'p', text: R`Put 1 euro in a bank paying 100% a year. Paid once, you get 2. Paid twice, each half-year at 50%, you get {{1.5^2=2.25|1.5 squared, 2.25}}. Paid {{n|n}} times, {{(1+1/n)^n|1 plus 1 over n, to the n}}. As {{n|n}} grows this approaches the number [[e-number|e]] ≈ 2.71828.` },
            { type: 'p', text: R`The deeper reason: {{e^x|e to the x}} is the exponential whose slope at every point equals its own value. You saw {{\frac{d}{dx}e^x=e^x|d by d x of e to the x equals e to the x}} in the derivative topic. So {{N_0e^{kt}|N 0 e to the k t}} has rate {{kN|k N}}, proportional to {{N|N}} with constant {{k|k}}.` },
            { type: 'eq', eq: { tex: R`N(t)=N_0\,e^{\Q{slope}{k}t}\quad\Longrightarrow\quad\text{rate}=\Q{slope}{k}\,N`, say: 'N of t equals N 0 e to the k t, so the rate of change is k times N', label: 'growth law' } },
            { type: 'p', text: R`Any exponential can be written with base {{e|e}}: {{b^t=e^{t\ln b}|b to the t equals e to the t ln b}}. Scientists use {{e|e}} because the constant {{k|k}} is then the actual rate, per unit time.` },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three animations: adding against multiplying, where e comes from, and why log scales straighten exponentials.', anims: [doublingAnim(), compoundAnim(), logScaleAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-log1000', prompt: R`What is {{\log_{10}1000|log base 10 of 1000}}?`, answer: { kind: 'numeric', value: 3, absTol: 1e-12 }, explain: R`{{10^3=1000|10 cubed is 1000}}, so the power is 3.` },
        { id: 'rc-ratio', prompt: 'What stays constant as an exponential function grows?', answer: { kind: 'mc', options: ['The amount added per step', 'The factor multiplied per step', 'The slope', 'Nothing'], correct: 1 }, explain: 'An exponential multiplies by the same factor each unit step. A linear function adds the same amount.' },
        { id: 'rc-loglaw', prompt: R`Simplify {{\ln(e^{2}\cdot e^{x})|ln of e squared times e to the x}}. Type it in terms of {{x|x}}.`, answer: { kind: 'expr', expr: 'x + 2', vars: ['x'] }, explain: R`{{e^2e^x=e^{x+2}|e squared times e to the x is e to the x plus 2}}, and {{\ln|ln}} undoes {{e|e}} to the power.` },
      ],
    },
    {
      id: 'learn-2',
      kind: 'learn',
      title: 'Learn: deeper',
      part: 2,
      partCount: 3,
      sections: [
        {
          id: 'models',
          title: 'Growth and decay models',
          blocks: [
            { type: 'p', text: R`In {{N(t)=N_0e^{kt}|N of t equals N 0 e to the k t}}, {{k>0|k positive}} is growth and {{k<0|k negative}} is decay. Setting {{N=2N_0|N equal to 2 N 0}} gives the doubling time {{T_2=\ln2/k|ln 2 over k}}. Setting {{N=N_0/2|N equal to half of N 0}} gives the [[half-life]] {{\ln2/|k||ln 2 over absolute k}}.` },
            { type: 'p', text: R`Carbon-14 has a half-life of about 5730 years. After {{t|t}} years the fraction left is {{(1/2)^{t/5730}|one half to the t over 5730}}. Measure the fraction, solve for {{t|t}}: that is radiocarbon dating.` },
            { type: 'note', kind: 'units', text: R`The rate {{k|k}} has units of 1 over time (per year, per second), so that {{kt|k t}} has no units. Only a pure number may sit in an exponent.` },
          ],
        },
        {
          id: 'scales',
          title: 'Log scales and power laws',
          blocks: [
            { type: 'p', text: R`On a [[log-scale|log vertical axis]], {{N_0e^{kt}|N 0 e to the k t}} becomes a straight line, because {{\log N=\log N_0+kt\log e|log N equals log N 0 plus k t log e}}. Fitting a line to {{\log N|log N}} measures {{k|k}} from data.` },
            { type: 'p', text: R`A power law {{y=ax^p|y equals a x to the p}} becomes a straight line on **log–log** axes, with slope {{p|p}}: {{\log y=\log a+p\log x|log y equals log a plus p log x}}. Error plots in numerical analysis are log–log for exactly this reason: an error {{\propto h^2|proportional to h squared}} shows slope 2.` },
            { type: 'note', kind: 'compsci', text: 'Reading slopes on log–log plots is a daily skill in computational science: it is how you check that a method converges at the rate theory promises.' },
          ],
        },
        {
          id: 'solving',
          title: 'Solving exponential equations',
          blocks: [
            { type: 'p', text: R`To get an unknown out of an exponent, take logarithms. For {{3\cdot2^x=48|3 times 2 to the x equals 48}}: divide by 3, {{2^x=16|2 to the x equals 16}}, then {{x=\log_2 16=4|x equals log base 2 of 16, which is 4}}.` },
            { type: 'eq', eq: { tex: R`a\,b^x=y\ \Longrightarrow\ x=\frac{\ln(y/a)}{\ln b}`, say: 'if a times b to the x equals y, then x equals ln of y over a, divided by ln b', label: 'solve for the exponent' } },
            { type: 'note', kind: 'remember', text: R`Calculators and NumPy only have {{\ln|ln}}, {{\log_{10}|log base 10}} and {{\log_2|log base 2}}. Any other base comes from change of base: {{\log_b x=\ln x/\ln b|log base b of x equals ln x over ln b}}.` },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: growthLab },
    {
      id: 'predict',
      kind: 'predict',
      question: 'Lily pads double their area every day. They cover a lake completely on day 30. On which day was the lake half covered?',
      answer: { kind: 'mc', options: ['Day 15', 'Day 20', 'Day 28', 'Day 29'], correct: 3 },
      reveal: lakeReveal(),
      explain: 'Doubling works backwards too: one day before full is half. On day 25 the lake is only about 3% covered. Exponential growth looks like nothing for most of its life, then everything at the end.',
    },
    {
      id: 'learn-3',
      kind: 'learn',
      title: 'Learn: computing it',
      part: 3,
      partCount: 3,
      sections: [
        {
          id: 'numerics',
          title: 'Costs and numerical issues',
          blocks: [
            { type: 'p', text: "**[[overflow|Overflow]].** The largest double is about {{1.8\\times10^{308}|1.8 times ten to the 308}}, and {{\\ln(1.8\\times10^{308})\\approx709.8|its ln is about 709.8}}. So `np.exp(709)` works and `np.exp(710)` is `inf`. The other end underflows: `np.exp(-746)` is exactly 0." },
            { type: 'p', text: "**Small arguments.** {{\\ln(1+10^{-16})|ln of 1 plus ten to the minus 16}} is about {{10^{-16}|ten to the minus 16}}, but `np.log(1 + 1e-16)` gives 0, because `1 + 1e-16` rounds to 1. `np.log1p(x)` and `np.expm1(x)` compute {{\\ln(1+x)|ln of 1 plus x}} and {{e^x-1|e to the x minus 1}} accurately for tiny {{x|x}}." },
            { type: 'p', text: "**Sums of exponentials.** `np.log(np.sum(np.exp(x)))` overflows for `x = [1000, 1000]`, though the answer is just {{1000+\\ln2|1000 plus ln 2}}. Factor out the largest term {{m|m}}: {{\\ln\\sum e^{x_i}=m+\\ln\\sum e^{x_i-m}|log sum exp equals m plus log sum of e to the x i minus m}}. Now every exponent is ≤ 0." },
            { type: 'note', kind: 'compsci', text: 'This "log-sum-exp" trick is everywhere: in statistics (likelihoods), in statistical physics (partition functions), and in every machine-learning classifier (softmax). Working with logs of tiny probabilities is the standard way to avoid underflow.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'code', code: 'import numpy as np\nprint(np.log(np.e), np.log10(1000), np.log2(8))   # 1.0 3.0 3.0\nprint(np.log(32) / np.log(8))                     # log base 8 of 32 = 1.666...\nprint(np.log1p(1e-16), np.log(1 + 1e-16))         # 1e-16 0.0\nprint(np.log(2) / 0.05)                           # doubling time for k = 0.05: 13.86', say: 'np dot log is the natural log; log10 and log2 are the other bases. Change of base gives log base 8 of 32. log1p stays accurate for tiny inputs. The doubling time for k equals 0.05 is 13.86.' },
            { type: 'p', text: 'Fit an exponential to data by fitting a straight line to its logarithm:' },
            { type: 'code', code: 'import numpy as np\nt = np.array([0, 1, 2, 3, 4.0])\nN = 50 * np.exp(-0.3 * t)\nk, logN0 = np.polyfit(t, np.log(N), 1)   # slope, intercept\nprint(k, np.exp(logN0))                  # -0.3 50.0', say: 'Take the log of the data and fit a straight line with np dot polyfit. The slope is k, minus 0.3, and e to the intercept is N 0, which is 50.' },
            { type: 'note', kind: 'python', text: '`np.log` is the natural logarithm, ln. Base 10 is `np.log10`. Mixing them up is one of the most common bugs in scientific code.' },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                R`Writing {{\log(x+y)=\log x+\log y|log of x plus y equals log x plus log y}}. The law is for products.`,
                'Using np.log when base 10 was meant, or the other way round.',
                R`Taking the log of zero or a negative number, which gives -inf or nan.`,
                R`Confusing the rate {{k|k}} with the doubling time. Doubling time is {{\ln2/k|ln 2 over k}}, not {{1/k|1 over k}}.`,
                R`Putting a quantity with units into an exponent: {{e^{t}|e to the t}} with {{t|t}} in seconds is meaningless; you need {{e^{kt}|e to the k t}}.`,
                'Computing log(sum(exp(x))) directly and getting inf.',
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: R`Chemical reaction rates follow the Arrhenius law {{k=Ae^{-E_a/(RT)}|k equals A e to the minus E a over R T}}: a small rise in temperature multiplies the rate. Reaction simulations evaluate it constantly, often in log form to stay accurate.` },
            { type: 'p', text: 'Epidemic models grow exponentially at first; the growth rate and doubling time are estimated by fitting a line to the logarithm of case counts.' },
            { type: 'p', text: 'Convergence of numerical methods is judged on log axes: an error that falls by a constant factor per iteration is a straight line on a semilog plot.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                'Exponentials multiply by a constant factor per step; they model rates proportional to amount.',
                R`Logarithms invert them and turn products into sums: {{\log(xy)=\log x+\log y|log of x y equals log x plus log y}}.`,
                R`{{e\approx2.71828|e is about 2.71828}} is the base whose exponential is its own derivative; {{N_0e^{kt}|N 0 e to the k t}} has rate {{kN|k N}}.`,
                R`Doubling time and half-life are {{\ln2/|k||ln 2 over k}}; log scales turn exponentials into straight lines.`,
                'On a computer: watch overflow near exp(710), use log1p/expm1 for tiny inputs, and the log-sum-exp trick for sums.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: 'A piece of wood has 30% of the carbon-14 that a living tree has. Carbon-14 has a half-life of 5730 years. How old is the wood?',
      lines: [
        { tex: R`\left(\tfrac12\right)^{t/5730}=0.30`, say: 'one half to the power t over 5730 equals 0.30', why: 'Fraction remaining after t years of decay with that half-life.' },
        { tex: R`\frac{t}{5730}\ln\tfrac12=\ln0.30`, say: 't over 5730 times ln of one half equals ln of 0.30', why: 'Took ln of both sides; used ln of x to the k equals k ln x.' },
        { tex: R`t=5730\cdot\frac{\ln0.30}{\ln0.5}`, say: 't equals 5730 times ln 0.30 over ln 0.5', why: 'Solved for t.' },
        { tex: R`t\approx5730\cdot\frac{-1.204}{-0.693}\approx5730\cdot1.737`, say: 't is about 5730 times minus 1.204 over minus 0.693, about 5730 times 1.737', why: 'Evaluated the logs. Both are negative, so the ratio is positive.' },
        { tex: R`t\approx9950\ \text{years}`, say: 't is about 9950 years', why: 'Multiplied out (9952.8, rounded to three significant figures).' },
      ],
      takeaway: 'Take logs to bring the unknown out of the exponent. A sanity check: 30% is between one half (5730 years) and one quarter (11 460 years), and so is the answer.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-solve',
          prompt: R`Solve {{3\cdot2^x=48|3 times 2 to the x equals 48}}.`,
          answer: { kind: 'numeric', value: 4, absTol: 1e-9 },
          hints: ['Isolate the exponential first.', R`Divide by 3: {{2^x=16|2 to the x equals 16}}.`, R`{{16=2^4|16 is 2 to the 4}}, or use {{x=\ln16/\ln2|x equals ln 16 over ln 2}}.`],
          solution: [
            { tex: R`2^x=16`, say: '2 to the x equals 16', why: 'Divided both sides by 3.' },
            { tex: R`x=\log_2 16=4`, say: 'x equals log base 2 of 16, which is 4', why: 'Took the base-2 logarithm.' },
          ],
          solutionFinal: '4',
          truth: 'solve(Eq(3*2**x, 48), x)[0]',
        },
        {
          id: 'yt-doubling',
          prompt: R`A population grows as {{N_0e^{0.05t}|N 0 e to the 0.05 t}} with {{t|t}} in years. What is its doubling time? Include units.`,
          answer: { kind: 'numeric', value: Math.LN2 / 0.05, relTol: 2e-3, unit: 'yr' },
          hints: [R`Set {{e^{0.05t}=2|e to the 0.05 t equals 2}}.`, R`Take ln: {{0.05t=\ln2|0.05 t equals ln 2}}.`, R`{{\ln2\approx0.693|ln 2 is about 0.693}}. Divide by 0.05.`],
          solution: [
            { tex: R`e^{0.05t}=2\ \Rightarrow\ 0.05t=\ln2`, say: 'e to the 0.05 t equals 2, so 0.05 t equals ln 2', why: 'Doubling means the factor is 2; took ln.' },
            { tex: R`t=\frac{\ln2}{0.05}\approx13.9\ \text{years}`, say: 't equals ln 2 over 0.05, about 13.9 years', why: 'Divided by the rate.' },
          ],
          solutionFinal: 'log(2)/0.05',
          truth: 'solve(Eq(exp(Rational(5,100)*x), 2), x)[0]',
        },
        {
          id: 'yt-simplify',
          prompt: R`Simplify {{\ln\!\left(e^{3x}\cdot e^{2}\right)|ln of e to the 3 x times e squared}}.`,
          answer: { kind: 'expr', expr: '3*x + 2', vars: ['x'] },
          hints: ['Combine the product of powers first.', R`{{e^{3x}e^2=e^{3x+2}|e to the 3 x times e squared equals e to the 3 x plus 2}}.`, R`{{\ln e^{u}=u|ln of e to the u equals u}}.`],
          solution: [
            { tex: R`e^{3x}\cdot e^2=e^{3x+2}`, say: 'e to the 3 x times e squared equals e to the 3 x plus 2', why: 'Added exponents.' },
            { tex: R`\ln e^{3x+2}=3x+2`, say: 'ln of e to the 3 x plus 2 equals 3 x plus 2', why: 'ln undoes the exponential.' },
          ],
          solutionFinal: '3*x + 2',
          truth: 'expand_log(log(exp(3*x)*exp(2)), force=True)',
        },
        {
          id: 'yt-base',
          prompt: R`Compute {{\log_8 32|log base 8 of 32}}. A fraction is fine.`,
          answer: { kind: 'numeric', value: 5 / 3, relTol: 1e-6 },
          hints: ['Write both numbers as powers of 2.', R`{{8=2^3|8 is 2 cubed}} and {{32=2^5|32 is 2 to the 5}}.`, R`{{8^x=32|8 to the x equals 32}} means {{2^{3x}=2^5|2 to the 3 x equals 2 to the 5}}.`],
          solution: [
            { tex: R`8^x=32\ \Rightarrow\ 2^{3x}=2^5`, say: '8 to the x equals 32, so 2 to the 3 x equals 2 to the 5', why: 'Wrote both sides as powers of 2.' },
            { tex: R`3x=5\ \Rightarrow\ x=\tfrac53`, say: '3 x equals 5, so x equals five thirds', why: 'Equal powers of the same base: equal exponents.' },
          ],
          solutionFinal: '5/3',
          truth: 'log(32, 8)',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-fit',
        title: 'Measure a decay rate from data',
        prompt: "Write `fit_exponential(t, N)` that returns `(N0, k)` for data that follow {{N\approx N_0e^{kt}|N approximately N 0 e to the k t}}, by fitting a straight line to `log(N)` with `np.polyfit`. Then write `half_life(k)` for {{k<0|k negative}}. The tests use exact data and a noisy data set.",
        starter: 'import numpy as np\n\ndef fit_exponential(t, N):\n    # fit a line to log(N): slope and intercept\n    return None, None\n\ndef half_life(k):\n    pass\n',
        solution: 'import numpy as np\n\ndef fit_exponential(t, N):\n    k, c = np.polyfit(np.asarray(t, float), np.log(np.asarray(N, float)), 1)\n    return np.exp(c), k\n\ndef half_life(k):\n    return np.log(2) / -k\n',
        tests: [
          'import numpy as np',
          'def test_exact_data():',
          '    t = np.linspace(0, 10, 11)',
          '    N0, k = fit_exponential(t, 80 * np.exp(-0.25 * t))',
          '    assert abs(N0 - 80) < 1e-9 and abs(k + 0.25) < 1e-12, (N0, k)',
          'def test_noisy_data():',
          '    rng = np.random.default_rng(1)',
          '    t = np.linspace(0, 20, 40)',
          '    N = 1000 * np.exp(-0.1 * t) * np.exp(rng.normal(0, 0.02, t.size))',
          '    N0, k = fit_exponential(t, N)',
          '    assert abs(k + 0.1) < 0.005 and abs(N0 - 1000) < 30, (N0, k)',
          'def test_half_life():',
          '    assert abs(half_life(-np.log(2) / 5730) - 5730) < 1e-9',
        ].join('\n'),
        hints: ['Taking logs turns N0·e^(kt) into log N0 + k t, a straight line in t.', 'np.polyfit(t, np.log(N), 1) returns [slope, intercept].', 'The slope is k; N0 is e to the intercept. Half-life is ln 2 / (−k).'],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: 'Fill the gaps in a log-sum-exp function that cannot overflow.',
      template: 'import numpy as np\n\ndef logsumexp(x):\n    x = np.asarray(x, dtype=float)\n    m = ⟦a⟧                        # the largest entry\n    return m + np.log(np.sum(np.exp(x - ⟦b⟧)))\n\nprint(logsumexp([1000.0, 1000.0]))   # 1000.693...\n',
      blanks: [
        { id: 'a', answers: ['np.max(x)', 'x.max()', 'max(x)', 'np.amax(x)'], check: 'exact', width: 10, hint: 'Factor out the biggest exponent so every remaining exponent is at most 0.' },
        { id: 'b', answers: ['m'], check: 'exact', hint: 'Subtract the same number you factored out.' },
      ],
      tests: [
        'def test_no_overflow():',
        '    assert abs(logsumexp([1000.0, 1000.0]) - (1000 + np.log(2))) < 1e-12',
        'def test_matches_naive_for_small():',
        '    x = np.array([0.1, -2.0, 1.5])',
        '    assert abs(logsumexp(x) - np.log(np.sum(np.exp(x)))) < 1e-12',
        'def test_very_negative():',
        '    assert abs(logsumexp([-1000.0, -1000.0]) - (-1000 + np.log(2))) < 1e-12',
      ].join('\n'),
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Archaeology and geology', title: 'Radiometric dating', text: 'Carbon-14 (half-life about 5730 years) dates organic material up to tens of thousands of years old; other isotopes with longer half-lives date rocks.' },
        { field: 'Chemistry', title: 'The Arrhenius law', text: R`Reaction rates scale as {{e^{-E_a/(RT)}|e to the minus E a over R T}}. Combustion and atmospheric chemistry simulations evaluate this for every reaction at every grid cell.` },
        { field: 'Epidemiology', title: 'Early growth of an outbreak', text: 'Early case counts grow roughly exponentially. Fitting a line to their logarithm gives the growth rate and doubling time, which feed into estimates of the reproduction number.' },
        { field: 'Medicine', title: 'Drug elimination', text: 'Many drugs are cleared from the blood at a rate proportional to their concentration, so their concentration decays exponentially with a characteristic half-life that sets dosing intervals.' },
        { field: 'Machine learning', title: 'Softmax and log-sum-exp', text: 'Classifiers turn scores into probabilities with the softmax, exp(xᵢ)/Σ exp(xⱼ). Every library computes it with the max-subtraction trick to avoid overflow.' },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-doubling',
          title: 'Doubling time',
          difficulty: 'easy',
          prompt: 'Write `doubling_time(k)` for growth {{e^{kt}|e to the k t}} with `k > 0`.',
          starter: 'def doubling_time(k):\n    pass\n',
          solution: 'import math\n\ndef doubling_time(k):\n    return math.log(2) / k\n',
          tests: ['import math', 'def test_value():', '    assert abs(doubling_time(0.05) - 13.862943611198906) < 1e-12', 'def test_k_ln2():', '    assert abs(doubling_time(math.log(2)) - 1) < 1e-15'].join('\n'),
          hints: ['Solve e^(kt) = 2 for t.', 'Take ln of both sides.', 'return math.log(2) / k'],
        },
        {
          id: 'pb-compound',
          title: 'Compound interest',
          difficulty: 'easy',
          prompt: 'Write `compound(P, r, n, years)`: the value of `P` after `years` at annual rate `r`, compounded `n` times a year, {{P(1+r/n)^{n\\cdot\\text{years}}|P times 1 plus r over n, to the n times years}}.',
          starter: 'def compound(P, r, n, years):\n    pass\n',
          solution: 'def compound(P, r, n, years):\n    return P * (1 + r / n) ** (n * years)\n',
          tests: [
            'import math',
            'def test_yearly():',
            '    assert abs(compound(100, 0.1, 1, 2) - 121) < 1e-9',
            'def test_tends_to_e():',
            '    assert abs(compound(1, 1, 10**6, 1) - math.e) < 1e-5',
          ].join('\n'),
          hints: ['Each period multiplies by (1 + r/n).', 'There are n × years periods.', 'return P * (1 + r / n) ** (n * years)'],
        },
        {
          id: 'pb-softmax',
          title: 'A softmax that never overflows',
          difficulty: 'medium',
          prompt: 'Write `softmax(x)` returning the NumPy array {{e^{x_i}/\\sum_j e^{x_j}|e to the x i over the sum of e to the x j}}. It must work for `x = [1000, 1001, 1002]`, where `np.exp` overflows.',
          starter: 'import numpy as np\n\ndef softmax(x):\n    e = np.exp(np.asarray(x, dtype=float))\n    return e / e.sum()\n',
          solution: 'import numpy as np\n\ndef softmax(x):\n    x = np.asarray(x, dtype=float)\n    e = np.exp(x - x.max())\n    return e / e.sum()\n',
          tests: [
            'import numpy as np',
            'def test_sums_to_one():',
            '    assert abs(softmax([1.0, 2.0, 3.0]).sum() - 1) < 1e-12',
            'def test_huge_inputs():',
            '    p = softmax([1000.0, 1001.0, 1002.0])',
            '    assert np.all(np.isfinite(p)) and np.allclose(p, softmax([0.0, 1.0, 2.0]))',
            'def test_values():',
            '    assert np.allclose(softmax([0.0, np.log(3.0)]), [0.25, 0.75])',
          ].join('\n'),
          hints: ['Subtracting the same number from every x doesn’t change the result: it cancels top and bottom.', 'Subtract the maximum, so the biggest exponent is 0.', 'e = np.exp(x - x.max()); return e / e.sum()'],
        },
      ],
      outside: [
        { source: 'Paul’s Online Math Notes', item: 'Algebra → "Exponential and Logarithm Functions" chapter: Exponential Functions, Logarithm Functions, Solving Exponential Equations, Applications', why: 'Practice problems with full solutions.' },
        { source: 'OpenStax College Algebra (also on LibreTexts)', item: 'Chapter 6 "Exponential and Logarithmic Functions", including "Exponential and Logarithmic Models"', why: 'Many applied exercises: decay, growth, dating.' },
        { source: '3Blue1Brown', item: 'Essence of Calculus, chapter 5: "What’s so special about Euler’s number e?"', why: 'Why e is the natural base, visually.' },
        { source: 'Khan Academy', item: 'Algebra 2 → "Logarithms" and "Exponential models" units', why: 'Short interactive drills.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: what makes growth exponential, what a logarithm does, and why scientists like the base e. Use the words "factor", "inverse" and "rate".',
      quiz: [
        { id: 'qz-lnexp', prompt: R`What is {{\ln(e^{5})|ln of e to the 5}}?`, answer: { kind: 'numeric', value: 5, absTol: 1e-12 }, explain: R`{{\ln|ln}} undoes {{e^{\,\cdot}|e to the power}}.` },
        { id: 'qz-halflife', prompt: R`After three half-lives, what fraction of a radioactive sample is left?`, answer: { kind: 'numeric', value: 0.125, relTol: 1e-9 }, explain: R`{{(1/2)^3=1/8=0.125|one half cubed is one eighth}}.` },
        { id: 'qz-loglog', prompt: R`On log–log axes, the error of a method falls along a straight line of slope 2. The error is roughly proportional to…`, answer: { kind: 'mc', options: ['{{h|h}}', '{{h^2|h squared}}', '{{e^{2h}|e to the 2 h}}', '{{\\log h|log h}}'], correct: 1 }, explain: R`{{\log E=\log C+2\log h|log E equals log C plus 2 log h}} means {{E=Ch^2|E equals C h squared}}.` },
      ],
    },
  ],
};

export default topic;
