import type { CompareTable } from '../types';

const tables: CompareTable[] = [
  {
    id: 'solve-how',
    title: 'Which way to solve an equation?',
    intro: 'Pick by the shape of the equation and by whether you need a formula or just a number.',
    head: ['Equation looks like…', 'Method', 'Watch out for'],
    rows: [
      ['Linear: {{ax+b=0|a x plus b equals zero}}', 'Undo operations on both sides', 'Dividing by something that might be zero'],
      ['Quadratic: {{ax^2+bx+c=0|a x squared plus b x plus c equals zero}}', 'Factorise, complete the square, or the quadratic formula', 'Cancellation on a computer: use the stable form'],
      ['Unknown in an exponent: {{a\\,b^x=y|a b to the x equals y}}', 'Take logarithms', 'Only positive numbers have logarithms'],
      ['Square roots: {{\\sqrt{\\dots}=\\dots|a root equals something}}', 'Square both sides, then check', 'Extraneous solutions'],
      ['Trigonometric: {{\\sin\\theta=c|sine theta equals c}}', 'Inverse trig, then add all the other solutions', 'Infinitely many solutions; radians'],
      ['No formula at all', 'A numerical method, such as bisection (0.2) or Newton (Course 6)', 'Needs a starting interval or guess; tolerance'],
    ],
  },
  {
    id: 'proof-how',
    title: 'Which proof strategy?',
    intro: 'Most short proofs use one of these. Choose by what the claim looks like.',
    head: ['Claim looks like…', 'Strategy', 'Example'],
    rows: [
      ['If P then Q, and P gives you something to compute with', '**Direct**: assume P, derive Q', 'Sum of two even numbers is even'],
      ['If P then Q, but "not Q" is easier to use', '**Contrapositive**: assume not Q, derive not P', '{{n^2|n squared}} even ⇒ n even'],
      ['Something is impossible, or "is not …"', '**Contradiction**: assume the opposite, reach a contradiction', '{{\\sqrt2|root 2}} is irrational'],
      ['For every whole number n …', '**Induction**: base case plus inductive step', '{{1+\\dots+n=n(n+1)/2|the sum formula}}'],
      ['A "for all" claim you suspect is false', '**Counterexample**: one case where it fails', '{{n^2+n+41|n squared plus n plus 41}} at n = 40'],
    ],
  },
  {
    id: 'scale-how',
    title: 'Which plot axes?',
    intro: 'The right axes turn a curve into a straight line you can read.',
    head: ['Relationship', 'Axes that straighten it', 'Slope tells you'],
    rows: [
      ['Linear {{y=mx+c|y equals m x plus c}}', 'Ordinary', '{{m|m}}'],
      ['Exponential {{y=Ae^{kx}|y equals A e to the k x}}', 'Log vertical (semilog)', '{{k|k}} (times log e)'],
      ['Power law {{y=Ax^p|y equals A x to the p}}', 'Log–log', 'The power {{p|p}}, e.g. the order of a numerical method'],
    ],
  },
];
export default tables;
