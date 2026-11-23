/**
 * Foundations 0.6 — Logic, sets and proof.
 */
import type { AnimationDef, SandboxDef, Scene, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, scene } from '../../lib';

const R = String.raw;

// ------------------------------------------------------------------ helpers

const table = (rows: string[][], highlight: number, note: string, alt: string): Scene =>
  scene(
    [0, 10],
    [0, rows.length + 1.4],
    [
      ...rows.flatMap((r, i) =>
        r.flatMap((cell, j) => (cell === '' ? [] : [{
          kind: 'label' as const,
          at: [1.2 + j * 2.6, rows.length - i + 0.2] as [number, number],
          text: cell,
          role: (i === 0 ? 'ink' : i === highlight ? 'active' : 'muted') as 'ink' | 'active' | 'muted',
          anchor: 'middle' as const,
          hand: true,
          size: 24,
        }])),
      ),
      { kind: 'label', at: [5, rows.length + 0.9], text: note, role: 'active', anchor: 'middle', hand: true, size: 20 },
    ],
    alt,
    { axes: false, grid: false, size: [560, 300] },
  );

function implicationAnim(): AnimationDef {
  const head = ['P', 'Q', 'P ⇒ Q'];
  const rows = [
    ['T', 'T', 'T'],
    ['T', 'F', 'F'],
    ['F', 'T', 'T'],
    ['F', 'F', 'T'],
  ];
  const caps = [
    'P implies Q is a promise: if P happens, Q happens. Take P as "it rains" and Q as "the ground is wet".',
    'It rains and the ground is wet: promise kept. True.',
    'It rains and the ground is dry: promise broken. This is the only false row.',
    'No rain, ground wet (a sprinkler): the promise said nothing about dry days. Not broken, so true.',
    'No rain, ground dry: again the promise is not broken. True.',
  ];
  return anim(
    'implication',
    'The truth table of "implies"',
    caps.map((c, k) => frame(table([head, ...rows.slice(0, k).map((r) => r), ...rows.slice(k).map(() => ['', '', ''])], k, k === 0 ? 'if P then Q' : `row ${k}`, `Truth table for P implies Q with ${k} rows filled.`), c)),
  );
}

function intervalAnim(): AnimationDef {
  const A: [number, number] = [1, 5], B: [number, number] = [3, 8];
  const base = (extra: SceneItem[], note: string, alt: string): Scene =>
    scene(
      [0, 10],
      [-1.5, 3],
      [
        { kind: 'segment', a: [0.2, 0], b: [9.8, 0], role: 'ink', width: 1.5, arrow: true },
        ...[0, 2, 4, 6, 8].map((v) => ({ kind: 'label' as const, at: [v, -0.8] as [number, number], text: String(v), role: 'muted' as const, anchor: 'middle' as const, size: 14 })),
        { kind: 'segment', a: [A[0], 1.6], b: [A[1], 1.6], role: 'given', width: 6 },
        { kind: 'label', at: [A[0], 2.2], text: 'A = [1, 5]', role: 'given', hand: true, size: 20 },
        { kind: 'segment', a: [B[0], 1], b: [B[1], 1], role: 'q-slope', width: 6 },
        { kind: 'label', at: [B[1] - 2.2, 2.2], text: 'B = [3, 8]', role: 'q-slope', hand: true, size: 20 },
        ...extra,
        { kind: 'label', at: [9.7, -1.3], text: note, role: 'result', anchor: 'end', hand: true, size: 22 },
      ],
      alt,
      { axes: false, grid: false, size: [640, 260] },
    );
  return anim('sets', 'Union, intersection and difference', [
    frame(base([], 'two sets of numbers', 'Intervals A from 1 to 5 and B from 3 to 8.'), 'Two sets of real numbers: A is the interval from 1 to 5, B from 3 to 8.'),
    frame(base([{ kind: 'segment', a: [1, 0], b: [8, 0], role: 'result', width: 8 }], 'A ∪ B = [1, 8]', 'The union, from 1 to 8, shaded on the number line.'), 'The union A or B: every number in at least one of them. From 1 to 8.'),
    frame(base([{ kind: 'segment', a: [3, 0], b: [5, 0], role: 'result', width: 8 }], 'A ∩ B = [3, 5]', 'The intersection, from 3 to 5.'), 'The intersection A and B: numbers in both. From 3 to 5.'),
    frame(base([{ kind: 'segment', a: [1, 0], b: [3, 0], role: 'result', width: 8 }, { kind: 'point', at: [3, 0], role: 'result', hollow: true }], 'A \\ B = [1, 3)', 'The difference, from 1 up to but not including 3.'), 'The difference A minus B: in A but not in B. From 1 up to 3, with 3 itself excluded because 3 is in B.'),
  ]);
}

function dominoAnim(): AnimationDef {
  const n = 7;
  const dom = (fallen: number, pushed: boolean, note: string, alt: string): Scene => {
    const items: SceneItem[] = [];
    for (let i = 0; i < n; i++) {
      const x = 1 + i * 1.2;
      if (i < fallen) items.push({ kind: 'polyline', points: [[x, 0], [x + 0.25, 0], [x + 1.25, 0.9], [x + 1.0, 1.05]], role: 'done', closed: true, fill: true });
      else items.push({ kind: 'rect', x, y: 0, w: 0.25, h: 1.4, role: 'q-x', opacity: 0.6 });
      items.push({ kind: 'label', at: [x + 0.12, -0.45], text: `P(${i + 1})`, role: 'muted', anchor: 'middle', size: 13 });
    }
    if (pushed) items.push({ kind: 'segment', a: [-0.3, 1.1], b: [0.8, 1.1], role: 'active', arrow: true, width: 3 });
    items.push({ kind: 'label', at: [5, 2.3], text: note, role: 'active', anchor: 'middle', hand: true, size: 22 });
    return scene([-0.5, 10], [-1, 2.7], items, alt, { axes: false, grid: false, size: [640, 230] });
  };
  return anim('induction', 'Induction is a row of dominoes', [
    frame(dom(0, false, 'a statement P(n) for every n', 'Seven standing dominoes labelled P of 1 to P of 7.'), 'We want to prove a statement P of n for every whole number n: infinitely many dominoes.'),
    frame(dom(0, true, 'base case: P(1) is true', 'A push arrow at the first domino.'), 'Step one, the base case: show P of 1 is true. The first domino is pushed.'),
    frame(dom(1, false, 'step: P(k) ⇒ P(k+1)', 'The first domino has fallen and leans on the second.'), 'Step two, the inductive step: show that if P of k is true, then P of k plus 1 is true. Each falling domino knocks over the next.'),
    frame(dom(4, false, 'the chain continues…', 'Four dominoes have fallen.'), 'Then P of 2 follows from P of 1, P of 3 from P of 2, and so on.'),
    frame(dom(7, false, 'every P(n) is true', 'All dominoes have fallen.'), 'Every domino falls, however far along it is. Two finite arguments prove infinitely many statements.'),
  ]);
}

function affirmReveal(): AnimationDef {
  const head = ['rain', 'wet', 'rain ⇒ wet'];
  const rows = [
    ['T', 'T', 'T'],
    ['T', 'F', 'F'],
    ['F', 'T', 'T'],
    ['F', 'F', 'T'],
  ];
  return anim('affirm', 'Wet ground does not prove rain', [
    frame(table([head, ...rows], 0, 'we know: rain ⇒ wet', 'Full truth table for rain implies wet.'), 'Keep only the rows where the rule "if it rains, the ground is wet" is true.'),
    frame(table([head, rows[0], ['', '', ''], rows[2], ['', '', '']], 1, 'and the ground is wet', 'Rows where the ground is wet and the rule holds.'), 'Now keep only rows where the ground is wet. Two are left.'),
    frame(table([head, rows[0], ['', '', ''], rows[2], ['', '', '']], 3, 'rain = F is still possible', 'One remaining row has no rain.'), 'One of them has no rain at all: a sprinkler, a burst pipe. So we cannot conclude that it rained.'),
  ]);
}

// ------------------------------------------------------------------ sandbox

const setLab: SandboxDef = {
  id: 'set-lab',
  title: 'Interval set lab',
  intro: R`Two sets of numbers, {{A=[a_1,a_2]|A from a 1 to a 2}} and {{B=[b_1,b_2]|B from b 1 to b 2}}. Move the endpoints and read off the union, the intersection, and whether one set is inside the other.`,
  sliders: [
    { id: 'a1', label: 'a₁', min: 0, max: 10, step: 0.5, init: 1, role: 'given' },
    { id: 'a2', label: 'a₂', min: 0, max: 10, step: 0.5, init: 5, role: 'given' },
    { id: 'b1', label: 'b₁', min: 0, max: 10, step: 0.5, init: 3, role: 'q-slope' },
    { id: 'b2', label: 'b₂', min: 0, max: 10, step: 0.5, init: 8, role: 'q-slope' },
  ],
  render: (s) => {
    const a1 = Math.min(s.values.a1, s.values.a2), a2 = Math.max(s.values.a1, s.values.a2);
    const b1 = Math.min(s.values.b1, s.values.b2), b2 = Math.max(s.values.b1, s.values.b2);
    const lo = Math.max(a1, b1), hi = Math.min(a2, b2);
    const meet = lo <= hi;
    const items: SceneItem[] = [
      { kind: 'segment', a: [0, 0], b: [10, 0], role: 'ink', width: 1.5 },
      { kind: 'segment', a: [a1, 1.6], b: [a2, 1.6], role: 'given', width: 6 },
      { kind: 'segment', a: [b1, 1], b: [b2, 1], role: 'q-slope', width: 6 },
    ];
    if (meet) items.push({ kind: 'segment', a: [lo, 0], b: [hi, 0], role: 'result', width: 9 });
    const fmtI = (x: number, y: number) => `[${fmt(x, 3)}, ${fmt(y, 3)}]`;
    return {
      scene: scene([-0.5, 10.5], [-1, 2.4], items, `A from ${a1} to ${a2}, B from ${b1} to ${b2}; intersection shown in green.`, { size: [640, 220], grid: false }),
      readouts: [
        { label: 'A ∩ B', value: meet ? fmtI(lo, hi) : '∅ (empty)', role: 'result' },
        { label: 'A ∪ B', value: meet ? fmtI(Math.min(a1, b1), Math.max(a2, b2)) : `${fmtI(a1, a2)} ∪ ${fmtI(b1, b2)}`, role: 'result' },
        { label: 'A ⊆ B ?', value: a1 >= b1 && a2 <= b2 ? 'yes' : 'no', role: a1 >= b1 && a2 <= b2 ? 'done' : 'error' },
        { label: 'B ⊆ A ?', value: b1 >= a1 && b2 <= a2 ? 'yes' : 'no', role: b1 >= a1 && b2 <= a2 ? 'done' : 'error' },
      ],
      note: meet ? undefined : 'The intervals don’t overlap: the intersection is the empty set, and the union is two separate pieces.',
    };
  },
  tryThis: ['Make the intersection empty. What does the union look like then?', 'Make A ⊆ B true. Check: in that case A ∩ B = A and A ∪ B = B.', 'Make A and B equal. Then both subset questions say yes: A ⊆ B and B ⊆ A together mean A = B.'],
};

// ------------------------------------------------------------------ topic

const hookScene: Scene = scene(
  [0, 10],
  [0, 4],
  [
    { kind: 'label', at: [0.3, 3.4], text: 'n² + n + 41', role: 'active', hand: true, size: 26 },
    { kind: 'label', at: [0.3, 2.6], text: 'n = 0 → 41 prime ✓    n = 1 → 43 prime ✓    n = 2 → 47 prime ✓', role: 'done', hand: true, size: 19 },
    { kind: 'label', at: [0.3, 1.9], text: 'n = 3 → 53 ✓   …   n = 38 → 1523 ✓    n = 39 → 1601 ✓', role: 'done', hand: true, size: 19 },
    { kind: 'label', at: [0.3, 0.9], text: 'n = 40 → ?', role: 'error', hand: true, size: 26 },
  ],
  'The polynomial n squared plus n plus 41 gives primes for n from 0 to 39. What happens at n equals 40?',
  { axes: false, grid: false, size: [640, 260] },
);

const topic: Topic = {
  id: 'f-logic',
  course: 'foundations',
  number: '0.6',
  title: 'Logic, sets and proof',
  blurb: 'Implication, quantifiers, induction; reading proofs.',
  icon: '∴',
  prereqs: ['f-algebra'],
  glossary: [
    { id: 'proposition', term: 'Proposition', def: 'A statement that is either true or false, such as "7 is prime" or "x > 2" once x is known.' },
    { id: 'implication', term: 'Implication', def: '{{P\\Rightarrow Q|P implies Q}}: "if P then Q". False only when P is true and Q is false.' },
    { id: 'contrapositive', term: 'Contrapositive', def: 'The contrapositive of {{P\\Rightarrow Q|P implies Q}} is {{\\lnot Q\\Rightarrow\\lnot P|not Q implies not P}}. It is logically equivalent to the original.' },
    { id: 'converse', term: 'Converse', def: 'The converse of {{P\\Rightarrow Q|P implies Q}} is {{Q\\Rightarrow P|Q implies P}}. It is a different statement and may be false.' },
    { id: 'quantifier', term: 'Quantifier', def: '"For all" ({{\\forall|for all}}) or "there exists" ({{\\exists|there exists}}). Negating a statement swaps them.' },
    { id: 'counterexample', term: 'Counterexample', def: 'One case where a "for all" statement fails. A single counterexample disproves it completely.' },
    { id: 'set', term: 'Set', def: 'A collection of distinct objects. {{x\\in A|x is in A}} means x is an element of A.' },
    { id: 'induction', term: 'Proof by induction', def: 'Proving P(n) for all whole numbers by showing P(1) (the base case) and that P(k) implies P(k+1) (the inductive step).' },
    { id: 'contradiction', term: 'Proof by contradiction', def: 'Assume the statement is false, and derive something impossible. Then the statement must be true.' },
    { id: 'invariant', term: 'Loop invariant', def: 'A statement that is true before a loop starts and stays true after every iteration. It is how proofs are applied to code.' },
  ],
  formulas: [
    { name: 'Implication', tex: R`P\Rightarrow Q\ \equiv\ \lnot P\lor Q`, say: 'P implies Q is equivalent to not P or Q' },
    { name: 'Contrapositive', tex: R`(P\Rightarrow Q)\ \equiv\ (\lnot Q\Rightarrow\lnot P)`, say: 'P implies Q is equivalent to not Q implies not P' },
    { name: 'De Morgan’s laws', tex: R`\lnot(P\land Q)\equiv\lnot P\lor\lnot Q,\quad \lnot(P\lor Q)\equiv\lnot P\land\lnot Q`, say: 'not P and Q is not P or not Q; not P or Q is not P and not Q' },
    { name: 'Negating quantifiers', tex: R`\lnot\,\forall x\,P(x)\equiv\exists x\,\lnot P(x),\quad \lnot\,\exists x\,P(x)\equiv\forall x\,\lnot P(x)`, say: 'not for all x P is there exists x with not P; not there exists x with P is for all x not P' },
    { name: 'Set operations', tex: R`A\cup B=\{x: x\in A\lor x\in B\},\quad A\cap B=\{x: x\in A\land x\in B\}`, say: 'A union B is the set of x in A or in B; A intersect B is the set of x in A and in B' },
    { name: 'Inclusion–exclusion', tex: R`|A\cup B|=|A|+|B|-|A\cap B|`, say: 'the size of A union B equals size of A plus size of B minus size of A intersect B' },
    { name: 'Induction', tex: R`P(1)\ \land\ \big(\forall k:\ P(k)\Rightarrow P(k+1)\big)\ \Rightarrow\ \forall n\ge1:\ P(n)`, say: 'if P of 1, and for every k P of k implies P of k plus 1, then P of n for every n at least 1' },
    { name: 'Sum of 1 to n', tex: R`1+2+\dots+n=\frac{n(n+1)}{2}`, say: '1 plus 2 plus up to n equals n times n plus 1, over 2' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'n² + n + 41 is prime for n = 0, 1, 2, … all the way to 39. Forty successes in a row. Is it always prime?',
      scene: hookScene,
      teaser: R`No. At {{n=40|n equals 40}} it gives {{40^2+40+41=1681=41^2|1681, which is 41 squared}}. Forty confirming examples proved nothing. Testing shows something works in the cases you tried; a proof shows it works in every case. This topic is about the difference, and about reading and writing proofs.`,
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
            { type: 'p', text: 'Every theorem in this course, from the quadratic formula to the convergence of a numerical method, is a proof. Logic and sets are the language proofs are written in, and also the language of conditions in code and of events in probability.' },
            { type: 'p', text: 'This topic needs only algebra (0.1). It prepares you to read the "why it’s true" sections of later topics, and the theorems that tell you when a numerical method can be trusted.' },
            { type: 'note', kind: 'compsci', text: 'Tests check finitely many cases. A convergence theorem covers all of them. Computational science needs both: proofs say what should happen, tests check that the code does it.' },
          ],
        },
        {
          id: 'statements',
          title: 'Statements and “implies”',
          blocks: [
            { type: 'p', text: R`A [[proposition]] is a statement that is true or false. Combine them with "and" ({{\land|and}}), "or" ({{\lor|or}}, inclusive: one or both) and "not" ({{\lnot|not}}).` },
            { type: 'p', text: R`The [[implication]] {{P\Rightarrow Q|P implies Q}} ("if P then Q") is a promise. It is broken only when P is true and Q is false. If P is false, the promise says nothing, so it counts as true.` },
            { type: 'eq', eq: { tex: R`P\Rightarrow Q\quad\text{is false only when}\quad P=\text{T},\ Q=\text{F}`, say: 'P implies Q is false only when P is true and Q is false', label: 'implication' } },
            { type: 'p', text: R`The [[contrapositive]] {{\lnot Q\Rightarrow\lnot P|not Q implies not P}} says the same thing: "if the ground is dry, it didn’t rain". The [[converse]] {{Q\Rightarrow P|Q implies P}} says something different: "if the ground is wet, it rained", which can be false.` },
            { type: 'note', kind: 'remember', text: R`"P if and only if Q", {{P\iff Q|P if and only if Q}}, means both {{P\Rightarrow Q|P implies Q}} and {{Q\Rightarrow P|Q implies P}}. Proving it takes two proofs, one in each direction.` },
          ],
        },
        {
          id: 'quantifiers',
          title: 'For all, there exists',
          blocks: [
            { type: 'p', text: R`[[quantifier|Quantifiers]] say how many cases a statement covers. "For every real {{x|x}}, {{x^2\ge0|x squared is at least zero}}" uses {{\forall|for all}}. "There is an {{x|x}} with {{x^2=2|x squared equals 2}}" uses {{\exists|there exists}}.` },
            { type: 'p', text: R`Negation swaps them. "Not every simulation converges" means "some simulation does not converge". To disprove a "for all", one [[counterexample]] is enough, as {{n=40|n equals 40}} showed.` },
            { type: 'eq', eq: { tex: R`\lnot\,\forall x\ P(x)\ \equiv\ \exists x\ \lnot P(x)`, say: 'not for all x, P of x, is the same as: there exists x with not P of x', label: 'negation' } },
            { type: 'note', kind: 'pitfall', text: R`Order of quantifiers matters. "For every {{x|x}} there is a {{y|y}} with {{y>x|y greater than x}}" is true. "There is a {{y|y}} with {{y>x|y greater than x}} for every {{x|x}}" claims a largest-of-all number, and is false.` },
          ],
        },
        {
          id: 'sets',
          title: 'Sets',
          blocks: [
            { type: 'p', text: R`A [[set]] is a collection of distinct objects. {{x\in A|x is in A}} means x is an element of A. {{A\subseteq B|A is a subset of B}} means every element of A is also in B.` },
            { type: 'p', text: R`Set operations mirror logic. The union {{A\cup B|A union B}} holds elements in A **or** B. The intersection {{A\cap B|A intersect B}} holds those in A **and** B. The difference {{A\setminus B|A minus B}} holds those in A **and not** B. {{\varnothing|the empty set}} has nothing.` },
            { type: 'p', text: R`Intervals are sets of real numbers: {{[a,b]|the closed interval a b}} includes its endpoints, {{(a,b)|the open interval a b}} doesn’t. Set-builder notation describes a set by a property: {{\{x\in\mathbb R:\ x^2<4\}=(-2,2)|the set of real x with x squared less than 4 is the interval from minus 2 to 2}}.` },
          ],
        },
        {
          id: 'direct',
          title: 'Why proofs work: direct proof',
          blocks: [
            { type: 'p', text: 'A proof is a chain of implications, each justified by a definition, an earlier result or algebra. If every link holds, the conclusion holds in every case the hypotheses cover.' },
            { type: 'p', text: R`**Claim:** the sum of two even numbers is even. **Proof:** even means "twice an integer", so write them as {{2a|2 a}} and {{2b|2 b}}. Their sum is {{2a+2b=2(a+b)|2 a plus 2 b, which is 2 times a plus b}}, twice an integer. So it is even. ∎` },
            { type: 'p', text: R`**Contrapositive proof.** Claim: if {{n^2|n squared}} is even then {{n|n}} is even. Prove instead: if {{n|n}} is odd then {{n^2|n squared}} is odd. Odd means {{n=2k+1|n equals 2 k plus 1}}, so {{n^2=4k^2+4k+1=2(2k^2+2k)+1|n squared is 2 times 2 k squared plus 2 k, plus 1}}: odd. ∎` },
            { type: 'note', kind: 'intuition', text: 'Use a definition to turn words into algebra, do the algebra, then turn the result back into words. Most short proofs are exactly that.' },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three animations: the truth table of "implies", set operations on intervals, and induction as falling dominoes.', anims: [implicationAnim(), intervalAnim(), dominoAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-impl', prompt: R`When is {{P\Rightarrow Q|P implies Q}} false?`, answer: { kind: 'mc', options: ['When P is false', 'When Q is true', 'When P is true and Q is false', 'Never'], correct: 2 }, explain: 'A promise "if P then Q" is broken only when P happens and Q does not.' },
        { id: 'rc-neg', prompt: 'What is the negation of "every simulation in the test suite converges"?', answer: { kind: 'mc', options: ['No simulation converges', 'At least one simulation does not converge', 'Every simulation diverges', 'Some simulations converge'], correct: 1 }, explain: R`{{\lnot\forall|not for all}} becomes {{\exists\lnot|there exists, not}}: one failure is enough.` },
        { id: 'rc-inter', prompt: R`For {{A=[1,5]|A from 1 to 5}} and {{B=[3,8]|B from 3 to 8}}, what is the length of {{A\cap B|A intersect B}}?`, answer: { kind: 'numeric', value: 2, absTol: 1e-12 }, explain: R`{{A\cap B=[3,5]|the intersection is from 3 to 5}}, of length 2.` },
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
          id: 'induction',
          title: 'Proof by induction',
          blocks: [
            { type: 'p', text: R`To prove {{P(n)|P of n}} for every whole number {{n\ge1|n at least 1}}, [[induction]] needs two things. The **base case**: {{P(1)|P of 1}} is true. The **inductive step**: for every {{k|k}}, if {{P(k)|P of k}} is true then {{P(k+1)|P of k plus 1}} is true.` },
            { type: 'p', text: R`Like dominoes: the first falls, and each one knocks over the next, so all fall. Two finite arguments cover infinitely many cases. You will do the classic example, {{1+2+\dots+n=\tfrac{n(n+1)}2|1 plus 2 up to n equals n times n plus 1 over 2}}, as the worked example.` },
            { type: 'note', kind: 'pitfall', text: 'Both parts are essential. "If P(k) then P(k + 1)" is true for the false claim "n = n + 1", whose base case fails. And a base case alone proves only one domino.' },
          ],
        },
        {
          id: 'contradiction',
          title: 'Proof by contradiction',
          blocks: [
            { type: 'p', text: R`[[contradiction|Proof by contradiction]]: assume the claim is false and derive something impossible. The classic: {{\sqrt2|root 2}} is not a fraction.` },
            { type: 'p', text: R`Suppose {{\sqrt2=p/q|root 2 equals p over q}} in lowest terms. Then {{p^2=2q^2|p squared equals 2 q squared}}, so {{p^2|p squared}} is even, so {{p|p}} is even (proved above): {{p=2r|p equals 2 r}}. Then {{4r^2=2q^2|4 r squared equals 2 q squared}}, so {{q^2=2r^2|q squared equals 2 r squared}} and {{q|q}} is even too.` },
            { type: 'p', text: R`But then {{p/q|p over q}} was not in lowest terms: both are even. The assumption led to a contradiction, so {{\sqrt2|root 2}} is irrational. ∎` },
          ],
        },
        {
          id: 'reading',
          title: 'How to read a proof',
          blocks: [
            {
              type: 'list',
              items: [
                'Find the claim and its hypotheses. What exactly is assumed, and what must be shown?',
                'Name the strategy: direct, contrapositive, contradiction, induction, or counterexample.',
                'Try a small case yourself before reading the general argument.',
                'Check each line: which definition, earlier result or algebra step justifies it?',
                'Ask where each hypothesis is used. If one is never used, either it isn’t needed or you have missed something.',
              ],
            },
            { type: 'note', kind: 'remember', text: R`"Necessary" and "sufficient": P is sufficient for Q if {{P\Rightarrow Q|P implies Q}}; P is necessary for Q if {{Q\Rightarrow P|Q implies P}}. Being differentiable is sufficient for continuity, and continuity is necessary for differentiability.` },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: setLab },
    {
      id: 'predict',
      kind: 'predict',
      question: 'You know: "if it rains, the ground is wet". You see that the ground is wet. Can you conclude that it rained?',
      answer: { kind: 'mc', options: ['Yes, certainly', 'Not necessarily', 'No, it certainly did not rain', 'Only at night'], correct: 1 },
      reveal: affirmReveal(),
      explain: R`Concluding P from {{P\Rightarrow Q|P implies Q}} and Q is a classic fallacy called affirming the consequent. It confuses a statement with its converse. Valid: from {{P\Rightarrow Q|P implies Q}} and "not Q", conclude "not P" (the contrapositive).`,
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
            { type: 'p', text: "Proofs about real numbers don’t automatically hold for floating-point numbers. Addition of reals is associative; addition of doubles is not: `(0.1 + 0.2) + 0.3` gives 0.6000000000000001, but `0.1 + (0.2 + 0.3)` gives 0.6.".replace(/\\`/g, '`') },
            { type: 'p', text: 'So numerical analysis proves things about the computed numbers themselves: bounds on rounding error, on how much error can grow, on when a method converges. Those proofs are what make results trustworthy.' },
            { type: 'p', text: R`Proofs also apply to code through [[invariant|loop invariants]]. In bisection the invariant "the root lies in [lo, hi]" holds before the loop and after each halving. When the loop ends the interval is tiny, so the root is pinned down.` },
            { type: 'note', kind: 'compsci', text: 'Checking a statement for every case is often impossible: there are about 1.8 × 10¹⁹ doubles. Property-based testing tries thousands of random cases; formal verification proves the property for all of them.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'code', code: 'from itertools import product\n\n# truth table: P implies Q is the same as (not P) or Q\nfor P, Q in product([True, False], repeat=2):\n    print(P, Q, (not P) or Q)\n\nxs = range(0, 41)\nprint(all((n*n + n + 41) > 1 for n in xs))   # for all: True\nprint(any(n*n + n + 41 == 41**2 for n in xs))  # there exists: True (n = 40)\n\nA, B = {1, 2, 3, 4}, {3, 4, 5}\nprint(A | B, A & B, A - B)   # union, intersection, difference', say: 'A truth table with itertools product: P implies Q computed as not P or Q. all is "for all" over a finite set and any is "there exists". Python sets use the bar for union, ampersand for intersection, minus for difference.' },
            { type: 'code', code: 'print((0.1 + 0.2) + 0.3)   # 0.6000000000000001\nprint(0.1 + (0.2 + 0.3))   # 0.6', say: 'In floating point, adding in a different order can change the result.' },
            { type: 'note', kind: 'python', text: '`all(...)` and `any(...)` stop early: `all` at the first False (a counterexample), `any` at the first True (a witness). They are ∀ and ∃ for finite collections.' },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                'Treating examples as a proof of a "for all" statement.',
                'Confusing an implication with its converse.',
                R`Negating "for all" as "for none" instead of "there exists one that doesn’t".`,
                'Doing the inductive step but forgetting the base case.',
                'Circular reasoning: using the claim to prove itself.',
                'Reading "or" as exclusive: in logic, P or Q includes both.',
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: 'Convergence theorems tell you when a numerical method works and how fast: "if the function is smooth and the step is small enough, the error is at most C·h²". Choosing a method means checking its hypotheses.' },
            { type: 'p', text: 'Formal verification uses machine-checked proofs: the seL4 operating-system kernel and the CompCert C compiler have been proved correct. Chip designers use logic (SAT) solvers to check circuits.' },
            { type: 'p', text: 'Probability (Course 4) is built on sets: events are sets of outcomes, "and" is intersection, "or" is union, and inclusion–exclusion counts overlaps.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                R`{{P\Rightarrow Q|P implies Q}} is false only when P is true and Q false; its contrapositive is equivalent, its converse is not.`,
                R`Negation swaps {{\forall|for all}} and {{\exists|there exists}}; one counterexample disproves a "for all".`,
                'Set operations mirror logic: union is or, intersection is and, difference is and-not.',
                'Proof strategies: direct, contrapositive, contradiction, induction (base case plus step).',
                'Testing checks cases; proofs cover all of them. Floating point breaks some real-number laws.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: R`Prove by induction that {{1+2+\dots+n=\frac{n(n+1)}{2}|1 plus 2 up to n equals n times n plus 1 over 2}} for every {{n\ge1|n at least 1}}.`,
      lines: [
        { tex: R`P(n):\quad 1+2+\dots+n=\frac{n(n+1)}{2}`, say: 'P of n: 1 plus 2 up to n equals n times n plus 1 over 2', why: 'Named the statement.' },
        { tex: R`P(1):\quad 1=\frac{1\cdot2}{2}\ \checkmark`, say: 'P of 1: 1 equals 1 times 2 over 2, true', why: 'Base case.' },
        { tex: R`\text{Assume }1+\dots+k=\frac{k(k+1)}{2}`, say: 'assume 1 plus up to k equals k times k plus 1 over 2', why: 'Inductive hypothesis: P(k) is true for some k ≥ 1.' },
        { tex: R`1+\dots+k+(k+1)=\frac{k(k+1)}{2}+(k+1)`, say: '1 plus up to k plus k plus 1 equals k times k plus 1 over 2, plus k plus 1', why: 'Added the next term to both sides and used the hypothesis.' },
        { tex: R`=\frac{(k+1)(k+2)}{2}`, say: 'equals k plus 1 times k plus 2, over 2', why: 'Factored out (k + 1): (k+1)(k/2 + 1) = (k+1)(k+2)/2.' },
        { tex: R`\text{This is }P(k+1).\ \ \blacksquare`, say: 'this is P of k plus 1, which completes the proof', why: 'The formula with n = k + 1. Base case plus step: true for every n.' },
      ],
      takeaway: 'In the inductive step, write down the target P(k + 1) first. Then start from the left side of P(k + 1), find P(k) inside it, use the hypothesis, and simplify towards the target.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-odds',
          prompt: R`The sum of the first {{n|n}} odd numbers is {{n^2|n squared}} (you could prove it by induction). Use it: what is {{1+3+5+\dots+199|1 plus 3 plus 5 and so on up to 199}}?`,
          answer: { kind: 'numeric', value: 10000, absTol: 1e-9 },
          hints: ['How many odd numbers are there from 1 to 199?', R`The {{k|k}}-th odd number is {{2k-1|2 k minus 1}}; {{2k-1=199|2 k minus 1 equals 199}} gives {{k=100|k equals 100}}.`, R`So the sum is {{100^2|100 squared}}.`],
          solution: [
            { tex: R`2k-1=199\Rightarrow k=100`, say: '2 k minus 1 equals 199, so k equals 100', why: '199 is the 100th odd number.' },
            { tex: R`1+3+\dots+199=100^2=10\,000`, say: 'the sum is 100 squared, 10 000', why: 'Applied the formula with n = 100.' },
          ],
          solutionFinal: '10000',
          truth: 'Sum(2*k - 1, (k, 1, 100)).doit()',
        },
        {
          id: 'yt-contra',
          prompt: R`Which statement is the contrapositive of "if {{n^2|n squared}} is even, then {{n|n}} is even"?`,
          answer: { kind: 'mc', options: ['If n is even, then n² is even', 'If n is odd, then n² is odd', 'If n² is odd, then n is odd', 'n² is even if and only if n is even'], correct: 1 },
          hints: ['The contrapositive of P ⇒ Q is not Q ⇒ not P.', 'Here P is "n² is even" and Q is "n is even".', '"Not even" means odd, for whole numbers.'],
          solution: [{ tex: R`\lnot Q\Rightarrow\lnot P:\ n\ \text{odd}\Rightarrow n^2\ \text{odd}`, say: 'not Q implies not P: n odd implies n squared odd', why: 'Swapped and negated both parts.' }],
          solutionFinal: '0',
        },
        {
          id: 'yt-negate',
          prompt: R`Negate: "for every {{\varepsilon>0|epsilon greater than zero}} there is an {{N|N}} such that the error is below {{\varepsilon|epsilon}}."`,
          answer: { kind: 'mc', options: ['For every ε > 0, no N makes the error below ε', 'There is an ε > 0 such that for every N the error is not below ε', 'There is an N such that the error is above every ε', 'For some ε, some N makes the error at least ε'], correct: 1 },
          hints: ['Negate one quantifier at a time, from the left.', '"For every ε" becomes "there is an ε"; "there is an N" becomes "for every N".', 'The final condition flips: "below ε" becomes "not below ε".'],
          solution: [{ tex: R`\exists\varepsilon>0\ \forall N:\ \text{error}\ \ge\varepsilon`, say: 'there exists epsilon greater than zero such that for all N, the error is at least epsilon', why: 'Each quantifier swaps, and the inner statement is negated. This is what "does not converge" means.' }],
          solutionFinal: '0',
        },
        {
          id: 'yt-sqrt2',
          prompt: R`Put the steps of the proof that {{\sqrt2|root 2}} is irrational in order.`,
          answer: {
            kind: 'order',
            steps: [
              R`Assume {{\sqrt2=p/q|root 2 equals p over q}} with the fraction in lowest terms.`,
              R`Square: {{p^2=2q^2|p squared equals 2 q squared}}, so {{p^2|p squared}} is even, so {{p|p}} is even.`,
              R`Write {{p=2r|p equals 2 r}}: then {{q^2=2r^2|q squared equals 2 r squared}}, so {{q|q}} is even.`,
              'Both p and q are even, so p/q was not in lowest terms: a contradiction.',
              R`Therefore {{\sqrt2|root 2}} is not a fraction.`,
            ],
          },
          hints: ['A proof by contradiction starts with the opposite assumption.', 'You must show p is even before you can write p = 2r.', 'The contradiction comes from "lowest terms".'],
          solution: [
            { tex: R`\sqrt2=\tfrac pq\Rightarrow p^2=2q^2\Rightarrow p\ \text{even}`, say: 'root 2 equals p over q, so p squared equals 2 q squared, so p is even', why: 'Assumption, squaring, and the contrapositive result proved earlier.' },
            { tex: R`p=2r\Rightarrow q^2=2r^2\Rightarrow q\ \text{even}`, say: 'p equals 2 r, so q squared equals 2 r squared, so q is even', why: 'Substituted and divided by 2.' },
            { tex: R`\text{contradiction}\Rightarrow\sqrt2\notin\mathbb{Q}`, say: 'contradiction, so root 2 is not rational', why: 'Both even contradicts lowest terms.' },
          ],
          solutionFinal: 'sqrt(2)',
          truth: 'sqrt(2)',
        },
        {
          id: 'yt-incl',
          prompt: R`In a set of 50 simulation runs, 30 hit the time limit, 20 produced NaN values, and 8 did both. How many runs had at least one of the two problems?`,
          answer: { kind: 'numeric', value: 42, absTol: 1e-9 },
          hints: ['"At least one" is a union.', R`Adding 30 and 20 counts the 8 runs with both problems twice.`, R`{{|A\cup B|=|A|+|B|-|A\cap B||the size of the union is size of A plus size of B minus the overlap}}.`],
          solution: [{ tex: R`|A\cup B|=30+20-8=42`, say: 'the size of A union B equals 30 plus 20 minus 8, which is 42', why: 'Inclusion–exclusion: subtract the overlap once.' }],
          solutionFinal: '42',
          truth: '30 + 20 - 8',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-truth',
        title: 'Truth tables by brute force',
        prompt: 'Write `truth_table(f, n)` that returns a list of `(inputs, output)` pairs for a Boolean function `f` of `n` arguments, over all 2ⁿ combinations (use `itertools.product`). Then `equivalent(f, g, n)` returns `True` when `f` and `g` agree on every input. The tests check the contrapositive, the converse and De Morgan’s laws.',
        starter: 'from itertools import product\n\ndef truth_table(f, n):\n    return []\n\ndef equivalent(f, g, n):\n    return True\n',
        solution: 'from itertools import product\n\ndef truth_table(f, n):\n    return [(xs, f(*xs)) for xs in product([True, False], repeat=n)]\n\ndef equivalent(f, g, n):\n    return all(f(*xs) == g(*xs) for xs in product([True, False], repeat=n))\n',
        tests: [
          'implies = lambda p, q: (not p) or q',
          'def test_table_size():',
          '    t = truth_table(lambda p, q, r: p and q, 3)',
          '    assert len(t) == 8 and sum(out for _, out in t) == 2',
          'def test_contrapositive_equivalent():',
          '    assert equivalent(lambda p, q: implies(p, q), lambda p, q: implies(not q, not p), 2)',
          'def test_converse_not_equivalent():',
          '    assert not equivalent(lambda p, q: implies(p, q), lambda p, q: implies(q, p), 2)',
          'def test_de_morgan():',
          '    assert equivalent(lambda p, q: not (p and q), lambda p, q: (not p) or (not q), 2)',
        ].join('\n'),
        hints: ['itertools.product([True, False], repeat=n) yields every combination of n truth values.', 'Call f(*xs) to pass a tuple as separate arguments.', 'equivalent: all(f(*xs) == g(*xs) for xs in …).'],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: 'On a finite set, "for all" and "there exists" are Python built-ins. Fill the gaps, then use them to find where n² + n + 41 stops being prime.',
      template:
        'def forall(xs, P):\n    return ⟦a⟧(P(x) for x in xs)\n\ndef exists(xs, P):\n    return ⟦b⟧(P(x) for x in xs)\n\ndef is_prime(m):\n    return m > 1 and all(m % d for d in range(2, int(m**0.5) + 1))\n\nok_below_40 = forall(range(40), lambda n: is_prime(n*n + n + 41))\nfails_somewhere = exists(range(41), lambda n: not is_prime(n*n + n + 41))\n',
      blanks: [
        { id: 'a', answers: ['all'], check: 'exact', hint: 'True only if every case is true.' },
        { id: 'b', answers: ['any'], check: 'exact', hint: 'True if at least one case is true.' },
      ],
      tests: ['def test_first_forty_are_prime():', '    assert ok_below_40 is True', 'def test_forty_one_values_fail():', '    assert fails_somewhere is True', 'def test_empty_set():', '    assert forall([], lambda x: False) is True and exists([], lambda x: True) is False'].join('\n'),
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Numerical analysis', title: 'Convergence theorems', text: 'Each method comes with a theorem saying when it works: Newton’s method converges quadratically near a simple root, for example. Checking the hypotheses tells you whether to trust the output.' },
        { field: 'Software', title: 'Verified systems', text: 'The seL4 microkernel and the CompCert C compiler come with machine-checked proofs that they behave as specified, used where failures are unacceptable.' },
        { field: 'Hardware', title: 'Logic solvers for chips', text: 'Processor designs are checked with SAT and SMT solvers, which decide huge logic formulas: an industrial use of truth tables far too big to write out.' },
        { field: 'Probability and data', title: 'Events are sets', text: 'An event is a set of outcomes, "and" is intersection and "or" is union. Database queries are set operations on rows, too.' },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-implies',
          title: 'Implies',
          difficulty: 'easy',
          prompt: 'Write `implies(p, q)` for Booleans `p`, `q`.',
          starter: 'def implies(p, q):\n    return p and q\n',
          solution: 'def implies(p, q):\n    return (not p) or q\n',
          tests: ['def test_table():', '    assert implies(True, True) and not implies(True, False)', '    assert implies(False, True) and implies(False, False)'].join('\n'),
          hints: ['P ⇒ Q is false only when P is true and Q is false.', 'Equivalently: not P, or Q.', 'return (not p) or q'],
        },
        {
          id: 'pb-counter',
          title: 'Find a counterexample',
          difficulty: 'easy',
          prompt: 'Write `first_counterexample(P, xs)` returning the first `x` in `xs` for which `P(x)` is false, or `None` if there is none.',
          starter: 'def first_counterexample(P, xs):\n    pass\n',
          solution: 'def first_counterexample(P, xs):\n    for x in xs:\n        if not P(x):\n            return x\n    return None\n',
          tests: ['def test_found():', '    assert first_counterexample(lambda n: n * n < 50, range(100)) == 8', 'def test_none():', '    assert first_counterexample(lambda n: n >= 0, range(10)) is None'].join('\n'),
          hints: ['Loop over xs in order.', 'Return as soon as P(x) is False.', 'After the loop, return None.'],
        },
        {
          id: 'pb-euler',
          title: 'Where does Euler’s polynomial fail?',
          difficulty: 'medium',
          prompt: 'Write `is_prime(m)` (trial division up to √m) and `first_composite(a, b)` returning the smallest `n ≥ 0` for which n² + a·n + b is **not** prime. For a = 1, b = 41 it should return 40.',
          starter: 'def is_prime(m):\n    pass\n\ndef first_composite(a, b):\n    pass\n',
          solution: 'def is_prime(m):\n    if m < 2:\n        return False\n    d = 2\n    while d * d <= m:\n        if m % d == 0:\n            return False\n        d += 1\n    return True\n\ndef first_composite(a, b):\n    n = 0\n    while is_prime(n * n + a * n + b):\n        n += 1\n    return n\n',
          tests: ['def test_primes():', '    assert [m for m in range(20) if is_prime(m)] == [2, 3, 5, 7, 11, 13, 17, 19]', 'def test_euler():', '    assert first_composite(1, 41) == 40', 'def test_other():', '    assert first_composite(0, 2) == 2   # 2 and 3 are prime, 6 is not'].join('\n'),
          hints: ['A divisor larger than √m would pair with one smaller than √m, so you only need to check d with d·d ≤ m.', '0 and 1 are not prime.', 'first_composite: increase n while the value is prime; return n when it stops.'],
        },
      ],
      outside: [
        { source: 'Book of Proof (Richard Hammack, free online)', item: 'Chapters on Sets, Logic, Direct Proof, Contrapositive Proof, Proof by Contradiction and Mathematical Induction, with exercises', why: 'A gentle, complete introduction to reading and writing proofs.' },
        { source: 'MIT OpenCourseWare', item: '6.042J Mathematics for Computer Science: proofs and induction units', why: 'Lectures and problem sets aimed at computing students.' },
        { source: 'Project Euler', item: 'Problem 27 "Quadratic primes"', why: 'A computational follow-up to Euler’s n² + n + 41.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: what is the difference between testing and proving, what makes an implication false, and how does induction cover infinitely many cases? Use the words "counterexample", "converse" and "base case".',
      quiz: [
        { id: 'qz-impl', prompt: R`If "P implies Q" is true and Q is false, what do you know about P?`, answer: { kind: 'mc', options: ['P is true', 'P is false', 'Nothing', 'Q must be true after all'], correct: 1 }, explain: 'The contrapositive: not Q implies not P.' },
        { id: 'qz-union', prompt: R`{{A=\{1,2,3,4\}|A is 1, 2, 3, 4}} and {{B=\{3,4,5\}|B is 3, 4, 5}}. How many elements does {{A\cup B|A union B}} have?`, answer: { kind: 'numeric', value: 5, absTol: 1e-9 }, explain: R`{{\{1,2,3,4,5\}|1, 2, 3, 4, 5}}: five elements; 3 and 4 are counted once.` },
        { id: 'qz-ind', prompt: 'An induction proof shows the inductive step but not the base case. What has it proved?', answer: { kind: 'mc', options: ['The statement for all n', 'The statement for n = 1 only', 'Nothing yet: no domino has been pushed', 'The statement for even n'], correct: 2 }, explain: 'Without a base case the chain never starts. The false claim n = n + 1 has a valid inductive step.' },
      ],
    },
  ],
};

export default topic;
