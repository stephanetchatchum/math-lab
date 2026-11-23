import type { CompareTable } from '../types';

const tables: CompareTable[] = [
  {
    id: 'derivative-how',
    title: 'Three ways to get a derivative',
    intro: 'Same mathematical object, three very different computations. Pick by what you have: a formula, only function values, or a program.',
    head: ['Method', 'You need', 'Accuracy', 'Cost', 'Use it when'],
    rows: [
      [
        '**Symbolic** (by hand, sympy)',
        'A formula for {{f|f}}',
        'Exact',
        'Expressions can blow up in size',
        'You want a formula to reason with: find where {{f\'(x)=0|f prime of x equals zero}}, check units, simplify.',
      ],
      [
        '**Finite differences**',
        'Only values {{f(x)|f of x}}',
        'Forward {{O(h)|order h}}, central {{O(h^2)|order h squared}}; limited by rounding',
        '1–2 extra evaluations per derivative',
        'You have a black-box function or measured data. Choose {{h|h}} carefully.',
      ],
      [
        '**Automatic differentiation**',
        'The program that computes {{f|f}}',
        'Exact up to rounding',
        'A small constant times the cost of {{f|f}}',
        'Gradients of big simulations and machine-learning models (JAX, PyTorch). Covered in Numerical methods.',
      ],
    ],
  },
  {
    id: 'fd-which',
    title: 'Which finite difference?',
    intro: 'All three approximate {{f\'(x)|f prime of x}}. They differ in error order and in which values they need.',
    head: ['Formula', 'Error', 'Best step in double precision', 'Typical best error'],
    rows: [
      ['Forward {{\\frac{f(x+h)-f(x)}{h}|f of x plus h minus f of x, over h}}', '{{O(h)|order h}}', 'about {{10^{-8}|ten to the minus eight}}', 'about {{10^{-8}|ten to the minus eight}}'],
      ['Backward {{\\frac{f(x)-f(x-h)}{h}|f of x minus f of x minus h, over h}}', '{{O(h)|order h}}', 'about {{10^{-8}|ten to the minus eight}}', 'about {{10^{-8}|ten to the minus eight}}'],
      ['Central {{\\frac{f(x+h)-f(x-h)}{2h}|f of x plus h minus f of x minus h, over 2 h}}', '{{O(h^2)|order h squared}}', 'about {{10^{-5}|ten to the minus five}}', 'about {{10^{-10}|ten to the minus ten}} to {{10^{-11}|ten to the minus eleven}}'],
    ],
  },
];
export default tables;
