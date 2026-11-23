import type { Answer } from '../content/types';
import { equivalent, ParseError, UnknownName } from './expr';
import { checkNumeric } from './units';

export interface Verdict {
  ok: boolean;
  /** true when the input couldn't be read (doesn't count as an attempt) */
  invalid?: boolean;
  message: string;
}

export type SympyEquiv = (a: string, b: string, vars: string[]) => Promise<boolean | null>;

export type AnswerInput = string | number | number[];

/**
 * Check an answer. Expressions are compared in JS first (instant, offline, no Python);
 * only when JS can't decide is sympy asked (via the Python worker).
 */
export async function checkAnswer(answer: Answer, input: AnswerInput, sympy?: SympyEquiv): Promise<Verdict> {
  switch (answer.kind) {
    case 'mc':
      return input === answer.correct ? { ok: true, message: 'Correct.' } : { ok: false, message: 'Not quite.' };
    case 'order': {
      const arr = input as number[];
      const ok = arr.length === answer.steps.length && arr.every((v, i) => v === i);
      return { ok, message: ok ? 'Correct order.' : 'Some steps are out of order.' };
    }
    case 'numeric': {
      const s = String(input).trim();
      if (!s) return { ok: false, invalid: true, message: 'Type an answer first.' };
      const v = checkNumeric(s, answer);
      const invalid = !v.ok && v.message !== 'Not quite.';
      return { ok: v.ok, invalid, message: v.message };
    }
    case 'expr': {
      const s = String(input).trim();
      if (!s) return { ok: false, invalid: true, message: 'Type an answer first.' };
      try {
        const r = equivalent(s, answer.expr, answer.vars);
        if (r === 'equal') return { ok: true, message: 'Correct — equivalent to the expected answer.' };
        if (r === 'different') return { ok: false, message: 'Not equivalent to the expected answer.' };
      } catch (e) {
        if (e instanceof ParseError) return { ok: false, invalid: true, message: `I can't read that: ${e.message}.` };
        if (!(e instanceof UnknownName)) throw e;
      }
      if (!sympy) return { ok: false, invalid: true, message: 'I couldn’t decide. Try writing it with only + − × ÷ ^ and the given variables.' };
      const r = await sympy(s, answer.expr, answer.vars);
      if (r === null) return { ok: false, invalid: true, message: 'Sympy couldn’t read that expression.' };
      return r ? { ok: true, message: 'Correct (checked with sympy).' } : { ok: false, message: 'Not equivalent (checked with sympy).' };
    }
  }
}
