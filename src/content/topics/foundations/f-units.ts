/**
 * Foundations 0.5 — Units, dimensions and estimation.
 */
import type { AnimationDef, SandboxDef, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, scene } from '../../lib';

const R = String.raw;

// ------------------------------------------------------------------ animations

function conversionAnim(): AnimationDef {
  const rows: [string, string, string][] = [
    ['90 km / h', 'Start with 90 kilometres per hour.', '90 km/h'],
    ['90 km/h × (1000 m / 1 km)', 'Multiply by 1000 metres over 1 kilometre. That fraction equals 1, so the speed is unchanged. Kilometres cancel.', '90 000 m/h'],
    ['… × (1 h / 3600 s)', 'Multiply by 1 hour over 3600 seconds, also equal to 1. Hours cancel.', '25 m/s'],
    ['= 25 m/s', 'What is left: 90 times 1000 over 3600, which is 25 metres per second.', '25 m/s'],
  ];
  return anim(
    'convert',
    'Converting units by multiplying by 1',
    rows.map(([line, cap, result], k) =>
      frame(
        scene([0, 10], [0, 4], [
          ...rows.slice(0, k + 1).map((r, i) => ({ kind: 'label' as const, at: [0.4, 3.4 - i * 0.8] as [number, number], text: r[0], role: (i === k ? 'active' : 'muted') as 'active' | 'muted', hand: true, size: 26 })),
          { kind: 'label', at: [9.6, 0.4], text: result, role: 'result', anchor: 'end', hand: true, size: 28 },
        ], `Unit conversion, step ${k + 1}: ${line}.`, { axes: false, grid: false, size: [640, 260] }),
        cap,
      ),
    ),
  );
}

function pendulumAnim(): AnimationDef {
  const steps: [string, string][] = [
    ['T = C · mᵃ · Lᵇ · gᶜ', 'Guess: the period T depends on mass m, length L and gravity g, as a product of powers with an unknown number C.'],
    ['[T] = Mᵃ · Lᵇ · (L T⁻²)ᶜ', 'Replace each quantity by its dimensions. g is an acceleration: length per time squared.'],
    ['M: a = 0 ;  L: b + c = 0 ;  T: −2c = 1', 'Both sides must have the same powers of mass, length and time. That gives three equations.'],
    ['a = 0, c = −½, b = ½', 'Solve them: the mass drops out, and the period goes like the square root of L over g.'],
    ['T = C · √(L / g)', 'Dimensional analysis can’t find C. A full calculation gives C equal to 2 pi.'],
  ];
  return anim(
    'pendulum-dims',
    'Dimensional analysis finds the pendulum law',
    steps.map(([t, cap], k) =>
      frame(
        scene([0, 10], [0, 4], [
          ...steps.slice(0, k + 1).map((s, i) => ({ kind: 'label' as const, at: [0.4, 3.5 - i * 0.7] as [number, number], text: s[0], role: (i === k ? 'active' : 'muted') as 'active' | 'muted', hand: true, size: 24 })),
        ], `Dimensional analysis, step ${k + 1}: ${t}`, { axes: false, grid: false, size: [640, 280] }),
        cap,
      ),
    ),
  );
}

function ladderAnim(): AnimationDef {
  const things: [number, string][] = [
    [-10, 'atom ~10⁻¹⁰ m'],
    [-6, 'bacterium ~10⁻⁶ m'],
    [0, 'person ~1 m'],
    [6.8, 'Earth radius ~6.4×10⁶ m'],
    [11.2, 'Earth–Sun ~1.5×10¹¹ m'],
    [21, 'Milky Way ~10²¹ m'],
  ];
  return anim(
    'ladder',
    'Orders of magnitude',
    things.map(([, label], k) =>
      frame(
        scene([-12, 24], [-1, 3], [
          { kind: 'segment', a: [-11, 0], b: [23, 0], role: 'ink', width: 2, arrow: true },
          ...[-10, -5, 0, 5, 10, 15, 20].map((v) => ({ kind: 'label' as const, at: [v, -0.6] as [number, number], text: `10${String(v).split('').map((ch) => ({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '5': '⁵' } as Record<string, string>)[ch] ?? ch).join('')}`, role: 'muted' as const, anchor: 'middle' as const, size: 13 })),
          ...things.slice(0, k + 1).map(([x, l], i) => ({ kind: 'point' as const, at: [x, 0] as [number, number], role: (i === k ? 'active' : 'q-x') as 'active' | 'q-x', r: 6, label: i === k ? l : undefined, labelDir: (x > 15 ? 'nw' : 'n') as 'nw' | 'n' })),
        ], `Logarithmic ruler of lengths in metres, showing ${label}.`, { axes: false, grid: false, size: [640, 220] }),
        k === 0 ? 'On a logarithmic ruler each step is a factor of ten. An atom is about 10 to the minus 10 metres.' : k === things.length - 1 ? 'Our galaxy is about 10 to the 21 metres across. Thirty-one orders of magnitude separate it from an atom; doubles can hold all of them.' : `${label.replace('~', 'about ')}.`,
      ),
    ),
  );
}

function periodReveal(): AnimationDef {
  const T1 = 2 * Math.PI * Math.sqrt(1 / 9.81);
  const T4 = 2 * Math.PI * Math.sqrt(4 / 9.81);
  const sc = (n: number) =>
    scene([0, 8.5], [-2.6, 2.6], [
      { kind: 'fn', f: (t) => 1 + Math.cos((2 * Math.PI * t) / T1), to: n, role: 'q-x', width: 3 },
      { kind: 'fn', f: (t) => -1 + Math.cos((2 * Math.PI * t) / T4), to: n, role: 'q-slope', width: 3 },
      { kind: 'label', at: [0.2, 2.3], text: 'L = 1 m', role: 'q-x', hand: true, size: 20 },
      { kind: 'label', at: [0.2, -2.35], text: 'L = 4 m', role: 'q-slope', hand: true, size: 20 },
    ], `Swing angle against time for two pendulums, drawn up to ${n} seconds.`, { xLabel: 't (s)' });
  return anim('period-reveal', 'Two pendulums, side by side', [
    frame(sc(2.1), `The 1-metre pendulum completes one swing in ${fmt(T1, 3)} seconds.`),
    frame(sc(4.1), `The 4-metre pendulum needs ${fmt(T4, 3)} seconds: exactly twice as long.`),
    frame(sc(8.5), 'Four times the length gives twice the period, because the period grows like the square root of the length.'),
  ]);
}

// ------------------------------------------------------------------ sandbox

const dimLab: SandboxDef = {
  id: 'dim-lab',
  title: 'Dimension detective',
  intro: R`Find the exponents in {{T=C\,m^{a}L^{b}g^{c}|T equals C m to the a, L to the b, g to the c}} that give a **time**. The bars show the powers of mass, length and time on the right-hand side; the goal is the dashed target: no mass, no length, time to the power 1.`,
  sliders: [
    { id: 'a', label: 'a (power of mass m)', min: -2, max: 2, step: 0.5, init: 1, role: 'q-f' },
    { id: 'b', label: 'b (power of length L)', min: -2, max: 2, step: 0.5, init: 1, role: 'q-x' },
    { id: 'c', label: 'c (power of g)', min: -2, max: 2, step: 0.5, init: 0, role: 'q-slope' },
  ],
  render: (s) => {
    const { a, b, c } = s.values;
    const dims = { M: a, L: b + c, T: -2 * c };
    const target = { M: 0, L: 0, T: 1 };
    const ok = dims.M === 0 && dims.L === 0 && dims.T === 1;
    const items: SceneItem[] = (['M', 'L', 'T'] as const).flatMap((k, i) => [
      { kind: 'rect' as const, x: i * 2 + 0.6, y: 0, w: 0.8, h: dims[k], role: (dims[k] === target[k] ? 'done' : 'error') as 'done' | 'error', opacity: 0.6 },
      { kind: 'segment' as const, a: [i * 2 + 0.4, target[k]] as [number, number], b: [i * 2 + 1.6, target[k]] as [number, number], role: 'active' as const, dash: true, width: 3 },
      { kind: 'label' as const, at: [i * 2 + 1, -2.6] as [number, number], text: k === 'M' ? 'mass' : k === 'L' ? 'length' : 'time', role: 'ink' as const, anchor: 'middle' as const, size: 15 },
    ]);
    return {
      scene: scene([0, 6], [-3, 4], items, `Bars for the powers of mass ${dims.M}, length ${dims.L} and time ${dims.T}; targets 0, 0 and 1.`, { grid: false }),
      eq: { tex: R`[m^{${a}}L^{${b}}g^{${c}}]=\text{M}^{${dims.M}}\,\text{L}^{${dims.L}}\,\text{T}^{${dims.T}}`, say: `the dimensions are mass to the ${dims.M}, length to the ${dims.L}, time to the ${dims.T}` },
      note: ok ? 'Found it: T = C·√(L/g). The mass doesn’t matter.' : 'Not a time yet. Which bar is wrong, and which exponent controls it?',
    };
  },
  tryThis: ['Only g contains time. Which value of c makes the time bar equal 1?', 'Now fix the length bar with b. Finally, does mass belong in the formula at all?', R`Try to make a **speed** instead (length 1, time −1). You get {{\sqrt{gL}|root of g L}}: the speed of shallow-water waves has this form.`],
};

// ------------------------------------------------------------------ topic

const topic: Topic = {
  id: 'f-units',
  course: 'foundations',
  number: '0.5',
  title: 'Units, dimensions and estimation',
  blurb: 'SI, dimensional analysis, Fermi estimates.',
  icon: '㎧',
  prereqs: ['f-algebra'],
  glossary: [
    { id: 'si', term: 'SI units', def: 'The international system: metre, kilogram, second, ampere, kelvin, mole and candela, plus derived units such as the newton {{(\\text{kg m s}^{-2})|kilogram metre per second squared}}.' },
    { id: 'dimension', term: 'Dimension', def: 'The kind of quantity, independent of the unit: length [L], mass [M], time [T], and so on. A speed has dimension {{\\text{L T}^{-1}|length per time}} whether measured in m/s or km/h.' },
    { id: 'dim-analysis', term: 'Dimensional analysis', def: 'Using the rule that every term of a valid equation has the same dimensions, to check formulas or to find how a quantity must depend on others.' },
    { id: 'sig-figs', term: 'Significant figures', def: 'The digits of a number that carry real information. 0.00450 has three: 4, 5 and the final 0.' },
    { id: 'fermi', term: 'Fermi estimate', def: 'A quick order-of-magnitude estimate made by breaking a question into factors you can guess roughly and multiplying them.' },
    { id: 'order-of-magnitude', term: 'Order of magnitude', def: 'The power of ten nearest a number: 3000 and 5000 are both of order {{10^{3}|ten cubed}} to {{10^{4}|ten to the four}}. Two quantities "differ by an order of magnitude" if one is about ten times the other.' },
    { id: 'dimensionless', term: 'Dimensionless number', def: 'A ratio in which all units cancel, such as an angle in radians or the Reynolds number. Its value is the same in every unit system.' },
  ],
  formulas: [
    { name: 'Newton in base units', tex: R`1\ \text{N}=1\ \text{kg}\,\text{m}\,\text{s}^{-2}`, say: 'one newton equals one kilogram metre per second squared' },
    { name: 'Conversion factor', tex: R`90\ \tfrac{\text{km}}{\text{h}}\cdot\tfrac{1000\ \text{m}}{1\ \text{km}}\cdot\tfrac{1\ \text{h}}{3600\ \text{s}}=25\ \tfrac{\text{m}}{\text{s}}`, say: '90 kilometres per hour times 1000 metres per kilometre times 1 hour per 3600 seconds equals 25 metres per second' },
    { name: 'Rule of dimensions', tex: R`[A+B]\ \text{requires}\ [A]=[B];\quad [AB]=[A][B];\quad [e^{x}],[\sin x]\ \text{need}\ [x]=1`, say: 'you may only add quantities with the same dimensions; dimensions of a product multiply; arguments of exponentials and sines must be dimensionless' },
    { name: 'Pendulum (from dimensions)', tex: R`T=C\sqrt{L/g},\quad C=2\pi`, say: 'T equals C times the root of L over g, with C equal to 2 pi' },
    { name: 'Relative error', tex: R`\varepsilon_{\text{rel}}=\frac{|x_{\text{approx}}-x_{\text{true}}|}{|x_{\text{true}}|}`, say: 'relative error equals the absolute difference between approximate and true values, divided by the absolute true value' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'In 1999 NASA lost the Mars Climate Orbiter. The physics and the formulas were right. What went wrong?',
      scene: scene([0, 6], [0, 3], [
        { kind: 'rect', x: 0.3, y: 1.7, w: 4.45, h: 0.6, role: 'result', opacity: 0.6 },
        { kind: 'label', at: [0.3, 2.55], text: 'impulse sent: 1 lbf·s = 4.45 N·s', role: 'result', hand: true, size: 20 },
        { kind: 'rect', x: 0.3, y: 0.5, w: 1, h: 0.6, role: 'error', opacity: 0.6 },
        { kind: 'label', at: [0.3, 1.35], text: 'impulse assumed: "1" read as 1 N·s', role: 'error', hand: true, size: 20 },
      ], 'Two bars: the impulse actually produced, 4.45 newton seconds, and the impulse the software assumed, 1 newton second.', { axes: false, grid: false, size: [640, 260] }),
      teaser: 'Units. Ground software produced thruster impulse in pound-force seconds; the navigation software assumed newton seconds. One pound-force is about 4.45 newtons, so every correction was off by that factor, the orbit came in far too low, and the spacecraft was lost. Units are not decoration: they are part of every number.',
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
            { type: 'p', text: 'Every physical number is a value times a unit: 9.81 m/s², not 9.81. Keeping track of units catches most mistakes in physics and in simulation codes before they cost anything.' },
            { type: 'p', text: 'This topic builds on algebra (0.1). Dimensional analysis returns in physics (Course 7) and in nondimensionalisation and scaling (8.10), where it decides which parameters actually matter.' },
            { type: 'note', kind: 'compsci', text: 'Simulation codes almost never store units with numbers; a variable is just a float. The units live in your head and in comments, which is exactly why they go wrong. Checking dimensions is a cheap, powerful test.' },
          ],
        },
        {
          id: 'si',
          title: 'SI units and conversions',
          blocks: [
            { type: 'p', text: R`The [[si|SI system]] has seven base units. The ones you’ll use most are the metre (m), kilogram (kg), second (s), kelvin (K) and ampere (A). Everything else is built from them: a newton is {{\text{kg}\,\text{m}\,\text{s}^{-2}|kilogram metre per second squared}}, a joule is a newton metre.` },
            { type: 'p', text: R`Prefixes scale by powers of ten: kilo {{10^3|ten cubed}}, mega {{10^6|ten to the six}}, milli {{10^{-3}|ten to the minus three}}, micro {{10^{-6}|ten to the minus six}}, nano {{10^{-9}|ten to the minus nine}}.` },
            { type: 'p', text: R`To convert, multiply by a fraction equal to 1, such as {{\frac{1000\ \text{m}}{1\ \text{km}}|1000 metres per kilometre}}. Treat units like algebra symbols and cancel them. If the units come out right, the conversion is right.` },
            { type: 'note', kind: 'pitfall', text: R`Squared and cubed units convert with squared and cubed factors: {{1\ \text{m}^2=10^4\ \text{cm}^2|1 square metre is ten thousand square centimetres}}, not 100. A litre is {{10^{-3}\ \text{m}^3|ten to the minus three cubic metres}}.` },
          ],
        },
        {
          id: 'dimensions',
          title: 'Dimensions',
          blocks: [
            { type: 'p', text: R`A [[dimension]] is the kind of quantity, whatever the unit. Write length as L, mass M and time T. A speed has dimension {{\text{L}\,\text{T}^{-1}|length per time}}, a force {{\text{M}\,\text{L}\,\text{T}^{-2}|mass length per time squared}}.` },
            { type: 'p', text: 'Three rules hold in every valid equation. You can only add, subtract or compare quantities with the same dimensions. Multiplying quantities multiplies their dimensions. And the input of exp, log, sin or cos must be dimensionless.' },
            { type: 'eq', eq: { tex: R`[\Q{x}{x}]=\text{L},\quad [\Q{slope}{v}]=\text{L}\,\text{T}^{-1},\quad [\Q{a}{a}]=\text{L}\,\text{T}^{-2},\quad [F]=\text{M}\,\text{L}\,\text{T}^{-2}`, say: 'position has dimension length; velocity length per time; acceleration length per time squared; force mass length per time squared', label: 'common dimensions' } },
            { type: 'note', kind: 'remember', text: 'Dimension is the kind of quantity, unit is the measuring stick. Converting units never changes dimensions.' },
          ],
        },
        {
          id: 'check',
          title: 'Checking a formula',
          blocks: [
            { type: 'p', text: R`Is {{v=\sqrt{2gh}|v equals root of 2 g h}} plausible for the speed after falling a height {{h|h}}? Dimensions: {{\sqrt{\text{L}\,\text{T}^{-2}\cdot\text{L}}=\text{L}\,\text{T}^{-1}|root of length per time squared times length, which is length per time}}. A speed. ✓` },
            { type: 'p', text: R`Would {{v=2gh|v equals 2 g h}} work? That has dimension {{\text{L}^2\text{T}^{-2}|length squared per time squared}}: not a speed. ✗ This test needs no physics at all, and it catches a large share of algebra slips.` },
            { type: 'note', kind: 'why', text: 'Why does this work? Physical laws can’t depend on the human choice of metre or second. If a formula mixed dimensions, changing from metres to centimetres would change its truth.' },
          ],
        },
        {
          id: 'derive',
          title: 'Why it works: finding laws from dimensions',
          blocks: [
            { type: 'p', text: R`[[dim-analysis|Dimensional analysis]] can even find a law. The period {{T|T}} of a pendulum might depend on its mass {{m|m}}, length {{L|L}} and gravity {{g|g}}. Assume {{T=C\,m^aL^bg^c|T equals C m to the a L to the b g to the c}} with a pure number {{C|C}}.` },
            { type: 'p', text: R`Match powers of M, L and T on both sides: {{a=0|a equals 0}}, {{b+c=0|b plus c equals 0}}, {{-2c=1|minus 2 c equals 1}}. So {{T=C\sqrt{L/g}|T equals C root of L over g}}, and the mass doesn’t matter at all.` },
            { type: 'eq', eq: { tex: R`T=C\sqrt{\frac{L}{g}}`, say: 'T equals C times the root of L over g', label: 'from dimensions alone' } },
            { type: 'p', text: R`The limits: it can’t give the number {{C|C}} (the full theory gives {{2\pi|2 pi}} for small swings), and it fails if more quantities are involved than dimensions to match. Then you get dimensionless groups instead: the idea behind the Buckingham Pi theorem.` },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three animations: converting units by multiplying by one, deriving the pendulum law, and a ruler of orders of magnitude.', anims: [conversionAnim(), pendulumAnim(), ladderAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-newton', prompt: 'A newton in SI base units is…', answer: { kind: 'mc', options: ['kg·m/s', 'kg·m/s²', 'kg·m²/s²', 'kg/(m·s²)'], correct: 1 }, explain: R`Force = mass × acceleration: {{\text{kg}\cdot\text{m}\,\text{s}^{-2}|kilogram times metre per second squared}}.` },
        { id: 'rc-convert', prompt: 'Convert 36 km/h to metres per second.', answer: { kind: 'numeric', value: 10, relTol: 1e-6, unit: 'm/s' }, explain: R`{{36\cdot1000/3600=10|36 times 1000 over 3600 is 10}} m/s.` },
        { id: 'rc-dimless', prompt: R`In {{e^{-kt}|e to the minus k t}} with {{t|t}} in seconds, what must the units of {{k|k}} be?`, answer: { kind: 'mc', options: ['seconds', 'per second (1/s)', 'metres', 'no units, k is just a number'], correct: 1 }, explain: R`The exponent must be dimensionless, so {{k\,t|k t}} has no units: {{k|k}} is per second.` },
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
          id: 'sigfigs',
          title: 'Significant figures, precision and accuracy',
          blocks: [
            { type: 'p', text: R`[[sig-figs|Significant figures]] say how much of a number is real information. A ruler read as 12.3 cm claims three; reporting 12.3456 cm from it invents three more. Round results to match your least precise input.` },
            { type: 'p', text: 'Precision is how finely a value is stated or how reproducible it is. Accuracy is how close it is to the truth. A broken scale can be precise to 0.001 g and wrong by 5 g.' },
            { type: 'eq', eq: { tex: R`\varepsilon_{\text{rel}}=\frac{|x_{\text{approx}}-x_{\text{true}}|}{|x_{\text{true}}|}`, say: 'relative error equals the absolute difference between the approximate and true values, divided by the absolute true value', label: 'relative error' } },
            { type: 'note', kind: 'compsci', text: 'A double holds about 16 significant digits, but a simulation result is only as good as its inputs and its method. Printing 16 digits of a result accurate to 3 is false precision.' },
          ],
        },
        {
          id: 'fermi',
          title: 'Fermi estimates',
          blocks: [
            { type: 'p', text: R`A [[fermi|Fermi estimate]] answers "roughly how much?" by breaking a question into factors you can guess. Heartbeats in a lifetime: about 70 a minute, 60 minutes, 24 hours, 365 days, 80 years. That is {{\approx2.9\times10^{9}|about 2.9 billion}}.` },
            { type: 'p', text: 'Each factor may be off by a factor of two, but some guesses are high and some low, so errors partly cancel. The result usually lands within a factor of a few of the truth: the right order of magnitude.' },
            { type: 'note', kind: 'compsci', text: 'Before a long simulation, estimate the answer. If the code returns something ten thousand times bigger than your Fermi estimate, suspect the code before you suspect physics.' },
          ],
        },
        {
          id: 'magnitude',
          title: 'Scientific notation and orders of magnitude',
          blocks: [
            { type: 'p', text: R`Scientific notation writes {{a\times10^n|a times ten to the n}} with {{1\le a<10|a between 1 and 10}}. Multiplying adds exponents; dividing subtracts them: {{(3\times10^8)(2\times10^{-3})=6\times10^5|3 times ten to the 8 times 2 times ten to the minus 3 equals 6 times ten to the 5}}.` },
            { type: 'p', text: R`The [[order-of-magnitude|order of magnitude]] of {{x|x}} is roughly {{\log_{10}x|log base 10 of x}} rounded. It is the natural scale for comparing things that differ enormously, from atoms to galaxies.` },
            { type: 'note', kind: 'units', text: "Python writes {{3\\times10^8|3 times ten to the 8}} as `3e8`. The \"e\" means \"times ten to the\", not the number e.".replace(/\\`/g, '`') },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: dimLab },
    {
      id: 'predict',
      kind: 'predict',
      question: 'Pendulum A is 1 m long. Pendulum B is 4 m long. Both swing gently. How does B’s period compare with A’s?',
      answer: { kind: 'mc', options: ['The same', 'Twice as long', 'Four times as long', 'Sixteen times as long'], correct: 1 },
      reveal: periodReveal(),
      explain: R`{{T\propto\sqrt{L}|T is proportional to root L}}, so four times the length gives {{\sqrt4=2|root 4, which is 2}} times the period. You can predict this from dimensions alone, without solving any equation of motion.`,
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
            { type: 'p', text: R`Units decide the size of your numbers. In SI an atom’s mass is about {{10^{-26}|ten to the minus 26}} kg. Doubles can store that, but adding numbers of very different sizes loses the small one: {{1+10^{-20}|1 plus ten to the minus 20}} is exactly 1.` },
            { type: 'p', text: 'So serious codes choose units in which the important quantities are near 1: atomic units in quantum chemistry, astronomical units in orbit codes, or fully dimensionless variables. This is nondimensionalisation (topic 8.10).' },
            { type: 'p', text: 'Dimensionless numbers also tell you which physics matters. The Reynolds number, a ratio of inertial to viscous effects, decides whether a flow is smooth or turbulent, whatever units you used.' },
            { type: 'note', kind: 'compsci', text: 'Unit libraries (Python’s pint, for example) attach units to numbers and raise an error when you add metres to seconds. They cost speed, so they are used for inputs and outputs, not inside the hot loops of a solver.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'code', code: 'import scipy.constants as c\nprint(c.g)              # 9.80665 m/s^2 (standard gravity)\nprint(c.c)              # 299792458.0 m/s (speed of light)\nprint(c.pound * c.g)    # 4.4482216152605 N in one pound-force\n\nkmh = 90\nprint(kmh * 1000 / 3600)        # 25.0 m/s\nprint(f"{123456:.3g}")          # 1.23e+05: three significant figures', say: 'scipy dot constants has physical constants: standard gravity, the speed of light, and the pound. One pound-force is about 4.448 newtons. Convert 90 kilometres per hour to 25 metres per second. Format with three significant figures using colon point 3 g.' },
            { type: 'note', kind: 'python', text: 'Put the unit in the variable name when it isn’t SI: `speed_kmh`, `t_hours`. It costs nothing and prevents the Mars Climate Orbiter bug.' },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                'Mixing unit systems in one calculation (pounds and newtons, km and m).',
                R`Converting areas or volumes with the linear factor: {{1\ \text{m}^2\neq100\ \text{cm}^2|one square metre is not 100 square centimetres}}.`,
                'Adding or comparing quantities with different dimensions.',
                'Quoting more significant figures than the inputs support.',
                'Using grams where a formula expects kilograms (SI uses kg).',
                'Putting a quantity with units inside exp, log or sin.',
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: 'Fluid-dynamics codes are often written in dimensionless form, so one run covers every flow with the same Reynolds number, whether it is air over a wing or water in a pipe.' },
            { type: 'p', text: 'Dimensional analysis is a free test for code: if a computed energy changes when you switch from metres to centimetres (and convert all inputs), a formula in the code is dimensionally wrong.' },
            { type: 'p', text: 'Fermi estimates plan the computation itself: how many grid cells, how many time steps, how much memory, how many hours on a cluster.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                'Every physical number has a unit; convert by multiplying by fractions equal to 1.',
                'Dimensions (L, M, T, …) must match across every + and =; inputs of exp, log and sin must be dimensionless.',
                R`Dimensional analysis checks formulas and can find laws up to a constant: {{T=C\sqrt{L/g}|T equals C root of L over g}}.`,
                'Quote only significant figures you can justify; distinguish precision from accuracy.',
                'Fermi estimates give orders of magnitude; choose units that keep numbers near 1 in code.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: R`Air drag on a moving object depends on the air density {{\rho|rho}}, the speed {{v|v}} and the frontal area {{A|A}}. Use dimensions to find the form of the drag force {{F|F}}.`,
      lines: [
        { tex: R`F=C\,\rho^{a}v^{b}A^{c}`, say: 'F equals C rho to the a, v to the b, A to the c', why: 'Assumed a product of powers with a dimensionless constant C.' },
        { tex: R`\text{M}\,\text{L}\,\text{T}^{-2}=(\text{M}\,\text{L}^{-3})^{a}(\text{L}\,\text{T}^{-1})^{b}(\text{L}^{2})^{c}`, say: 'mass length per time squared equals mass per length cubed to the a, times length per time to the b, times length squared to the c', why: 'Wrote the dimensions of each quantity.' },
        { tex: R`\text{M}:\ a=1\qquad \text{T}:\ -b=-2`, say: 'mass: a equals 1; time: minus b equals minus 2', why: 'Matched the powers of M and T.' },
        { tex: R`\text{L}:\ -3a+b+2c=1\ \Rightarrow\ -3+2+2c=1`, say: 'length: minus 3 a plus b plus 2 c equals 1, so minus 3 plus 2 plus 2 c equals 1', why: 'Matched the powers of L and substituted a = 1, b = 2.' },
        { tex: R`c=1`, say: 'c equals 1', why: 'Solved.' },
        { tex: R`F=C\,\rho\,v^{2}A`, say: 'F equals C rho v squared A', why: 'The familiar drag law; experiment gives C ≈ ½ × the drag coefficient.' },
      ],
      takeaway: 'Dimensional analysis turned a physics question into three linear equations. It predicts that doubling the speed quadruples the drag, which is why fuel use rises steeply with speed.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-kmh',
          prompt: 'Convert 90 km/h to metres per second. Include units.',
          answer: { kind: 'numeric', value: 25, relTol: 1e-6, unit: 'm/s' },
          hints: ['Convert kilometres to metres and hours to seconds.', '1 km = 1000 m and 1 h = 3600 s.', R`{{90\cdot1000/3600|90 times 1000 over 3600}}.`],
          solution: [
            { tex: R`90\ \tfrac{\text{km}}{\text{h}}\cdot\tfrac{1000\ \text{m}}{1\ \text{km}}\cdot\tfrac{1\ \text{h}}{3600\ \text{s}}`, say: '90 kilometres per hour times 1000 metres per kilometre times 1 hour per 3600 seconds', why: 'Multiplied by two fractions equal to 1; km and h cancel.' },
            { tex: R`=25\ \text{m/s}`, say: 'equals 25 metres per second', why: '90 000 / 3600 = 25.' },
          ],
          solutionFinal: '25',
          truth: '90*1000/3600',
        },
        {
          id: 'yt-area',
          prompt: 'A solar panel has an area of 3.5 m². How many square centimetres is that?',
          answer: { kind: 'numeric', value: 35000, relTol: 1e-9 },
          hints: ['1 m = 100 cm.', 'For an area the factor is squared.', R`{{1\ \text{m}^2=100^2\ \text{cm}^2=10^4\ \text{cm}^2|one square metre is ten thousand square centimetres}}.`],
          solution: [
            { tex: R`1\ \text{m}^2=(100\ \text{cm})^2=10^4\ \text{cm}^2`, say: 'one square metre equals 100 centimetres squared, ten to the four square centimetres', why: 'Squared the length factor.' },
            { tex: R`3.5\cdot10^4=35\,000\ \text{cm}^2`, say: '3.5 times ten to the four is 35 000 square centimetres', why: 'Multiplied.' },
          ],
          solutionFinal: '35000',
          truth: '3.5*100**2',
        },
        {
          id: 'yt-consistent',
          prompt: R`Which formula for a distance {{s|s}} is dimensionally consistent? ({{u|u}} is a speed, {{a|a}} an acceleration, {{t|t}} a time.)`,
          answer: { kind: 'mc', options: ['{{s=ut^2+at|s equals u t squared plus a t}}', '{{s=ut+\\tfrac12at^2|s equals u t plus one half a t squared}}', '{{s=u/t+at|s equals u over t plus a t}}', '{{s=\\tfrac12at|s equals one half a t}}'], correct: 1 },
          hints: ['Work out the dimension of every term.', R`{{[ut]=\text{L}\,\text{T}^{-1}\cdot\text{T}=\text{L}|u t has dimension length}}.`, R`{{[at^2]=\text{L}\,\text{T}^{-2}\cdot\text{T}^2=\text{L}|a t squared has dimension length}}.`],
          solution: [
            { tex: R`[ut]=\text{L},\quad[at^2]=\text{L}`, say: 'u t has dimension length, a t squared has dimension length', why: 'Every term is a length, so the sum can be a distance.' },
            { tex: R`[ut^2]=\text{L}\,\text{T}\ \text{(not a length)}`, say: 'u t squared has dimension length times time, not a length', why: 'The other options each contain a term like this.' },
          ],
          solutionFinal: '0',
        },
        {
          id: 'yt-fermi',
          prompt: 'Estimate the number of heartbeats in an 80-year life, using 70 beats per minute and 365-day years. Two significant figures are enough.',
          answer: { kind: 'numeric', value: 2.9e9, relTol: 0.02 },
          hints: ['Count minutes in 80 years first.', R`Minutes: {{60\cdot24\cdot365\cdot80|60 times 24 times 365 times 80}}.`, 'That is about 4.2 × 10⁷ minutes. Multiply by 70.'],
          solution: [
            { tex: R`60\cdot24\cdot365\cdot80\approx4.2\times10^{7}\ \text{min}`, say: 'minutes in 80 years: about 4.2 times ten to the 7', why: 'Minutes per hour × hours per day × days per year × years.' },
            { tex: R`70\cdot4.2\times10^{7}\approx2.9\times10^{9}`, say: '70 times 4.2 times ten to the 7 is about 2.9 times ten to the 9', why: 'Beats per minute × minutes. (Exactly 2 943 360 000.)' },
          ],
          solutionFinal: '2943360000',
          truth: '70*60*24*365*80',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-dims',
        title: 'Dimensional analysis as a linear system',
        prompt: 'Matching powers of M, L and T is a linear system. Write `exponents(quantities, target)`: `quantities` is a list of dimension vectors `(M, L, T)` (one per physical quantity) and `target` is the dimension vector you want. Return the exponents as a NumPy array, by solving `A x = target` where the **columns** of `A` are the quantities. The tests use the pendulum and the drag force.',
        starter: 'import numpy as np\n\ndef exponents(quantities, target):\n    A = np.array(quantities, dtype=float)   # careful: rows or columns?\n    return np.linalg.solve(A, np.array(target, dtype=float))\n',
        solution: 'import numpy as np\n\ndef exponents(quantities, target):\n    A = np.array(quantities, dtype=float).T   # one column per quantity\n    return np.linalg.solve(A, np.array(target, dtype=float))\n',
        tests: [
          'import numpy as np',
          'm, L, g = (1, 0, 0), (0, 1, 0), (0, 1, -2)',
          'def test_pendulum():',
          '    assert np.allclose(exponents([m, L, g], (0, 0, 1)), [0, 0.5, -0.5])',
          'rho, v, A = (1, -3, 0), (0, 1, -1), (0, 2, 0)',
          'def test_drag_force():',
          '    assert np.allclose(exponents([rho, v, A], (1, 1, -2)), [1, 2, 1])',
          'def test_speed_from_g_and_L():',
          '    # sqrt(g L): with mass included as a third quantity its exponent must be 0',
          '    assert np.allclose(exponents([g, L, m], (0, 1, -1)), [0.5, 0.5, 0])',
        ].join('\n'),
        hints: ['Each quantity’s dimension vector must be a column of A, because its exponent multiplies the whole vector.', 'np.array(quantities) puts each quantity in a row. Transpose it with .T.', 'Then np.linalg.solve(A, target) gives the exponents.'],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: 'Fill the gaps to convert a speed from km/h to m/s by multiplying by 1 twice.',
      template: 'speed_kmh = 90\n# (1000 m / 1 km) and (1 h / 3600 s) both equal 1\nspeed_ms = speed_kmh * ⟦a⟧ / (⟦b⟧)\nprint(speed_ms)\n',
      blanks: [
        { id: 'a', answers: ['1000', '1e3', '1000.0'], check: 'exact', hint: 'Metres in a kilometre.' },
        { id: 'b', answers: ['3600', '60*60', '60 * 60', '3600.0'], check: 'exact', hint: 'Seconds in an hour.' },
      ],
      tests: ['def test_value():', '    assert abs(speed_ms - 25) < 1e-12'].join('\n'),
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Space engineering', title: 'The Mars Climate Orbiter', text: 'Lost in 1999 because one program produced pound-force seconds and another read them as newton seconds. NASA’s investigation led to stricter interface checks between teams.' },
        { field: 'Fluid dynamics', title: 'The Reynolds number', text: 'A single dimensionless number, Re = ρvL/μ, decides whether a flow is smooth or turbulent. Wind tunnels test scale models at the same Re as the real aircraft.' },
        { field: 'Scientific software', title: 'Natural units', text: 'Quantum chemistry codes work in atomic units and astronomy codes in astronomical units and years, so the numbers stay near 1 and rounding errors stay small.' },
        { field: 'High-performance computing', title: 'Planning a run', text: 'A Fermi estimate of grid cells × time steps × operations per cell predicts run time and memory before a job is submitted to a cluster.' },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-kmh',
          title: 'km/h to m/s',
          difficulty: 'easy',
          prompt: 'Write `kmh_to_ms(v)`.',
          starter: 'def kmh_to_ms(v):\n    pass\n',
          solution: 'def kmh_to_ms(v):\n    return v * 1000 / 3600\n',
          tests: ['def test_values():', '    assert kmh_to_ms(90) == 25', '    assert abs(kmh_to_ms(3.6) - 1) < 1e-15'].join('\n'),
          hints: ['Multiply by 1000 (m per km).', 'Divide by 3600 (s per h).', 'return v * 1000 / 3600'],
        },
        {
          id: 'pb-sigfig',
          title: 'Round to significant figures',
          difficulty: 'easy',
          prompt: 'Write `round_sig(x, n)` that rounds `x` to `n` significant figures and returns a float, e.g. `round_sig(123456, 3) == 123000`. Return 0.0 for 0.',
          starter: 'def round_sig(x, n):\n    return round(x, n)\n',
          solution: 'import math\n\ndef round_sig(x, n):\n    if x == 0:\n        return 0.0\n    digits = n - 1 - math.floor(math.log10(abs(x)))\n    return float(round(x, digits))\n',
          tests: [
            'def test_big():',
            '    assert round_sig(123456, 3) == 123000',
            'def test_small():',
            '    assert abs(round_sig(0.0012345, 2) - 0.0012) < 1e-15',
            'def test_negative_and_zero():',
            '    assert round_sig(-98765, 1) == -100000 and round_sig(0, 3) == 0',
          ].join('\n'),
          hints: ['round(x, d) keeps d digits after the decimal point; d may be negative.', 'The position of the first significant digit is floor(log10(|x|)).', 'd = n − 1 − floor(log10(|x|)).'],
        },
        {
          id: 'pb-consistent',
          title: 'Is this sum dimensionally consistent?',
          difficulty: 'medium',
          prompt: 'Variables have dimension vectors `(M, L, T)` in a dict, e.g. `{"u": (0, 1, -1), "t": (0, 0, 1)}`. A term is a dict of exponents, e.g. `{"u": 1, "t": 1}` for u·t. Write `term_dims(term, dims)` returning the term’s dimension vector as a tuple, and `consistent(terms, dims)` returning `True` if all terms have the same dimensions.',
          starter: 'def term_dims(term, dims):\n    pass\n\ndef consistent(terms, dims):\n    pass\n',
          solution: 'def term_dims(term, dims):\n    total = [0, 0, 0]\n    for name, power in term.items():\n        for k in range(3):\n            total[k] += dims[name][k] * power\n    return tuple(total)\n\ndef consistent(terms, dims):\n    first = term_dims(terms[0], dims)\n    return all(term_dims(t, dims) == first for t in terms)\n',
          tests: [
            'D = {"s": (0, 1, 0), "u": (0, 1, -1), "a": (0, 1, -2), "t": (0, 0, 1)}',
            'def test_term():',
            '    assert term_dims({"a": 1, "t": 2}, D) == (0, 1, 0)',
            'def test_suvat_ok():',
            '    assert consistent([{"s": 1}, {"u": 1, "t": 1}, {"a": 1, "t": 2}], D)',
            'def test_wrong_formula():',
            '    assert not consistent([{"s": 1}, {"u": 1, "t": 2}], D)',
          ].join('\n'),
          hints: ['Multiplying quantities adds their dimension vectors; a power multiplies the vector.', 'For each variable in the term, add power × its dimension vector.', 'consistent: compare every term’s vector with the first one.'],
        },
      ],
      outside: [
        { source: 'OpenStax University Physics Volume 1 (also on LibreTexts)', item: 'Chapter 1 "Units and Measurement": sections on unit conversion, dimensional analysis, estimates and Fermi calculations, and significant figures', why: 'Exercises closely matching this topic.' },
        { source: 'Khan Academy', item: 'Algebra 1 → "Working with units"', why: 'Short drills on unit conversion and rates.' },
        { source: 'LibreTexts Physics', item: 'Search "Dimensional Analysis" in the introductory physics books', why: 'More worked examples of deriving laws from dimensions.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: why do units matter in computation, what does dimensional analysis let you check or find, and what is a Fermi estimate for? Use the words "dimension", "convert" and "order of magnitude".',
      quiz: [
        { id: 'qz-cm3', prompt: 'How many cubic centimetres are in one litre?', answer: { kind: 'numeric', value: 1000, relTol: 1e-9 }, explain: R`A litre is {{10\ \text{cm}\times10\ \text{cm}\times10\ \text{cm}|10 by 10 by 10 centimetres}}, 1000 cm³.` },
        { id: 'qz-dims', prompt: 'What are the dimensions of energy (work = force × distance)?', answer: { kind: 'mc', options: ['M L T⁻²', 'M L² T⁻²', 'M L² T⁻¹', 'M L⁻¹ T⁻²'], correct: 1 }, explain: R`{{\text{M}\,\text{L}\,\text{T}^{-2}\cdot\text{L}=\text{M}\,\text{L}^2\text{T}^{-2}|force times length}}.` },
        { id: 'qz-sig', prompt: 'How many significant figures does 0.00450 have?', answer: { kind: 'numeric', value: 3, absTol: 1e-9 }, explain: 'Leading zeros only place the decimal point. The 4, the 5 and the trailing 0 are significant.' },
      ],
    },
  ],
};

export default topic;
