/**
 * Foundations 0.2 — Functions and graphs.
 */
import type { AnimationDef, SandboxDef, Scene, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, scene } from '../../lib';

const R = String.raw;

const bump = (x: number) => 2 * Math.exp(-x * x);

// ------------------------------------------------------------------ animations

function transformAnim(): AnimationDef {
  const base: SceneItem = { kind: 'fn', f: bump, role: 'muted', dash: true, width: 2 };
  const steps: [string, (x: number) => number, string, string][] = [
    ['y = f(x)', bump, 'Start with a bump, y equals f of x, peaked at x equals 0.', 'A bump-shaped curve with its peak at x equals 0.'],
    ['y = f(x − 2)', (x) => bump(x - 2), 'f of x minus 2: the bump moves 2 to the RIGHT. At x equals 2 we feed f the value 0, where its peak is.', 'The bump shifted right by 2.'],
    ['y = f(x) + 1', (x) => bump(x) + 1, 'f of x plus 1: every height goes up by 1. Changes outside f act on the outputs, the way you expect.', 'The bump shifted up by 1.'],
    ['y = 2 f(x)', (x) => 2 * bump(x), '2 times f of x: every height doubles. The bump stretches vertically.', 'The bump stretched to twice the height.'],
    ['y = f(2x)', (x) => bump(2 * x), 'f of 2 x: the bump is squeezed to half its width. Inside changes act on the inputs, and work backwards.', 'The bump squeezed to half its width.'],
    ['y = −f(x)', (x) => -bump(x), 'Minus f of x: the graph flips upside down across the x axis.', 'The bump reflected below the x axis.'],
  ];
  return anim(
    'transform',
    'Moving and stretching a graph',
    steps.map(([lab, g, cap, alt], i) =>
      frame(
        scene([-4, 5], [-2.5, 4.5], [...(i ? [base] : []), { kind: 'fn', f: g, role: 'q-f', width: 3.5 }, { kind: 'label', at: [-3.7, 3.9], text: lab, role: 'q-f', hand: true, size: 26 }], `${alt} The original is dashed.`),
        cap,
      ),
    ),
  );
}

/** Function "machines" in two orders. */
function compositionAnim(): AnimationDef {
  const box = (x: number, label: string, role: 'q-f' | 'q-slope', lit: boolean): SceneItem[] => [
    { kind: 'rect', x, y: 1, w: 2.4, h: 1.4, role, opacity: lit ? 0.45 : 0.15 },
    { kind: 'label', at: [x + 1.2, 1.55], text: label, role, anchor: 'middle', hand: true, size: 22 },
  ];
  const val = (x: number, v: string, show: boolean): SceneItem[] => (show ? [{ kind: 'label', at: [x, 2.9], text: v, role: 'active', anchor: 'middle', hand: true, size: 30 }] : []);
  const arrow = (a: number, b: number): SceneItem => ({ kind: 'segment', a: [a, 1.7], b: [b, 1.7], role: 'muted', arrow: true });
  const sc = (title: string, first: [string, 'q-f' | 'q-slope'], second: [string, 'q-f' | 'q-slope'], vals: string[], k: number): Scene =>
    scene(
      [0, 12],
      [0, 4],
      [
        { kind: 'label', at: [6, 3.7], text: title, role: 'ink', anchor: 'middle', hand: true, size: 24 },
        arrow(0.6, 2.4), ...box(2.5, first[0], first[1], k === 1), arrow(4.9, 6.9), ...box(7, second[0], second[1], k === 2), arrow(9.4, 11.4),
        ...val(1.4, vals[0], k >= 0), ...val(5.9, vals[1], k >= 1), ...val(10.5, vals[2], k >= 2),
      ],
      `${title}: input ${vals[0]}${k >= 1 ? `, middle ${vals[1]}` : ''}${k >= 2 ? `, output ${vals[2]}` : ''}.`,
      { axes: false, grid: false, size: [640, 230] },
    );
  const F: [string, 'q-f'] = ['f: add 1', 'q-f'];
  const G: [string, 'q-slope'] = ['g: square', 'q-slope'];
  return anim('compose', 'Composition: order matters', [
    frame(sc('g(f(x)): first f, then g', F, G, ['2', '3', '9'], 0), 'Feed in x equals 2. First f, which adds 1.'),
    frame(sc('g(f(x)): first f, then g', F, G, ['2', '3', '9'], 1), 'f of 2 is 3. That output becomes the input of g.'),
    frame(sc('g(f(x)): first f, then g', F, G, ['2', '3', '9'], 2), 'g squares it: g of f of 2 is 9.'),
    frame(sc('f(g(x)): first g, then f', G, F, ['2', '4', '5'], 2), 'Swap the order: g of 2 is 4, then f gives 5. Same machines, different answer: g of f is not f of g.'),
  ]);
}

function inverseAnim(): AnimationDef {
  const f = (x: number) => (x * x * x) / 4 + 0.5 * x;
  const xs = [-2, -1, 0, 1, 2];
  const base: SceneItem[] = [
    { kind: 'fn', f: (x) => x, role: 'muted', dash: true, width: 1.5 },
    { kind: 'fn', f, role: 'q-f', width: 3.5 },
    { kind: 'label', at: [2.2, 3.6], text: 'y = f(x)', role: 'q-f', hand: true, size: 20 },
    { kind: 'label', at: [3.1, 2.6], text: 'y = x', role: 'muted', hand: true, size: 18 },
  ];
  const pts = (k: number): SceneItem[] =>
    xs.slice(0, k).flatMap((x) => [
      { kind: 'point' as const, at: [x, f(x)] as [number, number], role: 'q-f' as const, r: 4.5 },
      { kind: 'point' as const, at: [f(x), x] as [number, number], role: 'result' as const, r: 4.5 },
      { kind: 'segment' as const, a: [x, f(x)] as [number, number], b: [f(x), x] as [number, number], role: 'muted' as const, dash: true, width: 1.2 },
    ]);
  // inverse curve, drawn parametrically
  const inv: SceneItem = { kind: 'polyline', points: Array.from({ length: 81 }, (_, i) => { const x = -2.4 + (4.8 * i) / 80; return [f(x), x] as [number, number]; }), role: 'result', width: 3.5 };
  const sc = (items: SceneItem[], alt: string) => scene([-4, 4], [-4, 4], items, alt, { size: [520, 520] });
  return anim('inverse', 'The inverse is a reflection in y = x', [
    frame(sc(base, 'An increasing curve and the dashed line y equals x.'), 'Here is an increasing function f, and the dashed line y equals x.'),
    frame(sc([...base, ...pts(2)], 'Two points of f and their mirror images.'), 'Take a point a, f of a on the graph. Swap its coordinates: f of a, a. That is the mirror image in the line y equals x.'),
    frame(sc([...base, ...pts(5)], 'Five points of f and their mirror images.'), 'Do it for every point. Swapping input and output is exactly what an inverse does.'),
    frame(sc([...base, ...pts(5), inv, { kind: 'label', at: [0.6, -3.5], text: 'y = f⁻¹(x)', role: 'result', hand: true, size: 20 }], 'The inverse function drawn as the reflection of f in y equals x.'), 'The mirror images form the graph of f inverse. It undoes f: f inverse of f of x is x.'),
  ]);
}

function squeezeReveal(): AnimationDef {
  const f = (x: number) => 2 * Math.exp(-((x - 4) ** 2));
  const g = (x: number) => f(2 * x);
  const sc = (items: SceneItem[], alt: string) => scene([-1, 7], [-0.5, 2.8], items, alt);
  const F: SceneItem = { kind: 'fn', f, role: 'q-f', width: 3 };
  return anim('squeeze', 'Where does the peak of f(2x) go?', [
    frame(sc([F, { kind: 'point', at: [4, 2], role: 'q-f', label: 'peak of f at x = 4', labelDir: 'ne' }], 'f has its peak at x equals 4.'), 'f has its peak at x equals 4.'),
    frame(sc([F, { kind: 'fn', f: g, role: 'result', width: 3.5 }], 'f and the squeezed curve f of 2 x.'), 'Now draw g of x equals f of 2 x.'),
    frame(sc([F, { kind: 'fn', f: g, role: 'result', width: 3.5 }, { kind: 'point', at: [2, 2], role: 'result', label: 'peak of g at x = 2', labelDir: 'nw' }], 'The peak of g is at x equals 2.'), 'Its peak is at x equals 2, because g of 2 is f of 4. The inside factor 2 squeezes the graph towards the axis: positions are divided by 2.'),
  ]);
}

// ------------------------------------------------------------------ sandbox

const BASES: Record<string, { label: string; f: (x: number) => number }> = {
  sq: { label: 'x²', f: (x) => x * x },
  abs: { label: '|x|', f: Math.abs },
  sqrt: { label: '√x', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN) },
  sin: { label: 'sin x', f: Math.sin },
  bump: { label: 'bump', f: bump },
};

const transformLab: SandboxDef = {
  id: 'transform-lab',
  title: 'Transformation lab',
  intro: R`Pick a base function and set {{a|a}}, {{b|b}}, {{c|c}}, {{d|d}} in {{y=a\,f\big(b(x-c)\big)+d|y equals a times f of b times x minus c, plus d}}. The dashed curve is the original. Predict each change before you make it.`,
  choices: [{ id: 'f', label: 'Base function', init: 'sq', options: Object.entries(BASES).map(([value, v]) => ({ value, label: v.label })) }],
  sliders: [
    { id: 'a', label: 'a (vertical stretch)', min: -3, max: 3, step: 0.1, init: 1, role: 'q-f' },
    { id: 'b', label: 'b (horizontal squeeze)', min: -3, max: 3, step: 0.1, init: 1, role: 'q-x' },
    { id: 'c', label: 'c (shift right)', min: -4, max: 4, step: 0.1, init: 0, role: 'q-x' },
    { id: 'd', label: 'd (shift up)', min: -4, max: 4, step: 0.1, init: 0, role: 'q-f' },
  ],
  render: (s) => {
    const B = BASES[s.choices.f];
    const { a, b, c, d } = s.values;
    const g = (x: number) => a * B.f(b * (x - c)) + d;
    return {
      scene: scene([-6, 6], [-6, 6], [{ kind: 'fn', f: B.f, role: 'muted', dash: true, width: 2 }, { kind: 'fn', f: g, role: 'q-f', width: 3.5, samples: 400 }], `Graph of ${a} times ${B.label} of ${b} times x minus ${c}, plus ${d}, with the original dashed.`),
      eq: { tex: R`y=${fmt(a, 3)}\,f\big(${fmt(b, 3)}\,(x-${fmt(c, 3)})\big)+${fmt(d, 3)}`.replace(/-\-/g, '+').replace(/\+-/g, '-'), say: `y equals ${fmt(a, 3)} times f of ${fmt(b, 3)} times x minus ${fmt(c, 3)}, plus ${fmt(d, 3)}` },
      note: b === 0 ? 'b = 0 feeds f the same input everywhere, so the graph is a flat line.' : Math.abs(b) < 1 ? `|b| < 1 stretches the graph sideways by a factor ${fmt(1 / Math.abs(b), 3)}.` : undefined,
    };
  },
  tryThis: [
    R`Set {{c=2|c equals 2}}. The graph moves right, even though you typed "minus 2" inside.`,
    R`Set {{b=2|b equals 2}}. The graph gets narrower, not wider. Then try {{b=-1|b equals minus 1}}.`,
    R`With the square-root base, set {{c=3|c equals 3}}. Where does the graph start now, and why?`,
  ],
};

// ------------------------------------------------------------------ topic

const hookScene: Scene = scene(
  [-1, 10],
  [-0.5, 3],
  [
    { kind: 'fn', f: (x) => 2 * Math.exp(-((x - 3) ** 2) / 2), role: 'q-f', width: 3.5 },
    { kind: 'label', at: [3, 2.4], text: 'T(t): today’s temperature bump', role: 'q-f', anchor: 'middle', hand: true, size: 20 },
    { kind: 'label', at: [7.5, 1.6], text: 'T(t − 2): earlier or later?', role: 'active', anchor: 'middle', hand: true, size: 22 },
  ],
  'A temperature curve peaking at time 3. Question: is T of t minus 2 earlier or later?',
);

const topic: Topic = {
  id: 'f-functions',
  course: 'foundations',
  number: '0.2',
  title: 'Functions and graphs',
  blurb: 'Domain, range, composition, inverses, transformations.',
  icon: 'ƒ',
  prereqs: ['f-algebra'],
  glossary: [
    { id: 'domain', term: 'Domain', def: 'The set of inputs a function accepts. For {{\\sqrt{x}|root x}} on the real numbers it is {{x\\ge0|x at least zero}}.' },
    { id: 'range', term: 'Range', def: 'The set of outputs a function actually produces. For {{x^2|x squared}} on all reals it is {{y\\ge0|y at least zero}}.' },
    { id: 'composition', term: 'Composition', def: 'Feeding one function’s output into another: {{(g\\circ f)(x)=g(f(x))|g after f of x equals g of f of x}}. Order matters.' },
    { id: 'inverse-function', term: 'Inverse function', def: 'The function {{f^{-1}|f inverse}} that undoes {{f|f}}: {{f^{-1}(f(x))=x|f inverse of f of x equals x}}. It exists only when {{f|f}} is one-to-one.' },
    { id: 'one-to-one', term: 'One-to-one (injective)', def: 'Different inputs always give different outputs. On a graph: every horizontal line meets it at most once.' },
    { id: 'piecewise', term: 'Piecewise function', def: 'A function defined by different formulas on different parts of its domain, such as a thermostat that is on below 19 °C and off above.' },
  ],
  formulas: [
    { name: 'Composition', tex: R`(g\circ f)(x)=g\big(f(x)\big)`, say: 'g after f of x equals g of f of x' },
    { name: 'Inverse', tex: R`f^{-1}\big(f(x)\big)=x,\quad f\big(f^{-1}(y)\big)=y`, say: 'f inverse of f of x equals x, and f of f inverse of y equals y' },
    { name: 'Transformations', tex: R`y=a\,f\big(b(x-c)\big)+d`, say: 'y equals a times f of b times x minus c, plus d: stretch by a, squeeze by b, shift right by c, up by d' },
    { name: 'Even and odd', tex: R`\text{even: }f(-x)=f(x),\quad \text{odd: }f(-x)=-f(x)`, say: 'even: f of minus x equals f of x; odd: f of minus x equals minus f of x' },
    { name: 'Linear interpolation', tex: R`f(x)\approx y_i+\frac{y_{i+1}-y_i}{x_{i+1}-x_i}\,(x-x_i)`, say: 'f of x is approximately y i plus the slope between the two data points times x minus x i' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'The temperature today follows T(t). Is the curve T(t − 2) two hours earlier, or two hours later?',
      scene: hookScene,
      teaser: R`Later, which surprises most people: the "minus" moves the graph to the **right**. {{T(t-2)|T of t minus 2}} reaches today’s 3 o’clock value at 5 o’clock. This topic explains why inside changes work backwards, and how to read any graph fluently.`,
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
            { type: 'p', text: 'A function is the basic object of calculus and of modelling. Position as a function of time, temperature as a function of place, a simulation’s output as a function of its parameters: all functions.' },
            { type: 'p', text: 'This topic builds on algebra (0.1). Exponentials, trigonometry and calculus all study particular functions and what can be done with them.' },
            { type: 'note', kind: 'compsci', text: 'A Python `def` is a function in the same sense: inputs in, one output out. Thinking of a whole simulation as one big function is the first step to optimising it, fitting it to data, or measuring its sensitivity.' },
          ],
        },
        {
          id: 'what',
          title: 'What a function is',
          blocks: [
            { type: 'p', text: R`A [[function]] {{f|f}} assigns to **each** allowed input exactly **one** output. The allowed inputs form the [[domain]]. The outputs actually produced form the [[range]].` },
            { type: 'eq', eq: { tex: R`f:\ \Q{x}{x}\ \longmapsto\ \Q{f}{f(x)}`, say: 'f sends x to f of x', label: 'notation' } },
            { type: 'p', text: R`A rule doesn’t need a formula. "The temperature at noon on day {{n|n}}" is a function. A [[piecewise]] rule like "{{0|zero}} below 19 °C, {{1|one}} above" is too. What matters is: one input, one output.` },
            { type: 'p', text: R`"{{y|y}} such that {{y^2=x|y squared equals x}}" is **not** a function of {{x|x}}: for {{x=4|x equals 4}} both {{2|2}} and {{-2|minus 2}} qualify. Choosing one, the non-negative root, gives the function {{\sqrt{x}|root x}}.` },
            { type: 'note', kind: 'remember', text: R`The domain is part of the function. {{f(x)=1/x|f of x equals 1 over x}} has domain "every real number except 0". Forgetting the domain is how code ends up dividing by zero.` },
          ],
        },
        {
          id: 'picture',
          title: 'Picture it: the graph',
          blocks: [
            { type: 'p', text: R`The graph of {{f|f}} is the set of all points {{(x, f(x))|x, f of x}}. Read it like a lookup table: go to {{x|x}} on the horizontal axis, up to the curve, across to read {{f(x)|f of x}}.` },
            {
              type: 'figure',
              scene: scene([-1, 6], [-1, 4], [
                { kind: 'fn', f: (x) => (x >= 0 ? Math.sqrt(x) * 1.4 : NaN), from: 0, to: 6, role: 'q-f', width: 3.5 },
                { kind: 'segment', a: [2, 0], b: [2, Math.sqrt(2) * 1.4], role: 'q-x', dash: true },
                { kind: 'segment', a: [2, Math.sqrt(2) * 1.4], b: [0, Math.sqrt(2) * 1.4], role: 'q-f', dash: true },
                { kind: 'point', at: [2, Math.sqrt(2) * 1.4], role: 'active', label: '(x, f(x))', labelDir: 'nw' },
                { kind: 'brace', a: [0, -0.5], b: [6, -0.5], text: 'domain x ≥ 0', role: 'q-x' },
                { kind: 'point', at: [0, 0], role: 'q-f', r: 5 },
              ], 'Graph of a square-root shaped function starting at the origin, with one point read off and the domain marked.'),
              caption: R`Reading {{f(2)|f of 2}}: up from {{x=2|x equals 2}}, across to the output. The domain starts at 0; the graph has nothing to the left.`,
            },
            { type: 'p', text: R`The **vertical line test**: a curve is the graph of a function exactly when every vertical line meets it at most once. Two meetings would mean two outputs for one input.` },
          ],
        },
        {
          id: 'compose',
          title: 'Composition and inverses',
          blocks: [
            { type: 'p', text: R`[[composition|Composing]] means chaining: {{(g\circ f)(x)=g(f(x))|g after f of x equals g of f of x}}. Apply {{f|f}} first, then {{g|g}}. Usually {{g\circ f\neq f\circ g|g after f is not f after g}}: putting on socks then shoes differs from shoes then socks.` },
            { type: 'p', text: R`An [[inverse-function|inverse]] {{f^{-1}|f inverse}} undoes {{f|f}}: if {{f(a)=b|f of a equals b}} then {{f^{-1}(b)=a|f inverse of b equals a}}. Its graph is the graph of {{f|f}} reflected in the line {{y=x|y equals x}}, because input and output swap roles.` },
            { type: 'eq', eq: { tex: R`f^{-1}\big(f(x)\big)=x\quad\text{and}\quad f\big(f^{-1}(y)\big)=y`, say: 'f inverse of f of x equals x, and f of f inverse of y equals y', label: 'inverse' } },
            { type: 'note', kind: 'pitfall', text: R`{{f^{-1}(x)|f inverse of x}} is not {{\frac1{f(x)}|1 over f of x}}. The inverse of {{x\mapsto2x|x maps to 2 x}} is {{x\mapsto x/2|x maps to x over 2}}, not {{1/(2x)|1 over 2 x}}.` },
          ],
        },
        {
          id: 'why',
          title: 'Why an inverse needs one-to-one',
          blocks: [
            { type: 'p', text: R`An inverse exists only if {{f|f}} is [[one-to-one]]. Suppose {{f(a)=f(b)=y|f of a equals f of b equals y}} with {{a\neq b|a not equal to b}}. Then {{f^{-1}(y)|f inverse of y}} would have to be both {{a|a}} and {{b|b}}, and a function can’t give two outputs.` },
            { type: 'p', text: R`On a graph this is the **horizontal line test**: no horizontal line may meet the graph twice. {{x^2|x squared}} fails ({{(-2)^2=2^2|minus 2 squared equals 2 squared}}), so it has no inverse on all reals.` },
            { type: 'p', text: R`The fix is to **restrict the domain**. On {{x\ge0|x at least zero}} the square is one-to-one, and its inverse is {{\sqrt{x}|root x}}. Every inverse trig function and the logarithm come from exactly this move.` },
            { type: 'note', kind: 'intuition', text: 'A one-to-one function loses no information: from the output you can always recover the input. A function that is not one-to-one merges inputs, and nothing can un-merge them.' },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three animations: moving and stretching a graph, composition as two machines in a row, and the inverse as a mirror image.', anims: [transformAnim(), compositionAnim(), inverseAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-shift', prompt: R`The graph of {{y=f(x-3)|y equals f of x minus 3}} is the graph of {{f|f}} moved…`, answer: { kind: 'mc', options: ['3 to the left', '3 to the right', '3 up', '3 down'], correct: 1 }, explain: R`At {{x=3+u|x equals 3 plus u}} it takes the value {{f(u)|f of u}}: whatever {{f|f}} did at {{u|u}} now happens 3 units later, to the right.` },
        { id: 'rc-compose', prompt: R`With {{f(x)=x+1|f of x equals x plus 1}} and {{g(x)=x^2|g of x equals x squared}}, compute {{g(f(2))|g of f of 2}}.`, answer: { kind: 'numeric', value: 9, absTol: 1e-12 }, explain: R`{{f(2)=3|f of 2 is 3}}, then {{g(3)=9|g of 3 is 9}}. The other order gives {{f(g(2))=5|f of g of 2 is 5}}.` },
        { id: 'rc-inverse', prompt: 'Which function has an inverse on all real numbers?', answer: { kind: 'mc', options: ['{{x^2|x squared}}', '{{|x||absolute x}}', '{{x^3|x cubed}}', '{{\\sin x|sine x}}'], correct: 2 }, explain: R`{{x^3|x cubed}} is strictly increasing, so it is one-to-one. The others give the same output for different inputs.` },
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
          id: 'transforms',
          title: 'Transformations, and why inside works backwards',
          blocks: [
            { type: 'eq', eq: { tex: R`y=\Q{f}{a}\,f\big(\Q{x}{b}(x-\Q{x}{c})\big)+\Q{f}{d}`, say: 'y equals a times f of b times x minus c, plus d', label: 'general form' } },
            { type: 'p', text: R`Outside changes act on outputs, in the obvious direction: {{d|d}} shifts up, {{a|a}} stretches vertically, and a negative {{a|a}} flips across the {{x|x}}-axis.` },
            { type: 'p', text: R`Inside changes act on inputs, and work **backwards**. In {{f(x-c)|f of x minus c}}, the value {{f|f}} had at {{u|u}} now appears at {{x=u+c|x equals u plus c}}: shifted right by {{c|c}}. In {{f(bx)|f of b x}}, it appears at {{x=u/b|x equals u over b}}: squeezed by {{b|b}}.` },
            { type: 'note', kind: 'intuition', text: R`Inside changes are a change of clock. {{T(t-2)|T of t minus 2}} is "what the thermometer read 2 hours ago", so every event happens 2 hours later on the new clock.` },
          ],
        },
        {
          id: 'families',
          title: 'Families of functions',
          blocks: [
            { type: 'p', text: R`**Linear** {{mx+c|m x plus c}}: constant rate of change. **Polynomials** such as {{x^3-2x|x cubed minus 2 x}}: smooth, defined everywhere. **Rational** functions, polynomial over polynomial, blow up where the bottom is zero (a vertical asymptote).` },
            { type: 'p', text: R`**Even** functions satisfy {{f(-x)=f(x)|f of minus x equals f of x}}: mirror-symmetric, like {{x^2|x squared}} and {{\cos x|cos x}}. **Odd** functions satisfy {{f(-x)=-f(x)|f of minus x equals minus f of x}}: symmetric under a half-turn, like {{x^3|x cubed}} and {{\sin x|sine x}}.` },
            { type: 'p', text: R`A function is **increasing** if bigger inputs give bigger outputs. Strictly increasing functions are always one-to-one, which is the easiest way to know an inverse exists.` },
            { type: 'note', kind: 'compsci', text: 'Symmetry saves work. If a simulation’s set-up is even in x, you only need to simulate half the domain and mirror the result. Large solvers use exactly this trick.' },
          ],
        },
        {
          id: 'data',
          title: 'Functions given by data',
          blocks: [
            { type: 'p', text: R`In computation many functions are only known at sample points: a table of air density at different heights, or a sensor reading every second. Between samples we **interpolate**.` },
            { type: 'p', text: R`Linear interpolation joins neighbouring points with straight lines. Between {{(x_i,y_i)|x i, y i}} and {{(x_{i+1},y_{i+1})|x i plus 1, y i plus 1}} it uses the slope of that segment:` },
            { type: 'eq', eq: { tex: R`f(x)\approx y_i+\frac{y_{i+1}-y_i}{x_{i+1}-x_i}\,(x-x_i)`, say: 'f of x is approximately y i plus y i plus 1 minus y i, over x i plus 1 minus x i, times x minus x i', label: 'linear interpolation' } },
            { type: 'note', kind: 'pitfall', text: 'Interpolating inside the data is usually safe. Extrapolating beyond the last sample is guessing: the table says nothing about what happens there.' },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: transformLab },
    {
      id: 'predict',
      kind: 'predict',
      question: R`{{f|f}} has a single peak at {{x=4|x equals 4}}. Where is the peak of {{g(x)=f(2x)|g of x equals f of 2 x}}?`,
      answer: { kind: 'mc', options: ['x = 8', 'x = 2', 'x = 4', 'x = 6'], correct: 1 },
      reveal: squeezeReveal(),
      explain: R`The peak of {{g|g}} is where {{2x=4|2 x equals 4}}, so at {{x=2|x equals 2}}. The factor inside divides positions, it doesn’t multiply them. That is the same "inside works backwards" rule as the shift.`,
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
            { type: 'p', text: 'On a computer a function of a real variable is usually evaluated on a grid of sample points, an array. A plot is just the samples joined by lines, so too few samples can hide a sharp spike completely.' },
            { type: 'p', text: R`Domains bite in floating point. {{0.3-3\times0.1|0.3 minus 3 times 0.1}} should be 0, but it is {{-5.55\times10^{-17}|minus 5.55 times ten to the minus seventeen}}, and \`np.sqrt\` of it is \`nan\` (not a number). Clip with \`np.maximum(0, …)\` when rounding may push a value just outside the domain.` },
            { type: 'p', text: R`Speed matters too. NumPy evaluates a function on a whole array in compiled code, often 10 to 100 times faster than a Python loop over the same points. Writing functions that accept arrays is called vectorising.` },
            { type: 'note', kind: 'compsci', text: 'A nan spreads: any arithmetic with nan gives nan. One out-of-domain value deep inside a simulation can turn every later number into nan. Check inputs at the boundary of each function.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'code', code: 'import numpy as np\n\ndef f(x):\n    return x**2 + 1          # works for numbers and arrays\n\ng = lambda x: 3*x - 2        # a short anonymous function\ncompose = lambda f, g: (lambda x: f(g(x)))\nprint(compose(f, g)(2))      # f(g(2)) = f(4) = 17\nprint(compose(g, f)(2))      # g(f(2)) = g(5) = 13\n\nx = np.linspace(-2, 2, 5)\nprint(f(x))                  # [5. 2. 1. 2. 5.]', say: 'Define f with def and g with lambda. compose builds f of g. f of g of 2 is 17, g of f of 2 is 13. Passing an array to f evaluates it at every point.' },
            { type: 'code', code: 'import numpy as np\nheights = np.array([0, 1000, 2000, 3000.0])      # m\ndensity = np.array([1.225, 1.112, 1.007, 0.909])  # kg/m^3\nprint(np.interp(1500, heights, density))         # 1.0595', say: 'A function given by data: air density at four heights. np dot interp gives the linearly interpolated value at 1500 metres.' },
            { type: 'note', kind: 'python', text: 'Write functions with NumPy operations (`np.sin`, `**`, `np.where`) rather than `math` functions and `if` statements, so they work on whole arrays at once.' },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                R`Shifting the wrong way: {{f(x-2)|f of x minus 2}} moves right, {{f(x+2)|f of x plus 2}} moves left.`,
                R`Reading {{f^{-1}|f inverse}} as {{1/f|1 over f}}.`,
                R`Composing in the wrong order: {{g(f(x))|g of f of x}} applies {{f|f}} first.`,
                'Ignoring the domain, then getting nan or a division by zero at run time.',
                'Trusting a plot made from too few samples.',
                'Extrapolating a data table far outside its range.',
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: 'Material properties in simulations (density, conductivity, viscosity against temperature) are usually stored as tables and interpolated. Engineering codes call these lookup tables.' },
            { type: 'p', text: 'An inverse problem asks for the input that produced a measured output: the inside of a body from a CT scan, or a model parameter from data. It is "invert the simulation", and it is hard because the simulation is rarely one-to-one.' },
            { type: 'p', text: 'A neural network is one long composition of simple functions. Training it relies on the chain rule for compositions, which you will meet in topic 1.3.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                'A function gives exactly one output for each input in its domain; its graph passes the vertical line test.',
                R`Composition {{g(f(x))|g of f of x}} applies {{f|f}} first; order matters.`,
                'An inverse undoes a function, exists only for one-to-one functions, and its graph is the reflection in y = x.',
                R`In {{a\,f(b(x-c))+d|a f of b times x minus c, plus d}}: outside changes act on outputs; inside changes act on inputs and work backwards.`,
                'On a computer, functions are evaluated on arrays; watch domains, nan, and interpolation outside the data.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: R`Find the inverse of {{f(x)=\frac{2x+3}{x-1}|f of x equals 2 x plus 3, over x minus 1}}, and state its domain.`,
      lines: [
        { tex: R`y=\frac{2x+3}{x-1}`, say: 'y equals 2 x plus 3 over x minus 1', why: 'Named the output y. The domain of f is x ≠ 1.' },
        { tex: R`y(x-1)=2x+3`, say: 'y times x minus 1 equals 2 x plus 3', why: 'Multiplied both sides by x − 1, which is non-zero on the domain.' },
        { tex: R`yx-y=2x+3`, say: 'y x minus y equals 2 x plus 3', why: 'Expanded.' },
        { tex: R`x(y-2)=y+3`, say: 'x times y minus 2 equals y plus 3', why: 'Collected the x terms on one side and factored out x.' },
        { tex: R`x=\frac{y+3}{y-2}`, say: 'x equals y plus 3 over y minus 2', why: 'Divided by y − 2, allowed when y ≠ 2.' },
        { tex: R`f^{-1}(x)=\frac{x+3}{x-2},\quad x\neq2`, say: 'f inverse of x equals x plus 3 over x minus 2, for x not equal to 2', why: 'Renamed the variable. The value 2 is never an output of f, so it is outside the inverse’s domain.' },
      ],
      takeaway: 'To invert: call the output y, solve for x, then swap the names. Every division you make along the way tells you a value that must be excluded.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-compose',
          prompt: R`With {{f(x)=x^2+1|f of x equals x squared plus 1}} and {{g(x)=3x-2|g of x equals 3 x minus 2}}, compute {{(f\circ g)(2)|f after g of 2}}.`,
          answer: { kind: 'numeric', value: 17, absTol: 1e-9 },
          hints: [R`{{(f\circ g)(2)=f(g(2))|f after g of 2 equals f of g of 2}}. Start inside.`, R`{{g(2)=3\cdot2-2=4|g of 2 equals 4}}.`, R`Now {{f(4)=4^2+1|f of 4 equals 4 squared plus 1}}.`],
          solution: [
            { tex: R`g(2)=6-2=4`, say: 'g of 2 equals 6 minus 2, which is 4', why: 'Applied the inner function first.' },
            { tex: R`f(4)=16+1=17`, say: 'f of 4 equals 16 plus 1, which is 17', why: 'Fed that output into f.' },
          ],
          solutionFinal: '17',
          truth: '(x**2 + 1).subs(x, 3*2 - 2)',
        },
        {
          id: 'yt-invert',
          prompt: R`Find the inverse of {{f(x)=\frac{x-4}{3}|f of x equals x minus 4, over 3}}. Type {{f^{-1}(x)|f inverse of x}} in terms of {{x|x}}.`,
          answer: { kind: 'expr', expr: '3*x + 4', vars: ['x'] },
          hints: [R`Write {{y=\frac{x-4}{3}|y equals x minus 4 over 3}} and solve for {{x|x}}.`, R`Multiply by 3: {{3y=x-4|3 y equals x minus 4}}.`, R`So {{x=3y+4|x equals 3 y plus 4}}. Now swap the names.`],
          solution: [
            { tex: R`y=\frac{x-4}{3}\ \Rightarrow\ 3y=x-4`, say: 'y equals x minus 4 over 3, so 3 y equals x minus 4', why: 'Multiplied both sides by 3.' },
            { tex: R`x=3y+4`, say: 'x equals 3 y plus 4', why: 'Added 4.' },
            { tex: R`f^{-1}(x)=3x+4`, say: 'f inverse of x equals 3 x plus 4', why: 'Swapped the names of input and output.' },
          ],
          solutionFinal: '3*x + 4',
          truth: 'solve(Eq(x, (y - 4)/3), y)[0]',
        },
        {
          id: 'yt-transform',
          prompt: R`Write a formula for the graph of {{y=x^2|y equals x squared}} moved 3 units right and 2 units up.`,
          answer: { kind: 'expr', expr: '(x-3)^2 + 2', vars: ['x'] },
          hints: ['Moving right is an inside change.', R`Right by 3 means replacing {{x|x}} by {{x-3|x minus 3}}.`, 'Up by 2 is an outside change: add 2.'],
          solution: [
            { tex: R`x^2\ \to\ (x-3)^2`, say: 'x squared becomes x minus 3, squared', why: 'Shift right by 3: replace x with x − 3.' },
            { tex: R`(x-3)^2+2`, say: 'x minus 3 squared, plus 2', why: 'Shift up by 2: add 2 to the output.' },
          ],
          solutionFinal: '(x-3)**2 + 2',
          truth: '(x**2).subs(x, x - 3) + 2',
        },
        {
          id: 'yt-domain',
          prompt: R`What is the domain of {{h(x)=\frac{\sqrt{x-2}}{x-5}|h of x equals root of x minus 2, over x minus 5}}?`,
          answer: { kind: 'mc', options: ['All real numbers', '{{x\\ge2|x at least 2}}', '{{x\\ge2|x at least 2}} except {{x=5|x equals 5}}', '{{x>5|x greater than 5}}'], correct: 2 },
          hints: ['Two conditions: the square root and the fraction.', R`The root needs {{x-2\ge0|x minus 2 at least zero}}.`, R`The fraction needs {{x-5\neq0|x minus 5 not zero}}.`],
          solution: [
            { tex: R`x-2\ge0\ \Rightarrow\ x\ge2`, say: 'x minus 2 at least zero, so x at least 2', why: 'The square root needs a non-negative argument.' },
            { tex: R`x\neq5`, say: 'x not equal to 5', why: 'The denominator must not be zero.' },
          ],
          solutionFinal: '2',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-inverse',
        title: 'Invert a function numerically',
        prompt: "Many functions have no inverse formula. Write `inverse(f, y, lo, hi, tol=1e-12)` that finds `x` in `[lo, hi]` with `f(x) = y`, for an **increasing** `f`, by **bisection**: halve the interval, keep the half where the answer must be, and stop when the interval is shorter than `tol`.",
        starter: 'def inverse(f, y, lo, hi, tol=1e-12):\n    # keep f(lo) <= y <= f(hi) true while the interval shrinks\n    pass\n',
        solution: 'def inverse(f, y, lo, hi, tol=1e-12):\n    while hi - lo > tol:\n        mid = 0.5 * (lo + hi)\n        if f(mid) < y:\n            lo = mid\n        else:\n            hi = mid\n    return 0.5 * (lo + hi)\n',
        tests: [
          'import math',
          'def test_cube_root():',
          '    assert abs(inverse(lambda x: x**3, 8, 0, 10) - 2) < 1e-9',
          'def test_log_via_exp():',
          '    assert abs(inverse(math.exp, math.e, -5, 5) - 1) < 1e-9',
          'def test_no_formula():',
          '    f = lambda x: x**5 + x',
          '    x = inverse(f, 3, 0, 2)',
          '    assert abs(f(x) - 3) < 1e-9, x',
        ].join('\n'),
        hints: [
          'Loop while hi − lo > tol. Look at the midpoint each time.',
          'If f(mid) < y the answer is to the right, so move lo up to mid; otherwise move hi down to mid.',
          'Return the midpoint of the final interval.',
        ],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: R`Fill the gaps so \`transform\` returns the function {{x\mapsto a\,f(b(x-c))+d|x maps to a f of b times x minus c, plus d}}.`.replace(/\\`/g, '`'),
      template: 'import numpy as np\n\ndef transform(f, a, b, c, d):\n    return lambda x: ⟦A⟧ * f(⟦B⟧ * (x - ⟦C⟧)) + d\n\nbump = lambda x: np.exp(-x**2)\nshifted = transform(bump, 1, 1, 2, 0)\nprint(shifted(2.0))   # the peak, now at x = 2\n',
      blanks: [
        { id: 'A', answers: ['a'], check: 'exact', hint: 'The vertical stretch multiplies the output.' },
        { id: 'B', answers: ['b'], check: 'exact', hint: 'The horizontal factor multiplies the shifted input.' },
        { id: 'C', answers: ['c'], check: 'exact', hint: 'Shift right by c: subtract c from x.' },
      ],
      tests: [
        'def test_shift_right():',
        '    assert abs(shifted(2.0) - 1.0) < 1e-12',
        'def test_all_four():',
        '    g = transform(lambda x: x**2, 2, 3, 1, 5)',
        '    assert abs(g(2.0) - (2 * (3 * (2 - 1))**2 + 5)) < 1e-12',
        'def test_works_on_arrays():',
        '    x = np.array([0.0, 2.0])',
        '    assert transform(bump, 1, 1, 2, 0)(x).shape == (2,)',
      ].join('\n'),
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Engineering simulation', title: 'Lookup tables', text: 'Material properties such as conductivity against temperature are stored as tables and interpolated inside finite-element and CFD codes, every time step, at every point.' },
        { field: 'Medical imaging', title: 'Inverse problems', text: 'A CT scanner measures how X-rays are absorbed along many lines. Reconstructing the image means inverting the measurement function, which takes careful numerical methods because it is badly conditioned.' },
        { field: 'Machine learning', title: 'Networks are compositions', text: 'A neural network is a long composition of simple functions: linear maps and activation functions such as max(0, x). Its training relies on differentiating compositions.' },
        { field: 'Physics', title: 'Moving frames', text: R`A pulse travelling at speed {{c|c}} is {{f(x-ct)|f of x minus c t}}: the shape {{f|f}} shifted right by {{ct|c t}}. This is the heart of the wave equation (topic 3.8).` },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-compose',
          title: 'Compose two functions',
          difficulty: 'easy',
          prompt: 'Write `compose(f, g)` that returns a **new function** computing `f(g(x))`.',
          starter: 'def compose(f, g):\n    pass\n',
          solution: 'def compose(f, g):\n    return lambda x: f(g(x))\n',
          tests: [
            'def test_order():',
            '    f = lambda x: x + 1',
            '    g = lambda x: x * x',
            '    assert compose(f, g)(3) == 10 and compose(g, f)(3) == 16',
            'def test_returns_function():',
            '    assert callable(compose(abs, abs))',
          ].join('\n'),
          hints: ['You must return a function, not a number.', 'A lambda can build a function on the spot.', 'return lambda x: f(g(x))'],
        },
        {
          id: 'pb-sample',
          title: 'Sample a function',
          difficulty: 'easy',
          prompt: 'Write `sample(f, a, b, n)` returning two NumPy arrays `(xs, ys)`: `n` equally spaced points from `a` to `b` (both included), and `f` evaluated at them.',
          starter: 'import numpy as np\n\ndef sample(f, a, b, n):\n    xs = None\n    ys = None\n    return xs, ys\n',
          solution: 'import numpy as np\n\ndef sample(f, a, b, n):\n    xs = np.linspace(a, b, n)\n    ys = f(xs)\n    return xs, ys\n',
          tests: [
            'import numpy as np',
            'def test_endpoints():',
            '    xs, ys = sample(np.sin, 0, np.pi, 5)',
            '    assert len(xs) == 5 and xs[0] == 0 and abs(xs[-1] - np.pi) < 1e-15',
            'def test_values():',
            '    xs, ys = sample(lambda x: x**2, -1, 1, 3)',
            '    assert np.allclose(ys, [1, 0, 1])',
          ].join('\n'),
          hints: ['NumPy has a function for equally spaced points.', 'np.linspace(a, b, n) includes both ends.', 'If f is written with NumPy operations, f(xs) evaluates it at every point.'],
        },
        {
          id: 'pb-interp',
          title: 'Your own linear interpolation',
          difficulty: 'medium',
          prompt: "Write `interp(x, xs, ys)` for sorted `xs`: return the linear interpolation at a single number `x` with `xs[0] <= x <= xs[-1]`. Don’t use `np.interp`; the tests compare with it.",
          starter: 'def interp(x, xs, ys):\n    # find the segment xs[i] <= x <= xs[i+1], then use its slope\n    pass\n',
          solution: 'def interp(x, xs, ys):\n    for i in range(len(xs) - 1):\n        if xs[i] <= x <= xs[i + 1]:\n            t = (x - xs[i]) / (xs[i + 1] - xs[i])\n            return ys[i] + t * (ys[i + 1] - ys[i])\n    raise ValueError("x outside the data")\n',
          tests: [
            'import numpy as np',
            'def test_matches_numpy():',
            '    xs = [0, 1000, 2000, 3000]',
            '    ys = [1.225, 1.112, 1.007, 0.909]',
            '    for x in [0, 250, 1500, 2999, 3000]:',
            '        assert abs(interp(x, xs, ys) - np.interp(x, xs, ys)) < 1e-12, x',
            'def test_at_a_data_point():',
            '    assert interp(2, [0, 2, 4], [5, 7, 3]) == 7',
          ].join('\n'),
          hints: ['First find which segment contains x.', 'Inside that segment, t = (x − xs[i]) / (xs[i+1] − xs[i]) runs from 0 to 1.', 'Return ys[i] + t * (ys[i+1] − ys[i]).'],
        },
      ],
      outside: [
        { source: 'Paul’s Online Math Notes', item: 'Algebra → "Graphing and Functions" chapter: "The Definition of a Function", "Combining Functions", "Inverse Functions" and "Transformations"', why: 'Clear notes with practice problems and solutions.' },
        { source: 'OpenStax Precalculus (also on LibreTexts)', item: 'Chapter 1 "Functions": sections 1.4 Composition of Functions, 1.5 Transformation of Functions, 1.7 Inverse Functions', why: 'Graded exercises with answers.' },
        { source: 'Khan Academy', item: 'Algebra 2 → "Transformations of functions"; Precalculus → "Composite and inverse functions"', why: 'Interactive practice with instant feedback.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: what makes something a function, when does it have an inverse, and why does f(x − 2) move the graph to the right? Use the words "domain", "one-to-one" and "input".',
      quiz: [
        { id: 'qz-inv', prompt: R`If {{f(x)=2x+1|f of x equals 2 x plus 1}}, what is {{f^{-1}(7)|f inverse of 7}}?`, answer: { kind: 'numeric', value: 3, absTol: 1e-9 }, explain: R`Solve {{2x+1=7|2 x plus 1 equals 7}}: {{x=3|x equals 3}}.` },
        { id: 'qz-order', prompt: R`For {{f(x)=x+1|f of x equals x plus 1}} and {{g(x)=2x|g of x equals 2 x}}, is {{f(g(x))=g(f(x))|f of g of x equal to g of f of x}}?`, answer: { kind: 'mc', options: ['Yes, always', 'No: one is 2x + 1, the other 2x + 2', 'Only for x = 0', 'Only for negative x'], correct: 1 }, explain: R`{{f(g(x))=2x+1|f of g of x is 2 x plus 1}} but {{g(f(x))=2x+2|g of f of x is 2 x plus 2}}. They are never equal.` },
        { id: 'qz-even', prompt: 'Which function is odd?', answer: { kind: 'mc', options: ['{{x^2|x squared}}', '{{\\cos x|cos x}}', '{{x^3|x cubed}}', '{{|x||absolute x}}'], correct: 2 }, explain: R`{{(-x)^3=-x^3|minus x cubed equals minus x cubed}}. The others are even.` },
      ],
    },
  ],
};

export default topic;
