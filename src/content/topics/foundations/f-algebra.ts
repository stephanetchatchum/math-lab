/**
 * Foundations 0.1 — Numbers, algebra and equations.
 * Numbers quoted in the text were checked in Python (npm run verify runs the code blocks).
 */
import type { AnimationDef, Frame, SandboxDef, Scene, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, scene } from '../../lib';

const R = String.raw;

// ------------------------------------------------------------------ pictures

/** A balance: left and right pans with labels. */
function balance(left: string, right: string, note: string): Scene {
  const beam = 2.6;
  const items: SceneItem[] = [
    { kind: 'polyline', points: [[4.4, 0], [5.6, 0], [5, 0.5]], role: 'muted', closed: true, fill: true },
    { kind: 'segment', a: [5, 0.5], b: [5, beam], role: 'muted', width: 5 },
    { kind: 'polyline', points: [[4.75, beam + 0.05], [5.25, beam + 0.05], [5, beam - 0.35]], role: 'active', closed: true, fill: true },
    { kind: 'segment', a: [1.5, beam], b: [8.5, beam], role: 'ink', width: 5 },
    { kind: 'segment', a: [1.5, beam], b: [0.6, 1.1], role: 'muted', width: 1.5 },
    { kind: 'segment', a: [1.5, beam], b: [2.4, 1.1], role: 'muted', width: 1.5 },
    { kind: 'segment', a: [8.5, beam], b: [7.6, 1.1], role: 'muted', width: 1.5 },
    { kind: 'segment', a: [8.5, beam], b: [9.4, 1.1], role: 'muted', width: 1.5 },
    { kind: 'polyline', points: [[0.4, 1.1], [2.6, 1.1], [2.2, 0.7], [0.8, 0.7]], role: 'given', closed: true, fill: true },
    { kind: 'polyline', points: [[7.4, 1.1], [9.6, 1.1], [9.2, 0.7], [7.8, 0.7]], role: 'result', closed: true, fill: true },
    { kind: 'label', at: [1.5, 1.3], text: left, role: 'given', anchor: 'middle', hand: true, size: 30 },
    { kind: 'label', at: [8.5, 1.3], text: right, role: 'result', anchor: 'middle', hand: true, size: 30 },
    { kind: 'label', at: [5, 3.4], text: note, role: 'active', anchor: 'middle', hand: true, size: 24 },
  ];
  return scene([0, 10], [-0.2, 3.8], items, `A balance. Left pan: ${left}. Right pan: ${right}. ${note}`, { axes: false, grid: false, size: [640, 300] });
}

function balanceAnim(): AnimationDef {
  const steps: [string, string, string, string][] = [
    ['3x + 5', '20', 'Both pans weigh the same.', 'The equation 3x plus 5 equals 20 is a balance: both sides are equal.'],
    ['3x + 5 − 5', '20 − 5', 'Take 5 from BOTH pans.', 'Subtract 5 from both sides. The balance stays level.'],
    ['3x', '15', 'Still balanced.', 'Now 3x equals 15.'],
    ['3x ÷ 3', '15 ÷ 3', 'Divide BOTH pans by 3.', 'Divide both sides by 3. Still level, because 3 is not zero.'],
    ['x', '5', 'Solved: x = 5', 'x equals 5. Check: 3 times 5 plus 5 is 20.'],
  ];
  return anim('balance', 'Solving an equation is keeping a balance level', steps.map(([l, r, n, c]) => frame(balance(l, r, n), c)));
}

/** Multiplying an inequality by −1 reflects the number line and flips the order. */
function flipAnim(): AnimationDef {
  const a = 1, b = 3;
  const line = (pts: { x: number; label: string; role: 'given' | 'result' }[], note: string, extra: SceneItem[] = []): Scene =>
    scene(
      [-4.5, 4.5],
      [-1, 1.6],
      [
        { kind: 'segment', a: [-4.3, 0], b: [4.3, 0], role: 'ink', width: 2.5, arrow: true },
        ...[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((v) => ({ kind: 'label' as const, at: [v, -0.55] as [number, number], text: String(v), role: 'muted' as const, anchor: 'middle' as const, size: 14 })),
        ...pts.map((p) => ({ kind: 'point' as const, at: [p.x, 0] as [number, number], role: p.role, label: p.label, labelDir: 'n' as const, r: 7 })),
        { kind: 'label', at: [0, 1.3], text: note, role: 'active', anchor: 'middle', hand: true, size: 22 },
        ...extra,
      ],
      `Number line with points. ${note}`,
      { axes: false, grid: false, size: [640, 240] },
    );
  const frames: Frame[] = [
    frame(line([{ x: a, label: 'a = 1', role: 'given' }, { x: b, label: 'b = 3', role: 'result' }], '1 < 3'), 'Start with two numbers: 1 is less than 3, so 1 sits to the left of 3.'),
    frame(line([{ x: a, label: 'a', role: 'given' }, { x: b, label: 'b', role: 'result' }], 'multiply by −1 …', [{ kind: 'segment', a: [a, 0.35], b: [-a, 0.35], role: 'given', arrow: true }, { kind: 'segment', a: [b, 0.6], b: [-b, 0.6], role: 'result', arrow: true }]), 'Multiplying by minus 1 reflects every number through 0.'),
    frame(line([{ x: -a, label: '−1', role: 'given' }, { x: -b, label: '−3', role: 'result' }], '−1 > −3'), 'Now minus 3 is to the left of minus 1. The order has flipped: minus 1 is greater than minus 3.'),
  ];
  return anim('flip', 'Why multiplying by a negative flips an inequality', frames);
}

/** Completing the square as an area picture: x² + 6x is a square with a missing corner. */
function squareAnim(): AnimationDef {
  const x = 4;
  const sq = (extra: SceneItem[], note: string, alt: string): Scene =>
    scene([-0.5, 10.5], [-0.5, 10.5], [{ kind: 'rect', x: 0, y: 0, w: x, h: x, role: 'q-x', opacity: 0.35 }, { kind: 'label', at: [x / 2, x / 2], text: 'x²', role: 'q-x', anchor: 'middle', hand: true, size: 30 }, ...extra, { kind: 'label', at: [5, 9.6], text: note, role: 'active', anchor: 'middle', hand: true, size: 22 }], alt, { axes: false, grid: false, size: [480, 480] });
  const strip6: SceneItem[] = [{ kind: 'rect', x, y: 0, w: 6, h: x, role: 'q-f', opacity: 0.35 }, { kind: 'label', at: [x + 3, x / 2], text: '6x', role: 'q-f', anchor: 'middle', hand: true, size: 26 }];
  const split: SceneItem[] = [
    { kind: 'rect', x, y: 0, w: 3, h: x, role: 'q-f', opacity: 0.35 },
    { kind: 'rect', x: 0, y: x, w: x, h: 3, role: 'q-f', opacity: 0.35 },
    { kind: 'label', at: [x + 1.5, x / 2], text: '3x', role: 'q-f', anchor: 'middle', hand: true, size: 24 },
    { kind: 'label', at: [x / 2, x + 1.5], text: '3x', role: 'q-f', anchor: 'middle', hand: true, size: 24 },
  ];
  const corner: SceneItem[] = [{ kind: 'rect', x, y: x, w: 3, h: 3, role: 'q-slope', opacity: 0.45 }, { kind: 'label', at: [x + 1.5, x + 1.5], text: '9', role: 'q-slope', anchor: 'middle', hand: true, size: 30 }];
  return anim('complete-square', 'Completing the square, as a picture', [
    frame(sq(strip6, 'x² + 6x', 'A square of side x next to a 6 by x strip.'), 'Start with x squared plus 6 x: a square of side x and a strip of area 6 x.'),
    frame(sq(split, 'split the strip in half', 'The strip cut into two 3 by x pieces on two sides of the square.'), 'Cut the strip into two halves, 3 x each, and put one on each side of the square.'),
    frame(sq([...split, ...corner], '(x + 3)² = x² + 6x + 9', 'Two strips and the square leave a 3 by 3 corner, filled in.'), 'One corner is missing: a 3 by 3 square of area 9. Add it and you have a full square of side x plus 3.'),
    frame(sq([...split, ...corner], 'x² + 6x = (x + 3)² − 9', 'The completed square minus the added corner.'), 'So x squared plus 6 x equals x plus 3, squared, minus 9. That is completing the square.'),
  ]);
}

/** Squaring both sides creates an extra solution. */
function extraneousAnim(): AnimationDef {
  const items0: SceneItem[] = [
    { kind: 'fn', f: (x) => (x >= -2 ? Math.sqrt(x + 2) : NaN), from: -2, to: 4, role: 'q-f', width: 3.5 },
    { kind: 'fn', f: (x) => x, role: 'given', width: 3 },
    { kind: 'label', at: [3.2, 2.9], text: 'y = x', role: 'given', hand: true, size: 20 },
    { kind: 'label', at: [-1.9, 1.7], text: 'y = √(x+2)', role: 'q-f', hand: true, size: 20 },
  ];
  const sc = (items: SceneItem[], alt: string) => scene([-3, 4], [-3, 4], items, alt);
  return anim('extraneous', 'Squaring can create a fake solution', [
    frame(sc(items0, 'Graphs of square root of x plus 2 and of x.'), 'The left side, root of x plus 2, is never negative. The right side is the line y equals x.'),
    frame(sc([...items0, { kind: 'point', at: [2, 2], role: 'done', label: 'x = 2 ✓', labelDir: 'se' }], 'The two graphs meet once, at x equals 2.'), 'They cross exactly once, at x equals 2. That is the only solution.'),
    frame(
      sc(
        [
          { kind: 'fn', f: (x) => x + 2, role: 'q-f', width: 3.5 },
          { kind: 'fn', f: (x) => x * x, role: 'given', width: 3 },
          { kind: 'point', at: [2, 4], role: 'done', label: 'x = 2', labelDir: 'nw' },
          { kind: 'point', at: [-1, 1], role: 'error', label: 'x = −1 ✗', labelDir: 'nw' },
        ],
        'Graphs of x plus 2 and x squared, which meet at x equals minus 1 and x equals 2.',
      ),
      'After squaring we solve x plus 2 equals x squared. Those graphs cross twice: at 2, and at minus 1.',
    ),
    frame(sc([...items0, { kind: 'point', at: [-1, 1], role: 'error', label: '√1 = 1 ≠ −1', labelDir: 'ne' }, { kind: 'point', at: [-1, -1], role: 'error' }], 'At x equals minus 1 the square root gives 1 but the line gives minus 1.'), 'Check minus 1 in the original: the root of 1 is 1, not minus 1. Squaring hid the sign, so minus 1 is a fake, an extraneous solution.'),
  ]);
}

// ------------------------------------------------------------------ sandbox

const quadLab: SandboxDef = {
  id: 'quadratic-lab',
  title: 'Quadratic lab',
  intro: R`Change {{a|a}}, {{b|b}} and {{c|c}} in {{y=ax^2+bx+c|y equals a x squared plus b x plus c}}. Watch the roots (where the curve meets the axis), the vertex and the discriminant {{b^2-4ac|b squared minus 4 a c}}.`,
  sliders: [
    { id: 'a', label: 'a', min: -3, max: 3, step: 0.1, init: 1, role: 'q-f' },
    { id: 'b', label: 'b', min: -6, max: 6, step: 0.1, init: -2, role: 'q-slope' },
    { id: 'c', label: 'c', min: -6, max: 6, step: 0.1, init: -3, role: 'q-x' },
  ],
  render: (s) => {
    const { a, b, c } = s.values;
    const f = (x: number) => a * x * x + b * x + c;
    const D = b * b - 4 * a * c;
    const items: SceneItem[] = [{ kind: 'fn', f, role: 'q-f', width: 3.5 }];
    const readouts = [{ label: 'discriminant b² − 4ac', value: fmt(D, 4), role: D < 0 ? ('error' as const) : ('result' as const) }];
    let note = '';
    if (Math.abs(a) < 1e-9) {
      note = 'With a = 0 this is a straight line, not a quadratic: one root (if b ≠ 0).';
      if (Math.abs(b) > 1e-9) items.push({ kind: 'point', at: [-c / b, 0], role: 'result', r: 7 });
    } else {
      const xv = -b / (2 * a);
      items.push({ kind: 'point', at: [xv, f(xv)], role: 'active', label: 'vertex', labelDir: a > 0 ? 's' : 'n' });
      readouts.push({ label: 'vertex x = −b/2a', value: fmt(xv, 4), role: 'result' });
      if (D > 1e-12) {
        const r = Math.sqrt(D);
        const x1 = (-b - r) / (2 * a), x2 = (-b + r) / (2 * a);
        items.push({ kind: 'point', at: [x1, 0], role: 'done', r: 7 }, { kind: 'point', at: [x2, 0], role: 'done', r: 7 });
        readouts.push({ label: 'roots', value: `${fmt(Math.min(x1, x2), 4)}, ${fmt(Math.max(x1, x2), 4)}`, role: 'result' });
        note = 'D > 0: two real roots.';
      } else if (D >= -1e-12) {
        items.push({ kind: 'point', at: [xv, 0], role: 'done', r: 7 });
        readouts.push({ label: 'root (double)', value: fmt(xv, 4), role: 'result' });
        note = 'D = 0: the vertex just touches the axis, one repeated root.';
      } else {
        readouts.push({ label: 'roots', value: 'no real roots', role: 'error' });
        note = 'D < 0: the curve never meets the axis. No real roots.';
      }
    }
    return { scene: scene([-6, 6], [-8, 8], items, `Graph of ${a} x squared plus ${b} x plus ${c}.`), readouts, note };
  },
  tryThis: [
    R`Slide {{c|c}} up until the two roots merge into one. What is the discriminant at that moment?`,
    R`Make {{a|a}} negative. The parabola opens downwards, and the vertex becomes a maximum.`,
    R`Keep {{a=1|a equals 1}} and change only {{b|b}}. The vertex moves along a curve. Can you guess which one?`,
  ],
};

// ------------------------------------------------------------------ topic

const hookScene = balance('3x + 5', '20', 'What can you do to both pans?');

const topic: Topic = {
  id: 'f-algebra',
  course: 'foundations',
  number: '0.1',
  title: 'Numbers, algebra and equations',
  blurb: 'Fractions, exponents, rearranging, inequalities.',
  icon: '±',
  prereqs: [],
  glossary: [
    { id: 'equation', term: 'Equation', def: 'A statement that two expressions are equal, such as {{3x+5=20|3 x plus 5 equals 20}}. Solving it means finding every value that makes it true.' },
    { id: 'solution-set', term: 'Solution set', def: 'All the values that make an equation or inequality true. It can be one number, several, an interval, or empty.' },
    { id: 'equivalent', term: 'Equivalent equations', def: 'Equations with exactly the same solution set. Adding the same thing to both sides, or multiplying both sides by a non-zero number, gives an equivalent equation.' },
    { id: 'extraneous', term: 'Extraneous solution', def: 'A value produced while solving that does not satisfy the original equation. Squaring both sides is the usual cause.' },
    { id: 'discriminant', term: 'Discriminant', def: 'For {{ax^2+bx+c=0|a x squared plus b x plus c equals zero}}, the number {{b^2-4ac|b squared minus 4 a c}}. Positive: two real roots. Zero: one repeated root. Negative: no real roots.' },
    { id: 'exponent', term: 'Exponent', def: 'In {{a^n|a to the n}}, the exponent {{n|n}} says how many factors of {{a|a}} to multiply. The laws extend it to zero, negative and fractional powers.' },
    { id: 'rational', term: 'Rational number', def: 'A number that can be written as a fraction {{p/q|p over q}} of integers with {{q\\neq0|q not zero}}. Its decimal expansion ends or repeats.' },
    { id: 'abs', term: 'Absolute value', def: 'The distance of a number from zero: {{|x|=x|absolute x equals x}} if {{x\\ge0|x is at least zero}}, and {{-x|minus x}} otherwise. {{|x-a|<r|absolute x minus a less than r}} means x is within r of a.' },
  ],
  formulas: [
    { name: 'Exponent laws', tex: R`a^m a^n=a^{m+n},\quad (a^m)^n=a^{mn},\quad a^{-n}=\frac{1}{a^n},\quad a^{1/n}=\sqrt[n]{a}`, say: 'a to the m times a to the n is a to the m plus n; a to the m, to the n, is a to the m n; a to the minus n is 1 over a to the n; a to the 1 over n is the n-th root of a' },
    { name: 'Adding fractions', tex: R`\frac{a}{b}+\frac{c}{d}=\frac{ad+bc}{bd}`, say: 'a over b plus c over d equals a d plus b c, over b d' },
    { name: 'Quadratic formula', tex: R`ax^2+bx+c=0\ \Rightarrow\ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`, say: 'if a x squared plus b x plus c equals zero, then x equals minus b plus or minus the root of b squared minus 4 a c, over 2 a' },
    { name: 'Completing the square', tex: R`x^2+px=\left(x+\tfrac{p}{2}\right)^2-\tfrac{p^2}{4}`, say: 'x squared plus p x equals x plus p over 2, squared, minus p squared over 4' },
    { name: 'Stable quadratic roots', tex: R`x_1=\frac{-b-\operatorname{sign}(b)\sqrt{b^2-4ac}}{2a},\qquad x_2=\frac{c}{a\,x_1}`, say: 'x 1 equals minus b minus sign of b times the root of the discriminant, over 2 a; x 2 equals c over a x 1' },
    { name: 'Absolute value inequality', tex: R`|x-a|<r\iff a-r<x<a+r`, say: 'absolute x minus a less than r is the same as a minus r less than x less than a plus r' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'You may do anything to an equation, as long as you do it to both sides. True?',
      scene: hookScene,
      teaser: R`Almost. Subtracting 5 from both sides is always safe. But dividing both sides by {{x|x}} can lose a solution, and squaring both sides can invent one. Knowing **which** moves are safe is what this topic is about. It is also what stops a simulation code from quietly dividing by zero.`,
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
            { type: 'p', text: 'Algebra is the grammar of everything that follows. Every formula in physics, every update rule in a simulation, and every step of a derivation is algebra: rewriting one true statement as another, equally true one.' },
            { type: 'p', text: 'This topic has no prerequisites. It covers the kinds of numbers, the laws of exponents, solving and rearranging equations, quadratics, and inequalities.' },
            { type: 'note', kind: 'compsci', text: 'Before a formula goes into code it is usually rearranged: solved for the time step, the unknown temperature, or the next position. A slip in that algebra gives a program that runs fine and computes the wrong thing.' },
          ],
        },
        {
          id: 'numbers',
          title: 'What numbers are',
          blocks: [
            { type: 'p', text: R`The **natural numbers** {{1,2,3,\dots|1, 2, 3 and so on}} count things. Add zero and the negatives and you get the **integers**. Allow division by non-zero integers and you get the [[rational|rational numbers]], fractions {{p/q|p over q}}.` },
            { type: 'p', text: R`Some lengths are not fractions. The diagonal of a unit square is {{\sqrt2|root 2}}, which is irrational. Fill in all such gaps and you get the **real numbers**: every point on a continuous number line.` },
            { type: 'p', text: R`Division by zero is undefined, not "infinity". If {{a/0|a over zero}} were some number {{q|q}}, then {{a=q\cdot0=0|a would equal q times zero, which is zero}} for every {{a|a}}. That is false whenever {{a\neq0|a is not zero}}.` },
            { type: 'note', kind: 'compsci', text: 'A computer stores real numbers as floating-point numbers: about 16 significant digits and a limited range. Most reals, even 0.1, are stored slightly rounded. Course 6 starts with exactly this.' },
          ],
        },
        {
          id: 'exponents',
          title: 'Exponents and why their laws hold',
          blocks: [
            { type: 'p', text: R`For a whole number {{n|n}}, {{a^n|a to the n}} means {{n|n}} factors of {{a|a}}. Counting factors gives the first two laws at once:` },
            { type: 'eq', eq: { tex: R`a^m\,a^n=a^{m+n},\qquad (a^m)^n=a^{mn}`, say: 'a to the m times a to the n equals a to the m plus n, and a to the m, to the n, equals a to the m n', label: 'exponent laws' } },
            { type: 'p', text: R`Other exponents are **defined** so these laws keep working. {{a^0\cdot a^n=a^n|a to the zero times a to the n equals a to the n}} forces {{a^0=1|a to the zero equals 1}}. Then {{a^{-n}a^{n}=a^0=1|a to the minus n times a to the n equals 1}} forces {{a^{-n}=1/a^n|a to the minus n equals 1 over a to the n}}.` },
            { type: 'p', text: R`Fractional powers follow too: {{(a^{1/n})^n=a^1=a|a to the 1 over n, to the n, equals a}}, so {{a^{1/n}=\sqrt[n]{a}|a to the 1 over n is the n-th root of a}}. For example {{8^{2/3}=(\sqrt[3]{8})^2=4|8 to the two thirds equals the cube root of 8, squared, which is 4}}.` },
            { type: 'note', kind: 'pitfall', text: R`{{(a+b)^2\neq a^2+b^2|a plus b squared is not a squared plus b squared}}. Exponent laws work on products, not sums: {{(a+b)^2=a^2+2ab+b^2|a plus b squared equals a squared plus 2 a b plus b squared}}.` },
          ],
        },
        {
          id: 'equations',
          title: 'Equations as balances',
          blocks: [
            { type: 'p', text: R`An [[equation]] says two expressions are equal. To solve it, apply the same operation to both sides until the unknown stands alone. Each step must give an [[equivalent|equivalent equation]]: same solutions, nothing gained or lost.` },
            { type: 'figure', scene: balance('3x + 5', '20', 'level means equal'), caption: R`Think of a balance. Whatever you do to one pan, do to the other, and it stays level.` },
            { type: 'p', text: R`Rearranging a formula works the same way. Solve {{v=u+at|v equals u plus a t}} for {{t|t}}: subtract {{u|u}} from both sides, then divide both sides by {{a|a}}, which needs {{a\neq0|a not zero}}. The result is {{t=(v-u)/a|t equals v minus u, over a}}.` },
            { type: 'note', kind: 'units', text: R`Rearranging never changes units. In {{t=(v-u)/a|t equals v minus u, over a}}, metres per second divided by metres per second squared gives seconds. A units check catches most algebra slips.` },
          ],
        },
        {
          id: 'why',
          title: 'Why it works, and when it doesn’t',
          blocks: [
            { type: 'p', text: R`A step is safe when it can be **undone**. Adding 5 is undone by subtracting 5. Multiplying by 3 is undone by dividing by 3. Because you can go back, no solution can appear or vanish.` },
            { type: 'p', text: R`Multiplying by 0 can’t be undone: it turns every equation into {{0=0|zero equals zero}}. Dividing by an expression that might be zero is the same trap. From {{x^2=x|x squared equals x}}, dividing by {{x|x}} gives {{x=1|x equals 1}} and silently loses {{x=0|x equals zero}}.` },
            { type: 'p', text: R`Squaring can’t be undone either, because {{2^2=(-2)^2|2 squared equals minus 2 squared}}. Squaring both sides can create an [[extraneous|extraneous solution]], so you must check every answer in the original equation.` },
            { type: 'note', kind: 'remember', text: 'Safe moves: add or subtract anything; multiply or divide by something certainly non-zero. Risky moves: divide by an expression, square both sides. After a risky move, check every answer in the original.' },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three short animations: an equation as a balance, why a negative flips an inequality, and completing the square as a picture.', anims: [balanceAnim(), flipAnim(), squareAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-zero-power', prompt: R`What is {{5^0|5 to the zero}}?`, answer: { kind: 'numeric', value: 1, absTol: 1e-12 }, explain: R`{{5^0\cdot5^n=5^{0+n}=5^n|5 to the zero times 5 to the n equals 5 to the n}}, so {{5^0|5 to the zero}} must be 1 for the law to hold.` },
        {
          id: 'rc-safe',
          prompt: 'Which step is guaranteed not to change the solutions of an equation?',
          answer: { kind: 'mc', options: ['Dividing both sides by x', 'Squaring both sides', 'Subtracting 7 from both sides', 'Multiplying both sides by x − 2'], correct: 2 },
          explain: 'Subtracting 7 can be undone by adding 7. The other moves can lose solutions (dividing by x, or multiplying by something that may be zero) or create them (squaring).',
        },
        { id: 'rc-rearrange', prompt: R`Rearrange {{v=u+at|v equals u plus a t}} for {{t|t}}. Type your answer in terms of {{v|v}}, {{u|u}} and {{a|a}}.`, answer: { kind: 'expr', expr: '(v-u)/a', vars: ['v', 'u', 'a'] }, explain: R`Subtract {{u|u}}: {{v-u=at|v minus u equals a t}}. Divide by {{a|a}} (non-zero): {{t=\frac{v-u}{a}|t equals v minus u over a}}.` },
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
          id: 'fractions',
          title: 'Fractions and algebraic fractions',
          blocks: [
            { type: 'p', text: R`To add fractions, rewrite them over a common denominator: {{\frac ab+\frac cd=\frac{ad+bc}{bd}|a over b plus c over d equals a d plus b c over b d}}. To divide, multiply by the reciprocal: {{\frac ab\div\frac cd=\frac{ad}{bc}|a over b divided by c over d equals a d over b c}}.` },
            { type: 'p', text: R`You may cancel a common **factor** of the whole top and the whole bottom: {{\frac{x(x+1)}{x}=x+1|x times x plus 1 over x equals x plus 1}}, for {{x\neq0|x not zero}}. You may never cancel a **term** of a sum: {{\frac{x+1}{x}\neq1|x plus 1 over x is not 1}}.` },
            { type: 'note', kind: 'pitfall', text: R`Cancelling changes the domain. {{\frac{x^2-1}{x-1}=x+1|x squared minus 1 over x minus 1 equals x plus 1}} only for {{x\neq1|x not 1}}: at 1 the left side is {{0/0|zero over zero}}. This exact situation reappears when you compute limits.` },
          ],
        },
        {
          id: 'quadratics',
          title: 'Quadratic equations',
          blocks: [
            { type: 'p', text: R`A quadratic {{ax^2+bx+c=0|a x squared plus b x plus c equals zero}}, with {{a\neq0|a not zero}}, can always be solved by **completing the square**. Divide by {{a|a}}, then use {{x^2+px=(x+\tfrac p2)^2-\tfrac{p^2}{4}|x squared plus p x equals x plus p over 2, squared, minus p squared over 4}}.` },
            { type: 'p', text: R`Doing that in general (you will fill in the gaps in a later step) gives the quadratic formula:` },
            { type: 'eq', eq: { tex: R`x=\frac{-b\pm\sqrt{\R{result}{b^2-4ac}}}{2a}`, say: 'x equals minus b plus or minus the root of b squared minus 4 a c, all over 2 a', label: 'quadratic formula' } },
            { type: 'p', text: R`The [[discriminant]] {{D=b^2-4ac|D equals b squared minus 4 a c}} decides what happens. If {{D>0|D is positive}} there are two real roots. If {{D=0|D is zero}} there is one repeated root. If {{D<0|D is negative}} there are no real roots: the parabola never meets the axis.` },
            { type: 'p', text: R`If you can spot a factorisation, it is faster. {{x^2-5x+6=(x-2)(x-3)|x squared minus 5 x plus 6 equals x minus 2 times x minus 3}}, and a product is zero only when a factor is zero, so {{x=2|x equals 2}} or {{x=3|x equals 3}}.` },
          ],
        },
        {
          id: 'inequalities',
          title: 'Inequalities and absolute values',
          blocks: [
            { type: 'p', text: R`Inequalities follow the same rules as equations with one change: **multiplying or dividing by a negative number flips the direction**. Multiplying by −1 reflects the number line, so the order of every pair reverses.` },
            { type: 'p', text: R`Example: {{-2x+3<7|minus 2 x plus 3 is less than 7}}. Subtract 3 to get {{-2x<4|minus 2 x less than 4}}. Divide by −2 and flip: {{x>-2|x greater than minus 2}}. The [[solution-set|solution set]] is an interval, not a single number.` },
            { type: 'p', text: R`The [[abs|absolute value]] {{|x-a|<r|absolute x minus a less than r}} means "{{x|x}} is within {{r|r}} of {{a|a}}", the interval {{a-r<x<a+r|a minus r less than x less than a plus r}}.` },
            { type: 'note', kind: 'compsci', text: R`Every iterative solver stops with an absolute-value test such as {{|x_{n+1}-x_n|<10^{-10}|absolute x n plus 1 minus x n less than ten to the minus ten}}: "the answer has stopped changing, to within the tolerance".` },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: quadLab },
    {
      id: 'predict',
      kind: 'predict',
      question: R`Solve {{\sqrt{x+2}=x|root of x plus 2 equals x}} by squaring both sides. Squaring gives a quadratic with two roots. How many solutions does the **original** equation have?`,
      answer: { kind: 'mc', options: ['None', 'One', 'Two', 'Infinitely many'], correct: 1 },
      reveal: extraneousAnim(),
      explain: R`Squaring gives {{x+2=x^2|x plus 2 equals x squared}}, with roots 2 and −1. But {{\sqrt{x+2}|the square root}} is never negative, so {{x=-1|x equals minus 1}} cannot satisfy {{\sqrt{x+2}=x|root x plus 2 equals x}}. Only {{x=2|x equals 2}} survives the check.`,
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
            { type: 'p', text: R`On paper the quadratic formula is exact. On a computer it can fail badly. Take {{x^2+10^8x+1=0|x squared plus ten to the eight x plus 1 equals zero}}. The small root is very close to {{-10^{-8}|minus ten to the minus eight}}.` },
            { type: 'p', text: R`The formula computes it as {{-10^8+\sqrt{10^{16}-4}|minus ten to the eight plus the root of ten to the sixteen minus 4}}: two nearly equal numbers subtracted. The good digits cancel and double precision returns about {{-7.45\times10^{-9}|minus 7.45 times ten to the minus nine}}, a 25% error.` },
            { type: 'p', text: R`The fix is algebra. Compute the root that adds two numbers of the **same** sign, {{x_1=\frac{-b-\operatorname{sign}(b)\sqrt{D}}{2a}|x 1 equals minus b minus sign of b root D, over 2 a}}. Then use {{x_1x_2=c/a|x 1 times x 2 equals c over a}} to get {{x_2=c/(ax_1)|x 2 equals c over a x 1}}, with no subtraction at all.` },
            { type: 'eq', eq: { tex: R`x_1=\frac{-b-\operatorname{sign}(b)\sqrt{b^2-4ac}}{2a},\qquad x_2=\frac{c}{a\,x_1}`, say: 'x 1 equals minus b minus sign of b times the root of b squared minus 4 a c, over 2 a, and x 2 equals c over a x 1', label: 'stable form' } },
            { type: 'note', kind: 'compsci', text: 'Two formulas that are equal on paper can behave very differently in floating point. Choosing the form that avoids subtracting nearly equal numbers is a core skill of numerical computing.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'p', text: 'Use **sympy** to solve or rearrange symbolically:' },
            { type: 'code', code: "import sympy as sp\nv, u, a, t = sp.symbols('v u a t')\nprint(sp.solve(sp.Eq(v, u + a*t), t))      # [(v - u)/a]\nx = sp.symbols('x')\nprint(sp.solve(x**2 - 5*x + 6, x))          # [2, 3]\nprint(sp.solve(sp.sqrt(x + 2) - x, x))      # [2]  (sympy checks for you)", say: 'With sympy, solve v equals u plus a t for t, solve x squared minus 5 x plus 6, and solve root of x plus 2 minus x, which gives only 2.' },
            { type: 'p', text: 'Use **numpy** for numerical roots of polynomials, and Python’s exact fractions when you want rational arithmetic without rounding:' },
            { type: 'code', code: 'import numpy as np\nfrom fractions import Fraction\nprint(np.roots([1, -5, 6]))                 # [3. 2.]\nprint(Fraction(1, 3) + Fraction(1, 6))      # 1/2\nprint(0.1 + 0.2 == 0.3)                     # False: floats are rounded', say: 'np dot roots of 1, minus 5, 6 gives 3 and 2. Fractions add exactly: one third plus one sixth is one half. And 0.1 plus 0.2 is not exactly 0.3 in floating point.' },
            { type: 'note', kind: 'python', text: R`In Python {{x^2|x squared}} is written \`x**2\`. The caret \`^\` means something else (bitwise XOR), and \`2^3\` is 1, not 8.` },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                R`Writing {{(a+b)^2=a^2+b^2|a plus b squared equals a squared plus b squared}}. The cross term {{2ab|2 a b}} is missing.`,
                R`Cancelling terms instead of factors: {{\frac{x+3}{x}=3|x plus 3 over x equals 3}} is wrong.`,
                'Dividing both sides by an expression that could be zero, and losing a solution.',
                'Squaring both sides and not checking the answers in the original equation.',
                'Forgetting to flip an inequality after multiplying or dividing by a negative number.',
                R`Taking {{\sqrt{x^2}=x|root of x squared equals x}}. It is {{|x||absolute x}}.`,
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: R`Rearranging gives simulation parameters. A stability rule such as {{c\,\Delta t/\Delta x\le1|c delta t over delta x at most 1}} is rearranged to {{\Delta t\le\Delta x/c|delta t at most delta x over c}}: the largest time step you may use.` },
            { type: 'p', text: 'Ray tracers find where a ray hits a sphere by solving a quadratic for the distance along the ray. Renderers use the stable form above, because the naive formula gives visible speckles when rays graze a surface.' },
            { type: 'p', text: 'Every iterative method, from Newton’s method to a linear solver, ends with an inequality: keep going until the change or the residual is below a tolerance.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                'Integers, rationals and reals; division by zero is undefined; computers store reals approximately.',
                R`Exponent laws come from counting factors; {{a^0=1|a to the zero is 1}}, {{a^{-n}=1/a^n|a to the minus n is 1 over a to the n}} and {{a^{1/n}=\sqrt[n]a|a to the 1 over n is the n-th root}} are defined to keep them true.`,
                'Solve by applying the same reversible step to both sides. Dividing by an expression or squaring can lose or create solutions, so check.',
                R`Quadratics: complete the square, or use {{x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}|the quadratic formula}}; the discriminant counts the real roots.`,
                'Inequalities flip under multiplication by a negative. On a computer, prefer formulas that avoid subtracting nearly equal numbers.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: R`A ball is thrown upwards at 12 m/s from 2 m above the ground. Its height is {{h(t)=2+12t-4.905t^2|h of t equals 2 plus 12 t minus 4.905 t squared}} metres. When does it hit the ground?`,
      lines: [
        { tex: R`2+12t-4.905t^2=0`, say: '2 plus 12 t minus 4.905 t squared equals zero', why: 'Hitting the ground means height zero.' },
        { tex: R`a=-4.905,\ b=12,\ c=2`, say: 'a equals minus 4.905, b equals 12, c equals 2', why: 'Matched to a t² + b t + c = 0.' },
        { tex: R`b^2-4ac=144+39.24=183.24`, say: 'b squared minus 4 a c equals 144 plus 39.24, which is 183.24', why: 'Discriminant: positive, so two real roots.' },
        { tex: R`t=\frac{-12\pm\sqrt{183.24}}{-9.81}=\frac{-12\pm13.537}{-9.81}`, say: 't equals minus 12 plus or minus 13.537, over minus 9.81', why: 'Quadratic formula; the square root of 183.24 is about 13.537.' },
        { tex: R`t\approx-0.157\ \text{s}\quad\text{or}\quad t\approx2.603\ \text{s}`, say: 't is about minus 0.157 seconds or about 2.603 seconds', why: 'Worked out both signs.' },
        { tex: R`t\approx2.60\ \text{s}`, say: 't is about 2.60 seconds', why: 'Rejected the negative time: the ball was thrown at t = 0.' },
      ],
      takeaway: 'Algebra gives every solution of the equation. The model then decides which ones are physical. Here the negative root is a time before the throw, so we drop it.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-linear',
          prompt: R`Solve {{3(x-2)=2x+5|3 times x minus 2 equals 2 x plus 5}}.`,
          answer: { kind: 'numeric', value: 11, absTol: 1e-9 },
          hints: ['Expand the bracket first.', R`{{3x-6=2x+5|3 x minus 6 equals 2 x plus 5}}. Get all the {{x|x}} terms on one side.`, R`Subtract {{2x|2 x}} and add 6 to both sides.`],
          solution: [
            { tex: R`3x-6=2x+5`, say: '3 x minus 6 equals 2 x plus 5', why: 'Expanded the bracket.' },
            { tex: R`x-6=5`, say: 'x minus 6 equals 5', why: 'Subtracted 2x from both sides.' },
            { tex: R`x=11`, say: 'x equals 11', why: 'Added 6 to both sides. Check: 3 × 9 = 27 = 22 + 5.' },
          ],
          solutionFinal: '11',
          truth: 'solve(Eq(3*(x-2), 2*x+5), x)[0]',
        },
        {
          id: 'yt-rearrange',
          prompt: R`Rearrange {{v^2=u^2+2as|v squared equals u squared plus 2 a s}} for {{s|s}}. Type it in terms of {{v|v}}, {{u|u}} and {{a|a}}.`,
          answer: { kind: 'expr', expr: '(v^2 - u^2)/(2*a)', vars: ['v', 'u', 'a'] },
          hints: [R`Get the term containing {{s|s}} alone first.`, R`Subtract {{u^2|u squared}}: {{v^2-u^2=2as|v squared minus u squared equals 2 a s}}.`, R`Divide both sides by {{2a|2 a}}, which is non-zero for a real acceleration.`],
          solution: [
            { tex: R`v^2-u^2=2as`, say: 'v squared minus u squared equals 2 a s', why: 'Subtracted u² from both sides.' },
            { tex: R`s=\frac{v^2-u^2}{2a}`, say: 's equals v squared minus u squared, over 2 a', why: 'Divided both sides by 2a (a ≠ 0).' },
          ],
          solutionFinal: '(v**2 - u**2)/(2*a)',
          truth: 'solve(Eq(v**2, u**2 + 2*a*s), s)[0]',
        },
        {
          id: 'yt-exponents',
          prompt: R`Simplify {{\left(2^3\cdot2^{-5}\right)^{-1}|2 cubed times 2 to the minus 5, all to the minus 1}} to a single number.`,
          answer: { kind: 'numeric', value: 4, absTol: 1e-12 },
          hints: ['Combine the product inside the bracket first.', R`{{2^3\cdot2^{-5}=2^{-2}|2 cubed times 2 to the minus 5 equals 2 to the minus 2}}.`, R`{{(2^{-2})^{-1}=2^{2}|2 to the minus 2, to the minus 1, equals 2 squared}}.`],
          solution: [
            { tex: R`2^3\cdot2^{-5}=2^{3-5}=2^{-2}`, say: '2 cubed times 2 to the minus 5 equals 2 to the minus 2', why: 'Added exponents of the same base.' },
            { tex: R`\left(2^{-2}\right)^{-1}=2^{(-2)(-1)}=2^2=4`, say: '2 to the minus 2, to the minus 1, equals 2 squared, which is 4', why: 'Multiplied exponents for a power of a power.' },
          ],
          solutionFinal: '4',
          truth: '(Integer(2)**3 * Integer(2)**-5)**-1',
        },
        {
          id: 'yt-inequality',
          prompt: R`Solve {{-2x+3<7|minus 2 x plus 3 is less than 7}}. Which set is the solution?`,
          answer: { kind: 'mc', options: ['{{x<-2|x less than minus 2}}', '{{x>-2|x greater than minus 2}}', '{{x>2|x greater than 2}}', '{{x<5|x less than 5}}'], correct: 1 },
          hints: ['Subtract 3 from both sides first.', R`{{-2x<4|minus 2 x less than 4}}. Now divide by −2.`, 'Dividing by a negative number flips the inequality.'],
          solution: [
            { tex: R`-2x<4`, say: 'minus 2 x is less than 4', why: 'Subtracted 3 from both sides.' },
            { tex: R`x>-2`, say: 'x is greater than minus 2', why: 'Divided by −2 and flipped the direction.' },
          ],
          solutionFinal: '-2',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-quadratic',
        title: 'A quadratic solver that doesn’t lose digits',
        prompt: "Write `solve_quadratic(a, b, c)` returning the **real** roots of {{ax^2+bx+c=0|a x squared plus b x plus c equals zero}} (with {{a\\neq0|a not zero}}) as a sorted tuple: two roots, one root when {{D=0|D equals zero}}, or `()` when there are none. Use the stable form so that `solve_quadratic(1, 1e8, 1)` gets the small root to 12 significant digits.",
        starter: 'import math\n\ndef solve_quadratic(a, b, c):\n    d = b * b - 4 * a * c\n    # naive formula: loses digits when b*b is much bigger than 4ac\n    r = math.sqrt(d)\n    return tuple(sorted(((-b - r) / (2 * a), (-b + r) / (2 * a))))\n',
        solution: 'import math\n\ndef solve_quadratic(a, b, c):\n    d = b * b - 4 * a * c\n    if d < 0:\n        return ()\n    if d == 0:\n        return (-b / (2 * a),)\n    r = math.sqrt(d)\n    x1 = (-b - math.copysign(r, b)) / (2 * a)\n    x2 = c / (a * x1)\n    return tuple(sorted((x1, x2)))\n',
        tests: [
          'import math',
          'def test_simple_roots():',
          '    assert solve_quadratic(1, -5, 6) == (2.0, 3.0)',
          'def test_no_real_roots():',
          '    assert solve_quadratic(1, 0, 1) == ()',
          'def test_double_root():',
          '    r = solve_quadratic(1, -4, 4)',
          '    assert len(r) == 1 and abs(r[0] - 2) < 1e-12, r',
          'def test_small_root_is_accurate():',
          '    lo, hi = solve_quadratic(1, 1e8, 1)',
          '    small = hi  # the root near -1e-8',
          '    exact = -2 / (1e8 + math.sqrt(1e16 - 4))',
          '    assert abs(small - exact) / abs(exact) < 1e-12, small',
          'def test_negative_b_also_stable():',
          '    lo, hi = solve_quadratic(1, -1e8, 1)',
          '    assert abs(lo - 1e-8) / 1e-8 < 1e-12, lo',
        ].join('\n'),
        hints: [
          'Handle the cases first: D < 0 gives (), D == 0 gives one root.',
          'Compute the root that adds two numbers of the same sign: x1 = (-b - copysign(sqrt(D), b)) / (2a).',
          'Get the other root from the product of roots: x1 * x2 = c / a, so x2 = c / (a * x1).',
        ],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'derivation',
      intro: R`Fill the gaps in the derivation of the quadratic formula by completing the square. Type each missing expression in terms of {{a|a}}, {{b|b}} and {{c|c}}.`,
      template:
        'a x² + b x + c = 0\n' +
        'x² + (b/a) x = ⟦p⟧                        (subtract c, divide by a)\n' +
        '(x + b/(2a))² = ⟦q⟧ − c/a                (add (b/2a)² to both sides)\n' +
        '(x + b/(2a))² = (⟦d⟧) / (4a²)            (common denominator)\n' +
        'x = −b/(2a) ± √(b² − 4ac) / (2a)\n',
      blanks: [
        { id: 'p', answers: ['-c/a'], check: 'expr', vars: ['a', 'b', 'c'], width: 10, hint: 'Move c to the right-hand side, then divide everything by a.' },
        { id: 'q', answers: ['b^2/(4*a^2)'], check: 'expr', vars: ['a', 'b', 'c'], width: 12, hint: 'Half of b/a, squared.' },
        { id: 'd', answers: ['b^2 - 4*a*c'], check: 'expr', vars: ['a', 'b', 'c'], width: 12, hint: 'Write b²/(4a²) − c/a over the denominator 4a².' },
      ],
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Simulation set-up', title: 'Choosing the time step', text: R`Stability conditions are inequalities. Rearranging {{c\,\Delta t/\Delta x\le1|c delta t over delta x at most 1}} for {{\Delta t|delta t}} gives the largest safe time step of a wave or fluid solver.` },
        { field: 'Computer graphics', title: 'Ray–sphere intersection', text: 'Ray tracers solve a quadratic for every ray that might hit a sphere. Production renderers use the cancellation-free form of the quadratic formula.' },
        { field: 'Numerical solvers', title: 'Stopping tests', text: R`Iterative methods stop when {{|x_{n+1}-x_n|<\varepsilon|the change is smaller than epsilon}}: an absolute-value inequality with a chosen tolerance.` },
        { field: 'Engineering', title: 'Rearranging design formulas', text: 'A beam, pipe or circuit formula is written for one quantity but you often need another: the thickness for a given stress, or the resistance for a given time constant.' },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-linear',
          title: 'Solve a linear equation',
          difficulty: 'easy',
          prompt: 'Write `solve_linear(a, b)` that returns the solution of {{ax+b=0|a x plus b equals zero}}. If `a == 0`, raise `ValueError`, because there is either no solution or every x is one.',
          starter: 'def solve_linear(a, b):\n    pass\n',
          solution: 'def solve_linear(a, b):\n    if a == 0:\n        raise ValueError("a must be non-zero")\n    return -b / a\n',
          tests: [
            'def test_basic():',
            '    assert solve_linear(2, -8) == 4',
            'def test_negative():',
            '    assert solve_linear(-4, 2) == 0.5',
            'def test_zero_a_raises():',
            '    try:',
            '        solve_linear(0, 3)',
            '    except ValueError:',
            '        return',
            '    assert False, "expected ValueError"',
          ].join('\n'),
          hints: ['Subtract b, then divide by a.', 'x = −b / a.', 'Check a == 0 first and raise ValueError("…").'],
        },
        {
          id: 'pb-tolerance',
          title: 'Within tolerance',
          difficulty: 'easy',
          prompt: 'Write `within(x, target, tol)` returning `True` when {{|x-\\text{target}|\\le\\text{tol}|absolute x minus target at most tol}}, else `False`.',
          starter: 'def within(x, target, tol):\n    return False\n',
          solution: 'def within(x, target, tol):\n    return abs(x - target) <= tol\n',
          tests: [
            'def test_inside():',
            '    assert within(9.81, 9.8, 0.05)',
            'def test_outside():',
            '    assert not within(10.0, 9.8, 0.05)',
            'def test_symmetric():',
            '    assert within(9.76, 9.8, 0.05) and not within(9.74, 9.8, 0.05)',
            'def test_float_sum():',
            '    assert within(0.1 + 0.2, 0.3, 1e-12)',
          ].join('\n'),
          hints: ['Distance between two numbers is an absolute value.', 'Python has abs().', 'return abs(x - target) <= tol'],
        },
        {
          id: 'pb-quad-ineq',
          title: 'Where is a quadratic negative?',
          difficulty: 'medium',
          prompt: 'For {{a>0|a positive}}, write `negative_interval(a, b, c)` returning the open interval `(lo, hi)` where {{ax^2+bx+c<0|a x squared plus b x plus c is negative}}, or `None` if it is never negative.',
          starter: 'def negative_interval(a, b, c):\n    pass\n',
          solution: 'import math\n\ndef negative_interval(a, b, c):\n    d = b * b - 4 * a * c\n    if d <= 0:\n        return None\n    r = math.sqrt(d)\n    x1 = (-b - math.copysign(r, b)) / (2 * a)\n    x2 = c / (a * x1) if x1 != 0 else -b / a\n    return (min(x1, x2), max(x1, x2))\n',
          tests: [
            'def test_two_roots():',
            '    lo, hi = negative_interval(1, -5, 6)',
            '    assert abs(lo - 2) < 1e-12 and abs(hi - 3) < 1e-12',
            'def test_never_negative():',
            '    assert negative_interval(1, 0, 1) is None',
            'def test_touching_is_not_negative():',
            '    assert negative_interval(1, -4, 4) is None',
            'def test_root_at_zero():',
            '    lo, hi = negative_interval(2, -4, 0)',
            '    assert abs(lo) < 1e-12 and abs(hi - 2) < 1e-12, (lo, hi)',
          ].join('\n'),
          hints: [
            'An upward parabola is negative exactly between its two roots.',
            'If the discriminant is ≤ 0 there are not two distinct roots, so it is never negative.',
            'Reuse your stable root formula, and watch out for c = 0 (one root is 0).',
          ],
        },
      ],
      outside: [
        { source: 'Paul’s Online Math Notes', item: 'Algebra → "Solving Equations and Inequalities" chapter (linear, quadratic, and absolute value sections, with practice problems)', why: 'Plenty of graded practice with full solutions.' },
        { source: 'Paul’s Online Math Notes', item: 'Algebra → Preliminaries → "Integer Exponents" and "Rational Exponents"', why: 'Drill for the exponent laws.' },
        { source: 'OpenStax College Algebra (also on LibreTexts)', item: 'Chapter 2 "Equations and Inequalities", sections on quadratic equations and linear and absolute value inequalities', why: 'Exercises from easy to hard, with answers to odd-numbered ones.' },
        { source: 'Khan Academy', item: 'Algebra 1 → "Solve equations & inequalities" and "Quadratic functions & equations" units', why: 'Short interactive exercises.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: which steps keep an equation’s solutions unchanged, which can add or lose solutions, and why? Use the words "reversible", "check" and "zero".',
      quiz: [
        { id: 'qz-frac', prompt: R`Compute {{\frac13+\frac16|one third plus one sixth}}.`, answer: { kind: 'numeric', value: 0.5, relTol: 1e-9 }, explain: R`Common denominator 6: {{\frac26+\frac16=\frac36=\frac12|2 sixths plus 1 sixth is 3 sixths, one half}}.` },
        { id: 'qz-disc', prompt: R`How many real roots does {{x^2+x+1=0|x squared plus x plus 1 equals zero}} have?`, answer: { kind: 'mc', options: ['0', '1', '2', 'It depends on x'], correct: 0 }, explain: R`{{b^2-4ac=1-4=-3<0|the discriminant is minus 3}}, so there are no real roots.` },
        { id: 'qz-power', prompt: R`What is {{27^{2/3}|27 to the two thirds}}?`, answer: { kind: 'numeric', value: 9, relTol: 1e-9 }, explain: R`{{27^{1/3}=3|the cube root of 27 is 3}}, and {{3^2=9|3 squared is 9}}.` },
      ],
    },
  ],
};

export default topic;
