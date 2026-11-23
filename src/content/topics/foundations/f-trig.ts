/**
 * Foundations 0.4 — Trigonometry and the unit circle.
 */
import type { AnimationDef, Pt, SandboxDef, Scene, SceneItem, Topic } from '../../types';
import { anim, fmt, frame, range, scene } from '../../lib';

const R = String.raw;
const TAU = 2 * Math.PI;

const circlePts = (cx: number, cy: number, r: number, a0 = 0, a1 = TAU, n = 120): Pt[] =>
  range(a0, a1, n).map((t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)] as Pt);

// ------------------------------------------------------------------ animations

/** A point going round the unit circle traces out the sine wave. */
function circleToWave(): AnimationDef {
  const cx = -2.2;
  const thetas = range(0, TAU, 9);
  return anim(
    'circle-wave',
    'The unit circle draws the sine wave',
    thetas.map((th, k) => {
      const p: Pt = [cx + Math.cos(th), Math.sin(th)];
      const items: SceneItem[] = [
        { kind: 'polyline', points: circlePts(cx, 0, 1), role: 'muted', width: 2 },
        { kind: 'segment', a: [cx, 0], b: p, role: 'q-x', width: 2.5 },
        { kind: 'segment', a: [p[0], 0], b: p, role: 'q-f', width: 3 },
        { kind: 'point', at: p, role: 'active', r: 6 },
        { kind: 'fn', f: Math.sin, from: 0, to: th, role: 'q-f', width: 3.5 },
        { kind: 'segment', a: p, b: [th, Math.sin(th)], role: 'muted', dash: true, width: 1.2 },
        { kind: 'point', at: [th, Math.sin(th)], role: 'q-f', r: 5 },
      ];
      const deg = Math.round((th * 180) / Math.PI);
      const cap =
        k === 0
          ? 'A point starts at angle 0 on the unit circle. Its height, the purple line, is the sine of the angle: 0.'
          : k === 2
            ? 'At a quarter turn, pi over 2 radians or 90 degrees, the height is 1: the top of the wave.'
            : k === 4
              ? 'Half a turn, pi radians: back to height 0, now going down.'
              : k === 8
                ? 'One full turn, 2 pi radians: the height has traced one complete sine wave. Keep turning and it repeats.'
                : `Angle ${fmt(th, 3)} radians (${deg} degrees): height ${fmt(Math.sin(th), 3)}.`;
      return frame(scene([-3.5, 6.6], [-1.6, 1.6], items, `Unit circle with the point at angle ${deg} degrees and the sine curve drawn up to that angle.`, { size: [640, 220] }), cap);
    }),
  );
}

/** One radian = the angle whose arc equals the radius. */
function radianAnim(): AnimationDef {
  const steps = [0, 1, 2, 3, Math.PI, TAU];
  return anim(
    'radian',
    'What a radian is',
    steps.map((a, k) => {
      const items: SceneItem[] = [
        { kind: 'polyline', points: circlePts(0, 0, 1), role: 'muted', width: 1.5 },
        { kind: 'segment', a: [0, 0], b: [1, 0], role: 'q-x', width: 3 },
        { kind: 'label', at: [0.5, -0.2], text: 'r', role: 'q-x', anchor: 'middle', hand: true, size: 22 },
      ];
      if (a > 0) {
        items.push({ kind: 'polyline', points: circlePts(0, 0, 1, 0, a, 80), role: 'q-slope', width: 5 });
        items.push({ kind: 'segment', a: [0, 0], b: [Math.cos(a), Math.sin(a)], role: 'q-x', width: 2 });
      }
      const cap = [
        'Take a circle of radius r.',
        'Lay one radius-length of string along the circle. The angle it spans is one radian, about 57.3 degrees.',
        'Two radius-lengths: two radians.',
        'Three radius-lengths: three radians, just short of half a turn.',
        'Half a turn needs pi radius-lengths, about 3.14: so 180 degrees is pi radians.',
        'A full turn is 2 pi radians, because the circumference is 2 pi r.',
      ][k];
      return frame(scene([-1.5, 1.5], [-1.3, 1.3], items, `Unit circle with an arc of length ${fmt(a, 3)} radii.`, { size: [420, 360], grid: false }), cap, k > 0 ? { tex: R`\theta=\frac{\Q{slope}{s}}{\Q{x}{r}}=${fmt(a, 3)}`, say: `theta equals arc length over radius, ${fmt(a, 3)}` } : undefined);
    }),
  );
}

/** Polar coordinates: a point as (distance, angle). */
function polarAnim(): AnimationDef {
  const pts: [number, number][] = [[2, Math.PI / 6], [2, (2 * Math.PI) / 3], [1.5, (5 * Math.PI) / 4], [2.5, -Math.PI / 4]];
  return anim(
    'polar',
    'Polar coordinates',
    pts.map(([r, th]) => {
      const p: Pt = [r * Math.cos(th), r * Math.sin(th)];
      const items: SceneItem[] = [
        { kind: 'polyline', points: circlePts(0, 0, r), role: 'muted', width: 1.2, dash: true },
        { kind: 'segment', a: [0, 0], b: p, role: 'q-x', width: 3, arrow: true },
        { kind: 'polyline', points: circlePts(0, 0, 0.5, Math.min(0, th), Math.max(0, th), 40), role: 'q-slope', width: 3 },
        { kind: 'segment', a: [p[0], 0], b: p, role: 'q-f', dash: true },
        { kind: 'segment', a: [0, 0], b: [p[0], 0], role: 'given', width: 3 },
        { kind: 'point', at: p, role: 'active', label: `(${fmt(p[0], 3)}, ${fmt(p[1], 3)})`, labelDir: p[0] >= 0 ? 'ne' : 'nw' },
      ];
      const deg = Math.round((th * 180) / Math.PI);
      return frame(
        scene([-3, 3], [-3, 3], items, `Point at distance ${r} and angle ${deg} degrees.`, { size: [440, 440] }),
        `Distance ${r}, angle ${deg} degrees. Then x is r cos theta, ${fmt(p[0], 3)}, and y is r sine theta, ${fmt(p[1], 3)}.`,
        { tex: R`(x,y)=(r\cos\theta,\ r\sin\theta)=(${fmt(p[0], 3)},\ ${fmt(p[1], 3)})`, say: `x, y equals r cos theta, r sine theta, which is ${fmt(p[0], 3)}, ${fmt(p[1], 3)}` },
      );
    }),
  );
}

function atanReveal(): AnimationDef {
  const items0: SceneItem[] = [{ kind: 'point', at: [-1, -1], role: 'active', label: '(−1, −1)', labelDir: 'sw' }];
  const sc = (items: SceneItem[], alt: string): Scene => scene([-2, 2], [-2, 2], items, alt, { size: [420, 420] });
  return anim('atan2', 'arctan(y/x) loses the quadrant', [
    frame(sc(items0, 'The point minus 1, minus 1 in the third quadrant.'), 'The point minus 1, minus 1 points down and to the left: an angle of minus 135 degrees.'),
    frame(sc([...items0, { kind: 'segment', a: [0, 0], b: [1.4, 1.4], role: 'error', width: 3, arrow: true }, { kind: 'label', at: [0.3, 1.6], text: 'arctan(1) = 45°', role: 'error', hand: true, size: 20 }], 'arctan of y over x points to the first quadrant.'), 'But y over x is minus 1 over minus 1, which is 1, and arctan of 1 is 45 degrees: the opposite direction. The two minus signs cancelled.'),
    frame(sc([...items0, { kind: 'segment', a: [0, 0], b: [-1, -1], role: 'done', width: 3, arrow: true }, { kind: 'label', at: [-1.9, -1.6], text: 'atan2(−1, −1) = −135°', role: 'done', hand: true, size: 20 }], 'atan2 points to the correct quadrant.'), 'atan2 of y and x receives both signs separately, so it returns the right angle: minus 135 degrees, minus 3 pi over 4.'),
  ]);
}

// ------------------------------------------------------------------ sandbox

const waveLab: SandboxDef = {
  id: 'wave-lab',
  title: 'Oscillation lab',
  intro: R`{{y=A\sin(\omega t+\varphi)|y equals A sine of omega t plus phi}}: a point going round a circle of radius {{A|A}} at angular speed {{\omega|omega}}, starting at angle {{\varphi|phi}}. Move the time slider and watch the point and the wave stay in step.`,
  sliders: [
    { id: 'A', label: 'amplitude A', min: 0.2, max: 2, step: 0.05, init: 1, role: 'q-f' },
    { id: 'w', label: 'angular frequency ω (rad/s)', min: 0.5, max: 4, step: 0.05, init: 1, role: 'q-slope' },
    { id: 'phi', label: 'phase φ (rad)', min: -3.14, max: 3.14, step: 0.01, init: 0, role: 'q-x' },
    { id: 't', label: 'time t (s)', min: 0, max: 6.28, step: 0.01, init: 1, role: 'q-t' },
  ],
  render: (s) => {
    const { A, w, phi, t } = s.values;
    const cx = -3;
    const th = w * t + phi;
    const p: Pt = [cx + A * Math.cos(th), A * Math.sin(th)];
    const y = (u: number) => A * Math.sin(w * u + phi);
    const items: SceneItem[] = [
      { kind: 'polyline', points: circlePts(cx, 0, A), role: 'muted', width: 1.5 },
      { kind: 'segment', a: [cx, 0], b: p, role: 'q-x', width: 2.5 },
      { kind: 'point', at: p, role: 'active', r: 6 },
      { kind: 'fn', f: y, from: 0, to: 6.28, role: 'q-f', width: 3 },
      { kind: 'segment', a: p, b: [t, y(t)], role: 'muted', dash: true, width: 1.2 },
      { kind: 'point', at: [t, y(t)], role: 'q-f', r: 6 },
      { kind: 'vline', x: 0, role: 'muted' },
    ];
    return {
      scene: scene([-5.2, 6.4], [-2.3, 2.3], items, `Circle of radius ${A} with the point at angle ${fmt(th, 3)}, and the wave A sine of omega t plus phi.`, { size: [640, 260] }),
      readouts: [
        { label: 'angle ωt + φ', value: `${fmt(th, 3)} rad`, role: 'q-x' },
        { label: 'y', value: fmt(y(t), 4), role: 'q-f' },
        { label: 'period 2π/ω', value: `${fmt(TAU / w, 4)} s`, role: 'result' },
        { label: 'frequency ω/2π', value: `${fmt(w / TAU, 4)} Hz`, role: 'result' },
      ],
    };
  },
  tryThis: [
    R`Double {{\omega|omega}}. The period halves: two waves fit where one did.`,
    R`Set {{\varphi=\pi/2\approx1.57|phi to pi over 2, about 1.57}}. The wave becomes a cosine: {{\sin(t+\pi/2)=\cos t|sine of t plus pi over 2 equals cos t}}.`,
    R`Set {{\varphi|phi}} to {{\pi|pi}}. The wave is upside down. Why does a half-turn start do that?`,
  ],
};

// ------------------------------------------------------------------ topic

const hookScene: Scene = scene(
  [-25, 25],
  [-1, 45],
  [
    { kind: 'polyline', points: circlePts(0, 22, 20), role: 'muted', width: 2.5 },
    { kind: 'segment', a: [-3, 0], b: [0, 22], role: 'muted', width: 2 },
    { kind: 'segment', a: [3, 0], b: [0, 22], role: 'muted', width: 2 },
    { kind: 'point', at: [20 * Math.sin(1.309), 22 - 20 * Math.cos(1.309)], role: 'active', r: 9, label: 't = 25 s', labelDir: 'e' },
    { kind: 'point', at: [0, 2], role: 'q-x', r: 6, label: 'start, 2 m', labelDir: 'e' },
  ],
  'A Ferris wheel of radius 20 metres with its centre 22 metres up. A car starts at the bottom and is shown after 25 seconds.',
  { size: [460, 420], grid: false },
);

const topic: Topic = {
  id: 'f-trig',
  course: 'foundations',
  number: '0.4',
  title: 'Trigonometry and the unit circle',
  blurb: 'Radians, identities, polar coordinates.',
  icon: '◷',
  prereqs: ['f-functions'],
  glossary: [
    { id: 'radian', term: 'Radian', def: 'The angle that cuts off an arc equal to the radius. A full turn is {{2\\pi|2 pi}} radians, so {{180^\\circ=\\pi|180 degrees equals pi}} radians.' },
    { id: 'unit-circle', term: 'Unit circle', def: 'The circle of radius 1 around the origin. The point at angle {{\\theta|theta}} is {{(\\cos\\theta,\\sin\\theta)|cos theta, sine theta}}: this is the definition of sine and cosine.' },
    { id: 'period', term: 'Period', def: 'The smallest shift after which a function repeats. {{\\sin(\\omega t)|sine of omega t}} has period {{2\\pi/\\omega|2 pi over omega}}.' },
    { id: 'amplitude', term: 'Amplitude', def: 'The maximum distance of an oscillation from its middle value: {{A|A}} in {{A\\sin(\\omega t+\\varphi)|A sine of omega t plus phi}}.' },
    { id: 'phase', term: 'Phase', def: 'Where in its cycle an oscillation starts: {{\\varphi|phi}} in {{A\\sin(\\omega t+\\varphi)|A sine of omega t plus phi}}, measured in radians.' },
    { id: 'polar', term: 'Polar coordinates', def: 'Describing a point by its distance {{r|r}} from the origin and angle {{\\theta|theta}}: {{x=r\\cos\\theta,\\ y=r\\sin\\theta|x equals r cos theta, y equals r sine theta}}.' },
    { id: 'atan2', term: 'atan2', def: 'The two-argument arctangent: the angle of the point {{(x,y)|x, y}}, in the correct quadrant, between {{-\\pi|minus pi}} and {{\\pi|pi}}. Use it instead of {{\\arctan(y/x)|arctan of y over x}}.' },
  ],
  formulas: [
    { name: 'Degrees and radians', tex: R`\theta_{\text{rad}}=\theta_{\text{deg}}\cdot\frac{\pi}{180}`, say: 'angle in radians equals angle in degrees times pi over 180' },
    { name: 'Arc length', tex: R`s=r\theta\quad(\theta\text{ in radians})`, say: 's equals r theta, with theta in radians' },
    { name: 'Unit circle', tex: R`(\cos\theta,\ \sin\theta),\qquad \tan\theta=\frac{\sin\theta}{\cos\theta}`, say: 'the point at angle theta is cos theta, sine theta; tan theta equals sine over cos' },
    { name: 'Pythagorean identity', tex: R`\sin^2\theta+\cos^2\theta=1`, say: 'sine squared theta plus cos squared theta equals 1' },
    { name: 'Angle addition', tex: R`\sin(a+b)=\sin a\cos b+\cos a\sin b,\quad \cos(a+b)=\cos a\cos b-\sin a\sin b`, say: 'sine of a plus b equals sine a cos b plus cos a sine b; cos of a plus b equals cos a cos b minus sine a sine b' },
    { name: 'Double angle', tex: R`\sin2\theta=2\sin\theta\cos\theta,\quad \cos2\theta=\cos^2\theta-\sin^2\theta`, say: 'sine 2 theta equals 2 sine theta cos theta; cos 2 theta equals cos squared minus sine squared' },
    { name: 'Oscillation', tex: R`y=A\sin(\omega t+\varphi),\quad T=\frac{2\pi}{\omega},\quad f=\frac{\omega}{2\pi}`, say: 'y equals A sine of omega t plus phi; period T equals 2 pi over omega; frequency f equals omega over 2 pi' },
    { name: 'Polar coordinates', tex: R`x=r\cos\theta,\ y=r\sin\theta;\quad r=\sqrt{x^2+y^2},\ \theta=\operatorname{atan2}(y,x)`, say: 'x equals r cos theta, y equals r sine theta; r equals root of x squared plus y squared, theta equals atan2 of y and x' },
    { name: 'Rotation by θ', tex: R`x'=x\cos\theta-y\sin\theta,\quad y'=x\sin\theta+y\cos\theta`, say: 'x prime equals x cos theta minus y sine theta; y prime equals x sine theta plus y cos theta' },
  ],
  steps: [
    {
      id: 'hook',
      kind: 'hook',
      question: 'A Ferris wheel 40 m across turns once every 2 minutes. You board at the bottom, 2 m up. How high are you 25 seconds later?',
      scene: hookScene,
      teaser: R`About 16.8 m. The answer needs an angle (how far round you are) turned into a height. That conversion is exactly what sine and cosine are, and it is the mathematics of everything that rotates, swings or waves.`,
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
            { type: 'p', text: 'Trigonometry turns angles into lengths and back. It describes rotation, oscillation and waves: pendulums, springs, sound, light, alternating current, orbits.' },
            { type: 'p', text: 'It builds on functions (0.2). It feeds vectors (2.1), oscillators (3.3), complex numbers and Fourier analysis (Course 5), and every rotation in a simulation.' },
            { type: 'note', kind: 'compsci', text: 'Every 3D graphics engine, robot arm controller and orbit simulator spends much of its time computing sines and cosines, mostly to rotate things.' },
          ],
        },
        {
          id: 'radians',
          title: 'Radians: measuring angles by length',
          blocks: [
            { type: 'p', text: R`A [[radian]] measures an angle by the arc it cuts off: angle = arc length ÷ radius. One radian is the angle whose arc equals the radius, about {{57.3^\circ|57.3 degrees}}.` },
            { type: 'eq', eq: { tex: R`\theta=\frac{\Q{slope}{s}}{\Q{x}{r}},\qquad 2\pi\ \text{rad}=360^\circ,\qquad \pi\ \text{rad}=180^\circ`, say: 'theta equals arc length over radius; 2 pi radians is 360 degrees; pi radians is 180 degrees', label: 'radian' } },
            { type: 'p', text: R`A full turn is {{2\pi|2 pi}} radians because the circumference is {{2\pi r|2 pi r}}. With radians, arc length is simply {{s=r\theta|s equals r theta}}, and the derivative of {{\sin|sine}} is exactly {{\cos|cos}}. In degrees, stray factors of {{\pi/180|pi over 180}} appear everywhere.` },
            { type: 'note', kind: 'units', text: 'A radian is a ratio of two lengths, so it is dimensionless. That is why angles in radians can appear inside formulas like s = rθ without changing the units.' },
          ],
        },
        {
          id: 'circle',
          title: 'Sine and cosine on the unit circle',
          blocks: [
            { type: 'p', text: R`Walk anticlockwise round the [[unit-circle|unit circle]] from {{(1,0)|1, 0}} through angle {{\theta|theta}}. The point you reach **defines** cosine and sine: {{\cos\theta|cos theta}} is its {{x|x}}-coordinate and {{\sin\theta|sine theta}} its {{y|y}}-coordinate.` },
            {
              type: 'figure',
              scene: scene([-1.5, 1.6], [-1.3, 1.3], [
                { kind: 'polyline', points: circlePts(0, 0, 1), role: 'muted', width: 2 },
                { kind: 'segment', a: [0, 0], b: [Math.cos(0.9), Math.sin(0.9)], role: 'q-x', width: 3 },
                { kind: 'segment', a: [0, 0], b: [Math.cos(0.9), 0], role: 'given', width: 4 },
                { kind: 'segment', a: [Math.cos(0.9), 0], b: [Math.cos(0.9), Math.sin(0.9)], role: 'q-f', width: 4 },
                { kind: 'polyline', points: circlePts(0, 0, 0.3, 0, 0.9, 30), role: 'q-slope', width: 3 },
                { kind: 'label', at: [0.33, 0.12], text: 'θ', role: 'q-slope', hand: true, size: 22 },
                { kind: 'label', at: [Math.cos(0.9) / 2, -0.17], text: 'cos θ', role: 'given', anchor: 'middle', hand: true, size: 20 },
                { kind: 'label', at: [Math.cos(0.9) + 0.06, Math.sin(0.9) / 2], text: 'sin θ', role: 'q-f', hand: true, size: 20 },
                { kind: 'label', at: [0.18, 0.55], text: '1', role: 'q-x', hand: true, size: 20 },
                { kind: 'point', at: [Math.cos(0.9), Math.sin(0.9)], role: 'active' },
              ], 'Unit circle with angle theta, the horizontal leg labelled cos theta and the vertical leg labelled sine theta.', { size: [480, 400], grid: false }),
              caption: R`The radius has length 1. Its horizontal shadow is {{\cos\theta|cos theta}}; its vertical shadow is {{\sin\theta|sine theta}}.`,
            },
            { type: 'p', text: R`This works for every angle, not just acute ones. In the second quadrant {{\cos|cos}} is negative; in the third both are negative. And {{\tan\theta=\sin\theta/\cos\theta|tan theta equals sine over cos}} is the slope of the radius.` },
            { type: 'note', kind: 'remember', text: R`For a right triangle with angle {{\theta|theta}} and hypotenuse {{h|h}}: opposite {{=h\sin\theta|equals h sine theta}}, adjacent {{=h\cos\theta|equals h cos theta}}. This is just the unit circle scaled by {{h|h}}.` },
          ],
        },
        {
          id: 'waves',
          title: 'Graphs: waves',
          blocks: [
            { type: 'p', text: R`As the angle keeps increasing, the point goes round and round, so {{\sin|sine}} and {{\cos|cos}} repeat every {{2\pi|2 pi}}: their [[period]]. Both swing between −1 and 1. Cosine is sine shifted left by a quarter turn: {{\cos\theta=\sin(\theta+\pi/2)|cos theta equals sine of theta plus pi over 2}}.` },
            { type: 'eq', eq: { tex: R`y=\Q{f}{A}\sin(\Q{slope}{\omega}\,\Q{t}{t}+\Q{x}{\varphi})`, say: 'y equals A sine of omega t plus phi', label: 'oscillation' } },
            { type: 'p', text: R`In {{A\sin(\omega t+\varphi)|A sine of omega t plus phi}}: the [[amplitude]] {{A|A}} sets the size, the angular frequency {{\omega|omega}} (radians per second) the speed, and the [[phase]] {{\varphi|phi}} the starting point. The period is {{T=2\pi/\omega|T equals 2 pi over omega}}.` },
          ],
        },
        {
          id: 'why',
          title: 'Why the identities hold',
          blocks: [
            { type: 'p', text: R`The point {{(\cos\theta,\sin\theta)|cos theta, sine theta}} is at distance 1 from the origin. Pythagoras gives the most-used identity at once:` },
            { type: 'eq', eq: { tex: R`\sin^2\theta+\cos^2\theta=1`, say: 'sine squared theta plus cos squared theta equals 1', label: 'Pythagoras' } },
            { type: 'p', text: R`Symmetry of the circle gives the rest of the basics. Reflecting in the {{x|x}}-axis turns {{\theta|theta}} into {{-\theta|minus theta}}: {{\cos(-\theta)=\cos\theta|cos is even}} and {{\sin(-\theta)=-\sin\theta|sine is odd}}.` },
            { type: 'p', text: R`Rotating by {{a|a}} and then by {{b|b}} is rotating by {{a+b|a plus b}}. Writing both rotations out with sines and cosines and comparing gives the angle-addition formulas. Setting {{a=b|a equal to b}} gives the double-angle formulas.` },
            { type: 'eq', eq: { tex: R`\sin(a+b)=\sin a\cos b+\cos a\sin b`, say: 'sine of a plus b equals sine a cos b plus cos a sine b', label: 'angle addition' } },
          ],
        },
      ],
    },
    { id: 'watch', kind: 'watch', intro: 'Three animations: the unit circle drawing the sine wave, what a radian is, and polar coordinates.', anims: [circleToWave(), radianAnim(), polarAnim()] },
    {
      id: 'recall',
      kind: 'recall',
      questions: [
        { id: 'rc-rad', prompt: R`How many radians is {{90^\circ|90 degrees}}? (Decimals are fine.)`, answer: { kind: 'numeric', value: Math.PI / 2, relTol: 1e-3 }, explain: R`{{90\cdot\pi/180=\pi/2\approx1.571|90 times pi over 180 is pi over 2}}.` },
        { id: 'rc-sin-def', prompt: R`On the unit circle, {{\sin\theta|sine theta}} is…`, answer: { kind: 'mc', options: ['the x-coordinate of the point at angle θ', 'the y-coordinate of the point at angle θ', 'the arc length', 'the slope of the radius'], correct: 1 }, explain: R`Sine is the height; cosine is the horizontal coordinate; tangent is the slope.` },
        { id: 'rc-pyth', prompt: R`If {{\sin\theta=0.6|sine theta equals 0.6}} and {{\theta|theta}} is in the first quadrant, what is {{\cos\theta|cos theta}}?`, answer: { kind: 'numeric', value: 0.8, relTol: 1e-6 }, explain: R`{{\cos^2\theta=1-0.36=0.64|cos squared is 1 minus 0.36, 0.64}}, and cos is positive in the first quadrant: 0.8.` },
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
          id: 'inverse',
          title: 'Inverse trig functions, and atan2',
          blocks: [
            { type: 'p', text: R`Sine isn’t one-to-one, so to invert it we restrict its domain (as in 0.2). {{\arcsin y|arcsine y}} returns the angle in {{[-\pi/2,\pi/2]|minus pi over 2 to pi over 2}} with that sine. {{\arccos|arccos}} returns angles in {{[0,\pi]|0 to pi}}, {{\arctan|arctan}} in {{(-\pi/2,\pi/2)|minus pi over 2 to pi over 2}}.` },
            { type: 'p', text: R`So {{\sin\theta=0.5|sine theta equals 0.5}} has more answers than {{\arcsin0.5=\pi/6|arcsine 0.5 equals pi over 6}}: also {{5\pi/6|5 pi over 6}}, and every angle {{2\pi|2 pi}} away from these. Equations with trig functions usually have infinitely many solutions.` },
            { type: 'p', text: R`To find the angle of a point {{(x,y)|x, y}}, {{\arctan(y/x)|arctan of y over x}} fails: {{(1,1)|1, 1}} and {{(-1,-1)|minus 1, minus 1}} give the same ratio. [[atan2]]{{(y,x)|of y and x}} looks at both signs and returns the true angle in {{(-\pi,\pi]|minus pi to pi}}.` },
            { type: 'note', kind: 'pitfall', text: R`{{\sin^{-1}x|sine to the minus 1 of x}} means {{\arcsin x|arcsine x}}, not {{1/\sin x|1 over sine x}}. But {{\sin^2x|sine squared x}} does mean {{(\sin x)^2|sine x, squared}}. The notation is inconsistent; read carefully.` },
          ],
        },
        {
          id: 'polar',
          title: 'Polar coordinates',
          blocks: [
            { type: 'p', text: R`A point can be given by distance and direction instead of {{x|x}} and {{y|y}}: [[polar|polar coordinates]] {{(r,\theta)|r, theta}}. Converting is the unit circle scaled by {{r|r}}:` },
            { type: 'eq', eq: { tex: R`x=r\cos\theta,\quad y=r\sin\theta;\qquad r=\sqrt{x^2+y^2},\quad \theta=\operatorname{atan2}(y,x)`, say: 'x equals r cos theta, y equals r sine theta; r equals the root of x squared plus y squared, and theta equals atan2 of y and x', label: 'polar' } },
            { type: 'p', text: R`Polar coordinates make circular things simple. A circle is {{r=\text{const}|r equals a constant}}; a spiral is {{r=\theta|r equals theta}}. Orbits, vortices and anything with rotational symmetry are easier in polar form.` },
          ],
        },
        {
          id: 'small',
          title: 'Small angles',
          blocks: [
            { type: 'p', text: R`For small angles in radians the arc and its height are almost the same: {{\sin\theta\approx\theta|sine theta is approximately theta}}, and {{\cos\theta\approx1-\theta^2/2|cos theta is approximately 1 minus theta squared over 2}}. At {{\theta=0.1|theta equals 0.1}} the sine approximation is off by about 0.17%.` },
            { type: 'p', text: R`This is how the pendulum becomes simple. Its true equation contains {{\sin\theta|sine theta}}; replacing it by {{\theta|theta}} for small swings gives an equation with an exact sine-wave solution and a period independent of the amplitude.` },
            { type: 'note', kind: 'why', text: 'That is also why a pendulum clock slows down when it swings wider: for larger angles sin θ < θ, the restoring pull is weaker than the approximation assumes, and the period grows. You will simulate this in the oscillations topic.' },
          ],
        },
      ],
    },
    { id: 'play', kind: 'play', sandbox: waveLab },
    {
      id: 'predict',
      kind: 'predict',
      question: "A program computes the direction of the point {{(-1,-1)|minus 1, minus 1}} as `np.arctan(y / x)`. What angle does it get?".replace(/\\`/g, '`'),
      answer: { kind: 'mc', options: ['−135° (−3π/4)', '45° (π/4)', '225° (5π/4)', 'An error'], correct: 1 },
      reveal: atanReveal(),
      explain: "{{y/x=(-1)/(-1)=1|y over x is 1}}, and {{\\arctan1=\\pi/4|arctan of 1 is pi over 4}}: the two minus signs cancel and the quadrant is lost. The direction is off by exactly half a turn. `np.arctan2(y, x)` keeps the signs and returns {{-3\\pi/4|minus 3 pi over 4}}.".replace(/\\`/g, '`'),
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
            { type: 'p', text: "**π is not exact.** `np.pi` is the closest double to π, so `np.sin(np.pi)` is about 1.2 × 10⁻¹⁶, not 0. Never test trig results with `==`; compare with a tolerance." },
            { type: 'p', text: "**Large arguments lose the phase.** Near 10¹⁶ consecutive doubles are 2 apart, so an angle like ωt there is only known to within about 2 radians: the sine is meaningless. Long simulations should keep the phase small, for example by wrapping it with `np.mod(theta, 2*np.pi)` as they go." },
            { type: 'p', text: "**Angles between vectors.** `np.arccos(dot / (|u||v|))` is inaccurate for nearly parallel vectors: for an angle of 10⁻⁹ it returns exactly 0, because the cosine rounds to 1. `atan2(|u × v|, u · v)` gets it right. You’ll implement this in the problems." },
            { type: 'note', kind: 'compsci', text: 'Evaluating sin and cos costs tens of times more than an addition. Rotation-heavy codes (graphics, molecular dynamics) compute them once per angle and reuse them, or use rotation matrices or quaternions.' },
          ],
        },
        {
          id: 'python',
          title: 'Doing it in Python',
          blocks: [
            { type: 'code', code: 'import numpy as np\nprint(np.sin(np.pi / 6))            # 0.49999999999999994 (≈ 0.5)\nprint(np.deg2rad(135))              # 2.356194490192345 = 3π/4\nprint(np.arctan(-1 / -1))           # 0.785… (wrong quadrant)\nprint(np.arctan2(-1, -1))           # -2.356… = -3π/4\nprint(np.hypot(3, 4))               # 5.0, the r of polar coordinates', say: 'np sine of pi over 6 is 0.5 up to rounding. deg2rad converts 135 degrees to 3 pi over 4. arctan of minus 1 over minus 1 gives the wrong quadrant; arctan2 of minus 1, minus 1 gives minus 3 pi over 4. hypot of 3 and 4 is 5.' },
            { type: 'code', code: 'import numpy as np\nt = np.linspace(0, 2, 9)                 # s\ny = 0.5 * np.sin(2 * np.pi * 1.5 * t)    # amplitude 0.5, frequency 1.5 Hz\nprint(np.round(y, 3))', say: 'A sampled oscillation: amplitude 0.5 and frequency 1.5 hertz, so omega is 2 pi times 1.5.' },
            { type: 'note', kind: 'python', text: 'All of NumPy’s trig functions use radians. Convert with `np.deg2rad` and `np.rad2deg` at the edges of your program, and work in radians everywhere inside it.' },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common mistakes',
          blocks: [
            {
              type: 'list',
              items: [
                'Feeding degrees to a function that expects radians.',
                R`Using {{\arctan(y/x)|arctan of y over x}} for a direction instead of atan2.`,
                R`Writing {{\sin(a+b)=\sin a+\sin b|sine of a plus b equals sine a plus sine b}}.`,
                R`Saying the period of {{\sin(\omega t)|sine of omega t}} is {{\omega|omega}}. It is {{2\pi/\omega|2 pi over omega}}.`,
                R`Forgetting the second solution: {{\sin\theta=0.5|sine theta equals 0.5}} also has {{\theta=5\pi/6|theta equals 5 pi over 6}}.`,
                R`Reading {{\sin^{-1}|sine to the minus 1}} as one over sine.`,
              ],
            },
          ],
        },
        {
          id: 'compsci',
          title: 'In computational science',
          blocks: [
            { type: 'p', text: 'Rotations are built from sines and cosines: turning a 2D point by θ uses the rotation formulas you will fill in shortly. 3D graphics, robotics and molecular simulation rotate millions of points this way.' },
            { type: 'p', text: 'Oscillations and waves are sums of sines: vibrating structures, sound, alternating current. Course 5 shows that almost any signal is a sum of sine waves (Fourier series).' },
            { type: 'p', text: 'Navigation computes great-circle distances on the Earth with trigonometric formulas, such as the haversine formula, which was designed to stay accurate for short distances.' },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          blocks: [
            {
              type: 'list',
              items: [
                R`Radians measure angles by arc length: {{\theta=s/r|theta equals s over r}}; a full turn is {{2\pi|2 pi}}.`,
                R`{{(\cos\theta,\sin\theta)|cos theta, sine theta}} is the point at angle {{\theta|theta}} on the unit circle; {{\sin^2+\cos^2=1|sine squared plus cos squared equals 1}}.`,
                R`{{A\sin(\omega t+\varphi)|A sine of omega t plus phi}}: amplitude, angular frequency, phase; period {{2\pi/\omega|2 pi over omega}}.`,
                'Inverse trig functions need restricted domains; use atan2 for directions.',
                R`Polar coordinates {{(r,\theta)|r, theta}} suit circular problems. Small angles: {{\sin\theta\approx\theta|sine theta is approximately theta}}.`,
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'worked',
      kind: 'worked',
      problem: 'A Ferris wheel has radius 20 m, its centre is 22 m up, and it turns once every 120 s. You board at the bottom at t = 0. How high are you at t = 25 s?',
      lines: [
        { tex: R`\theta(t)=\frac{2\pi}{120}\,t`, say: 'theta of t equals 2 pi over 120 times t', why: 'One full turn, 2π radians, every 120 s.' },
        { tex: R`h(t)=22-20\cos\theta(t)`, say: 'h of t equals 22 minus 20 cos theta of t', why: 'At θ = 0 you are at the bottom: 22 − 20 = 2 m. At θ = π, the top: 42 m.' },
        { tex: R`\theta(25)=\frac{2\pi\cdot25}{120}\approx1.309\ \text{rad}\ (75^\circ)`, say: 'theta of 25 is about 1.309 radians, 75 degrees', why: 'Substituted t = 25 s.' },
        { tex: R`h(25)=22-20\cos(1.309)\approx22-20(0.2588)`, say: 'h of 25 equals 22 minus 20 cos 1.309, about 22 minus 20 times 0.2588', why: 'cos(75°) ≈ 0.2588.' },
        { tex: R`h(25)\approx16.8\ \text{m}`, say: 'h of 25 is about 16.8 metres', why: 'Multiplied out: 22 − 5.18.' },
      ],
      takeaway: 'Model rotation as angle = angular speed × time, then turn the angle into a height with sine or cosine. Choose sine or cosine (and the sign) by checking where you are at t = 0.',
    },
    {
      id: 'your-turn',
      kind: 'yourTurn',
      problems: [
        {
          id: 'yt-convert',
          prompt: R`Convert {{135^\circ|135 degrees}} to radians.`,
          answer: { kind: 'numeric', value: (3 * Math.PI) / 4, relTol: 1e-4 },
          hints: [R`Multiply by {{\pi/180|pi over 180}}.`, R`{{135/180=3/4|135 over 180 is three quarters}}.`, R`So the answer is {{3\pi/4|3 pi over 4}}, about 2.356.`],
          solution: [
            { tex: R`135^\circ\cdot\frac{\pi}{180^\circ}=\frac{3\pi}{4}`, say: '135 degrees times pi over 180 equals 3 pi over 4', why: 'Degrees to radians.' },
            { tex: R`\frac{3\pi}{4}\approx2.356`, say: '3 pi over 4 is about 2.356', why: 'Evaluated.' },
          ],
          solutionFinal: '3*pi/4',
          truth: 'Rational(135, 180)*pi',
        },
        {
          id: 'yt-period',
          prompt: R`What is the period of {{y=3\sin(4\pi t)|y equals 3 sine of 4 pi t}}, with {{t|t}} in seconds? Include units.`,
          answer: { kind: 'numeric', value: 0.5, relTol: 1e-6, unit: 's' },
          hints: [R`Match it to {{A\sin(\omega t)|A sine of omega t}}.`, R`{{\omega=4\pi|omega equals 4 pi}} radians per second.`, R`Period {{T=2\pi/\omega|T equals 2 pi over omega}}.`],
          solution: [
            { tex: R`\omega=4\pi\ \text{rad/s}`, say: 'omega equals 4 pi radians per second', why: 'The coefficient of t inside the sine. (The amplitude 3 doesn’t affect the period.)' },
            { tex: R`T=\frac{2\pi}{4\pi}=0.5\ \text{s}`, say: 'T equals 2 pi over 4 pi, which is 0.5 seconds', why: 'Period formula.' },
          ],
          solutionFinal: '1/2',
          truth: '2*pi/(4*pi)',
        },
        {
          id: 'yt-identity',
          prompt: R`Simplify {{\sin^2x+\cos^2x+\tan x\cos x|sine squared x plus cos squared x plus tan x cos x}}.`,
          answer: { kind: 'expr', expr: '1 + sin(x)', vars: ['x'] },
          hints: ['Two of the terms are a famous identity.', R`{{\sin^2x+\cos^2x=1|sine squared plus cos squared is 1}}.`, R`{{\tan x\cos x=\frac{\sin x}{\cos x}\cos x|tan x cos x equals sine over cos times cos}}.`],
          solution: [
            { tex: R`\sin^2x+\cos^2x=1`, say: 'sine squared x plus cos squared x equals 1', why: 'Pythagorean identity.' },
            { tex: R`\tan x\cos x=\sin x`, say: 'tan x cos x equals sine x', why: 'tan = sin / cos; the cos cancels (where cos x ≠ 0).' },
            { tex: R`1+\sin x`, say: '1 plus sine x', why: 'Added the pieces.' },
          ],
          solutionFinal: '1 + sin(x)',
          truth: 'simplify(sin(x)**2 + cos(x)**2 + tan(x)*cos(x))',
        },
        {
          id: 'yt-angle',
          prompt: R`What angle (in radians, between {{-\pi|minus pi}} and {{\pi|pi}}) does the point {{(-1,\sqrt3)|minus 1, root 3}} make with the positive {{x|x}}-axis?`,
          answer: { kind: 'numeric', value: (2 * Math.PI) / 3, relTol: 1e-4 },
          hints: ['Which quadrant is the point in?', R`It is up and to the left: second quadrant, between {{\pi/2|pi over 2}} and {{\pi|pi}}.`, R`The reference angle has {{\tan=\sqrt3|tan equals root 3}}, so it is {{\pi/3|pi over 3}}. Measure from the negative x-axis.`],
          solution: [
            { tex: R`r=\sqrt{1+3}=2`, say: 'r equals root of 1 plus 3, which is 2', why: 'Distance from the origin.' },
            { tex: R`\cos\theta=-\tfrac12,\ \sin\theta=\tfrac{\sqrt3}{2}`, say: 'cos theta equals minus one half, sine theta equals root 3 over 2', why: 'Divided x and y by r.' },
            { tex: R`\theta=\tfrac{2\pi}{3}\approx2.094`, say: 'theta equals 2 pi over 3, about 2.094', why: 'Second-quadrant angle with those values (120°).' },
          ],
          solutionFinal: '2*pi/3',
          truth: 'atan2(sqrt(3), -1)',
        },
      ],
    },
    {
      id: 'compute',
      kind: 'compute',
      problem: {
        id: 'cp-polar',
        title: 'Polar ↔ Cartesian, vectorised',
        prompt: 'Write `to_polar(x, y)` returning `(r, theta)` with `theta` in (−π, π], and `to_cartesian(r, theta)` returning `(x, y)`. Both must work on NumPy arrays. Use `np.hypot` and `np.arctan2`.',
        starter: 'import numpy as np\n\ndef to_polar(x, y):\n    r = np.sqrt(x**2 + y**2)\n    theta = np.arctan(y / x)     # careful!\n    return r, theta\n\ndef to_cartesian(r, theta):\n    pass\n',
        solution: 'import numpy as np\n\ndef to_polar(x, y):\n    return np.hypot(x, y), np.arctan2(y, x)\n\ndef to_cartesian(r, theta):\n    return r * np.cos(theta), r * np.sin(theta)\n',
        tests: [
          'import numpy as np',
          'def test_third_quadrant():',
          '    r, th = to_polar(-1.0, -1.0)',
          '    assert abs(r - np.sqrt(2)) < 1e-12 and abs(th + 3 * np.pi / 4) < 1e-12, (r, th)',
          'def test_round_trip_arrays():',
          '    x = np.array([1.0, -2.0, 0.0, 3.0])',
          '    y = np.array([0.0, 2.0, -5.0, -4.0])',
          '    X, Y = to_cartesian(*to_polar(x, y))',
          '    assert np.allclose(X, x) and np.allclose(Y, y)',
          'def test_on_the_y_axis():',
          '    r, th = to_polar(0.0, 2.0)',
          '    assert abs(th - np.pi / 2) < 1e-12',
        ].join('\n'),
        hints: ['arctan(y / x) loses the quadrant and fails when x = 0.', 'np.arctan2(y, x) takes y and x separately.', 'to_cartesian is r·cos θ and r·sin θ.'],
      },
    },
    {
      id: 'fill',
      kind: 'fillGap',
      mode: 'code',
      intro: R`Fill the gaps in the 2D rotation by angle {{\theta|theta}}: {{x'=x\cos\theta-y\sin\theta|x prime equals x cos theta minus y sine theta}}, {{y'=x\sin\theta+y\cos\theta|y prime equals x sine theta plus y cos theta}}.`,
      template: 'import numpy as np\n\ndef rotate(x, y, theta):\n    c, s = np.cos(theta), np.sin(theta)\n    xr = x * c - ⟦a⟧\n    yr = ⟦b⟧ + y * c\n    return xr, yr\n',
      blanks: [
        { id: 'a', answers: ['y * s', 'y*s', 's * y', 's*y'], check: 'exact', width: 6, hint: R`The second term of {{x'|x prime}} is {{y\sin\theta|y sine theta}}.` },
        { id: 'b', answers: ['x * s', 'x*s', 's * x', 's*x'], check: 'exact', width: 6, hint: R`The first term of {{y'|y prime}} is {{x\sin\theta|x sine theta}}.` },
      ],
      tests: [
        'def test_quarter_turn():',
        '    xr, yr = rotate(1.0, 0.0, np.pi / 2)',
        '    assert abs(xr) < 1e-12 and abs(yr - 1) < 1e-12',
        'def test_keeps_length():',
        '    xr, yr = rotate(3.0, 4.0, 0.7)',
        '    assert abs(np.hypot(xr, yr) - 5) < 1e-12',
        'def test_undo():',
        '    xr, yr = rotate(*rotate(2.0, -1.0, 1.1), -1.1)',
        '    assert abs(xr - 2) < 1e-12 and abs(yr + 1) < 1e-12',
      ].join('\n'),
    },
    {
      id: 'used',
      kind: 'used',
      items: [
        { field: 'Robotics', title: 'Forward kinematics', text: 'The position of a robot arm’s hand is a sum of link lengths times sines and cosines of the joint angles. Controllers evaluate this, and its inverse, continuously.' },
        { field: 'Computer graphics', title: 'Rotating everything', text: 'Every object on screen is rotated, by rotation matrices built from cos θ and sin θ, before it is drawn.' },
        { field: 'Electrical engineering', title: 'Alternating current', text: R`Mains voltage is a sine wave, {{V_0\sin(2\pi ft)|V 0 sine of 2 pi f t}}, with {{f|f}} = 50 or 60 Hz. Circuit simulators work with amplitudes and phases (Course 5: phasors).` },
        { field: 'Navigation', title: 'Great-circle distance', text: 'GPS and flight-planning software compute distances on the curved Earth with trigonometric formulas such as the haversine formula.' },
      ],
    },
    {
      id: 'problems',
      kind: 'problems',
      problems: [
        {
          id: 'pb-deg',
          title: 'Degrees to radians',
          difficulty: 'easy',
          prompt: 'Write `deg_to_rad(d)` without using `np.deg2rad` or `math.radians`.',
          starter: 'def deg_to_rad(d):\n    pass\n',
          solution: 'import math\n\ndef deg_to_rad(d):\n    return d * math.pi / 180\n',
          tests: ['import math', 'def test_values():', '    assert abs(deg_to_rad(180) - math.pi) < 1e-15', '    assert abs(deg_to_rad(90) - math.pi / 2) < 1e-15', '    assert deg_to_rad(0) == 0'].join('\n'),
          hints: ['180 degrees is π radians.', 'Multiply by π / 180.', 'return d * math.pi / 180'],
        },
        {
          id: 'pb-period',
          title: 'Period and frequency',
          difficulty: 'easy',
          prompt: "Write `period_frequency(omega)` returning `(T, f)` for {{\sin(\omega t)|sine of omega t}}: period {{T=2\pi/\omega|T equals 2 pi over omega}} and frequency {{f=1/T|f equals 1 over T}}.",
          starter: 'def period_frequency(omega):\n    pass\n',
          solution: 'import math\n\ndef period_frequency(omega):\n    T = 2 * math.pi / omega\n    return T, 1 / T\n',
          tests: ['import math', 'def test_mains():', '    T, f = period_frequency(2 * math.pi * 50)', '    assert abs(f - 50) < 1e-9 and abs(T - 0.02) < 1e-12', 'def test_one():', '    T, f = period_frequency(1.0)', '    assert abs(T - 2 * math.pi) < 1e-12'].join('\n'),
          hints: ['One cycle takes the angle ωt through 2π.', 'T = 2π / ω.', 'f = 1 / T = ω / 2π.'],
        },
        {
          id: 'pb-angle',
          title: 'An accurate angle between two vectors',
          difficulty: 'medium',
          prompt: 'Write `angle_between(u, v)` for 2D vectors (NumPy arrays), returning the angle in [0, π]. It must be accurate for nearly parallel vectors, where `arccos` of the normalised dot product returns 0. Use `atan2(|cross|, dot)` with the 2D cross product `u[0]*v[1] - u[1]*v[0]`.',
          starter: 'import numpy as np\n\ndef angle_between(u, v):\n    c = np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))\n    return np.arccos(c)\n',
          solution: 'import numpy as np\n\ndef angle_between(u, v):\n    cross = u[0] * v[1] - u[1] * v[0]\n    return np.arctan2(abs(cross), np.dot(u, v))\n',
          tests: [
            'import numpy as np',
            'def test_right_angle():',
            '    assert abs(angle_between(np.array([1.0, 0]), np.array([0, 2.0])) - np.pi / 2) < 1e-15',
            'def test_opposite():',
            '    assert abs(angle_between(np.array([1.0, 0]), np.array([-3.0, 0])) - np.pi) < 1e-15',
            'def test_nearly_parallel():',
            '    a = angle_between(np.array([1.0, 0.0]), np.array([1.0, 1e-9]))',
            '    assert abs(a - 1e-9) / 1e-9 < 1e-6, a',
          ].join('\n'),
          hints: ['|u × v| = |u||v| sin θ and u · v = |u||v| cos θ.', 'atan2 of (sin-like, cos-like) gives θ without dividing or calling arccos.', 'In 2D the cross product is the number u[0]·v[1] − u[1]·v[0].'],
        },
      ],
      outside: [
        { source: 'Paul’s Online Math Notes', item: 'Calculus I → Review chapter: "Trig Functions", "Solving Trig Equations", "Inverse Trig Functions"', why: 'Compact reviews with worked problems.' },
        { source: 'OpenStax Algebra and Trigonometry (also on LibreTexts)', item: 'Chapter 7 "The Unit Circle: Sine and Cosine Functions" and chapter 9 "Trigonometric Identities and Equations"', why: 'Plenty of exercises with answers.' },
        { source: 'Khan Academy', item: 'Trigonometry → "Trigonometric functions" (unit circle) and "Trigonometric equations and identities"', why: 'Interactive unit-circle practice.' },
      ],
    },
    {
      id: 'recap',
      kind: 'recap',
      prompt: 'In three to five sentences: what sine and cosine are on the unit circle, why radians are the natural unit, and why programs should use atan2. Use the words "radius", "arc" and "quadrant".',
      quiz: [
        { id: 'qz-sin30', prompt: R`What is {{\sin(\pi/6)|sine of pi over 6}}?`, answer: { kind: 'numeric', value: 0.5, relTol: 1e-9 }, explain: R`{{\pi/6|pi over 6}} is {{30^\circ|30 degrees}}, and {{\sin30^\circ=1/2|sine 30 degrees is one half}}.` },
        { id: 'qz-cos2x', prompt: R`What is the period of {{\cos(2x)|cos 2 x}}?`, answer: { kind: 'numeric', value: Math.PI, relTol: 1e-4 }, explain: R`{{2\pi/2=\pi|2 pi over 2 is pi}}: the inside factor 2 squeezes the graph.` },
        { id: 'qz-polar', prompt: R`Which polar coordinates describe the point {{(0,-3)|0, minus 3}}?`, answer: { kind: 'mc', options: ['r = 3, θ = π/2', 'r = 3, θ = −π/2', 'r = −3, θ = 0', 'r = 3, θ = π'], correct: 1 }, explain: R`Distance 3, pointing straight down: {{\theta=-\pi/2|theta equals minus pi over 2}}.` },
      ],
    },
  ],
};

export default topic;
