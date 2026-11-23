import type { GlossaryEntry } from './types';

/**
 * Site-wide glossary. Topics can add their own entries (Topic.glossary);
 * link a term in lesson text with [[id]] or [[id|shown words]].
 */
export const CORE_GLOSSARY: GlossaryEntry[] = [
  { id: 'function', term: 'Function', def: 'A rule that gives exactly one output for each allowed input. We write {{f(x)|f of x}} for the output at input {{x|x}}.' },
  { id: 'slope', term: 'Slope', def: 'Rise over run of a straight line: how much the output changes per unit change of the input. Units are output units per input unit.' },
  { id: 'secant', term: 'Secant line', def: 'A straight line through two points of a curve. Its slope is the average rate of change between them.' },
  { id: 'tangent', term: 'Tangent line', def: 'The straight line that touches a smooth curve at one point and has the same slope as the curve there. It is the best straight-line approximation near that point.' },
  { id: 'limit', term: 'Limit', def: 'The value an expression gets as close as you like to, by taking its input close enough to some point (without needing to reach it).' },
  { id: 'average-rate', term: 'Average rate of change', def: 'Change in output divided by change in input over an interval: {{\\frac{f(b)-f(a)}{b-a}|f of b minus f of a, over b minus a}}.' },
  { id: 'instantaneous-rate', term: 'Instantaneous rate of change', def: 'The limit of average rates of change over shorter and shorter intervals around a point. This is the derivative.' },
  { id: 'derivative', term: 'Derivative', def: 'The instantaneous rate of change of a function at a point: the limit of the difference quotient as the step goes to zero. Also the slope of the tangent line.' },
  { id: 'difference-quotient', term: 'Difference quotient', def: 'The ratio {{\\frac{f(a+h)-f(a)}{h}|f of a plus h, minus f of a, over h}}: the slope of the secant line across a step of size {{h|h}}.' },
  { id: 'differentiable', term: 'Differentiable', def: 'A function is differentiable at a point if the limit defining the derivative exists there (a finite number, the same from both sides).' },
  { id: 'continuous', term: 'Continuous', def: 'A function is continuous at a point if its limit there equals its value there: no jumps, holes or blow-ups. Differentiable implies continuous, not the other way round.' },
  { id: 'linear-approx', term: 'Linear approximation', def: 'Replacing a function near {{a|a}} by its tangent line: {{f(x)\\approx f(a)+f\'(a)(x-a)|f of x is approximately f of a plus f prime of a times x minus a}}.' },
  { id: 'finite-difference', term: 'Finite difference', def: 'An approximation of a derivative that uses a small but non-zero step {{h|h}}, for example the forward difference {{\\frac{f(x+h)-f(x)}{h}|f of x plus h, minus f of x, over h}}.' },
  { id: 'truncation-error', term: 'Truncation error', def: 'Error from replacing an exact limiting process by a finite one, for example using a step {{h|h}} instead of the limit {{h\\to 0|h going to zero}}. It shrinks as {{h|h}} shrinks.' },
  { id: 'rounding-error', term: 'Rounding error', def: 'Error from storing numbers with finitely many digits. In double precision each operation can be off by about one part in {{10^{16}|ten to the sixteen}}.' },
  { id: 'machine-epsilon', term: 'Machine epsilon', def: 'The gap between 1 and the next larger floating-point number: about {{2.2\\times 10^{-16}|2.2 times ten to the minus sixteen}} in double precision.' },
  { id: 'cancellation', term: 'Catastrophic cancellation', def: 'Losing significant digits when subtracting two nearly equal numbers: the leading digits cancel and the rounding errors that remain dominate.' },
  { id: 'big-o', term: 'Big-O (error order)', def: 'An error is {{O(h^p)|order h to the p}} if it shrinks at least as fast as a constant times {{h^p|h to the p}} as {{h\\to 0|h goes to zero}}. Halving {{h|h}} divides it by about {{2^p|2 to the p}}.' },
  { id: 'velocity', term: 'Velocity', def: 'The rate of change of position with time, {{v = \\frac{dx}{dt}|v equals d x by d t}}. Units: metres per second.' },
  { id: 'acceleration', term: 'Acceleration', def: 'The rate of change of velocity with time, {{a = \\frac{dv}{dt}|a equals d v by d t}}. Units: metres per second squared.' },
];
