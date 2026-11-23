/**
 * TEMPLATE — copy to src/content/topics/<course>/<topic-id>.ts
 * 1. The topic id, course, number, title and prereqs must match src/content/curriculum.ts.
 * 2. Every {{tex|spoken}} needs a spoken form. Paragraphs ≤ 400 characters.
 * 3. Run `npm run verify` until it is green, then `npm run e2e`.
 * Delete step kinds you don't need, or switch them off per course in curriculum.ts.
 */
import type { Topic } from '../../types';
import { anim, frame, scene } from '../../lib';

const R = String.raw;

const topic: Topic = {
  id: 'calc-example', // = file name
  course: 'calculus',
  number: '1.x',
  title: 'Example topic',
  blurb: 'One line for the topic card.',
  icon: '∫',
  prereqs: [],
  formulas: [{ name: 'Example', tex: R`a^2+b^2=c^2`, say: 'a squared plus b squared equals c squared' }],
  steps: [
    { id: 'hook', kind: 'hook', question: 'A short visual question that makes you want the answer?', teaser: 'Why this matters, in two sentences.' },
    {
      id: 'learn-1',
      kind: 'learn',
      part: 1,
      partCount: 1,
      sections: [
        { id: 'fits', title: 'Where this fits', blocks: [{ type: 'p', text: 'Context first.' }] },
        {
          id: 'what',
          title: 'What it is',
          blocks: [
            { type: 'p', text: R`A precise definition with {{x^2|x squared}} inline maths.` },
            { type: 'eq', eq: { tex: R`\Q{f}{f(x)} = x^2`, say: 'f of x equals x squared' } },
            { type: 'note', kind: 'remember', text: 'One thing to remember.' },
          ],
        },
      ],
    },
    {
      id: 'watch',
      kind: 'watch',
      intro: 'What to look for.',
      anims: [
        anim('demo', 'Demo', [
          frame(scene([0, 1], [0, 1], [{ kind: 'fn', f: (x) => x * x, role: 'q-f' }], 'Graph of x squared on 0 to 1.'), 'First caption, spoken aloud.'),
          frame(scene([0, 1], [0, 1], [{ kind: 'fn', f: (x) => x * x * x, role: 'q-f' }], 'Graph of x cubed on 0 to 1.'), 'Second caption.'),
        ]),
      ],
    },
    // recall, play, predict, worked, yourTurn, compute, fillGap, used, problems, recap:
    // see src/content/topics/calculus/calc-derivative.ts for a complete example of each.
  ],
};

export default topic;
