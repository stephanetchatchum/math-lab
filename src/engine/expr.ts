/**
 * Small maths expression parser/evaluator for typed answers.
 * Accepts: 2x+2, 2(x+1), x^2, x**2, sqrt(x), e^x, exp(x), ln x, sin(2x), pi, π, ×, ÷, −, ², ³.
 * `log` is the natural log (same as sympy).
 */

export type Node =
  | { k: 'num'; v: number }
  | { k: 'var'; n: string }
  | { k: 'fn'; n: string; a: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; l: Node; r: Node }
  | { k: 'neg'; a: Node };

export class ParseError extends Error {}
export class UnknownName extends Error {}

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log, sqrt: Math.sqrt, abs: Math.abs,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

export function normalise(s: string): string {
  return s
    .replace(/[−–]/g, '-')
    .replace(/[×·⋅∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\*\*/g, '^')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(src: string, vars: string[]): Tok[] {
  const s = normalise(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
      if (!m) throw new ParseError(`Can't read the number at “${s.slice(i, i + 5)}”`);
      out.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i))!;
      const word = m[0];
      i += word.length;
      // split unknown runs like "xy" or "2x" into known names
      if (FUNCS[word] || CONSTS[word] !== undefined || vars.includes(word)) out.push({ t: 'id', v: word });
      else out.push(...splitWord(word, vars));
      continue;
    }
    if ('+-*/^(),'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new ParseError(`Unexpected “${c}”`);
  }
  return out;
}

function splitWord(word: string, vars: string[]): Tok[] {
  // greedy: function names, constants, variables, digits
  const names = [...Object.keys(FUNCS), ...Object.keys(CONSTS), ...vars].sort((a, b) => b.length - a.length);
  const out: Tok[] = [];
  let w = word;
  while (w) {
    const n = names.find((x) => w.startsWith(x));
    if (n) { out.push({ t: 'id', v: n }); w = w.slice(n.length); continue; }
    const d = /^\d+/.exec(w);
    if (d) { out.push({ t: 'num', v: +d[0] }); w = w.slice(d[0].length); continue; }
    throw new UnknownName(`Unknown name “${word}”`);
  }
  return out;
}

export function parse(src: string, vars: string[]): Node {
  const toks = tokenize(src, vars);
  // insert implicit multiplication
  const t: Tok[] = [];
  for (let i = 0; i < toks.length; i++) {
    const a = t[t.length - 1];
    const b = toks[i];
    if (a) {
      const aEnds = a.t === 'num' || (a.t === 'id' && !FUNCS[a.v]) || (a.t === 'op' && a.v === ')');
      const bStarts = b.t === 'num' || b.t === 'id' || (b.t === 'op' && b.v === '(');
      if (aEnds && bStarts) t.push({ t: 'op', v: '*' });
    }
    t.push(b);
  }
  let p = 0;
  const peek = () => t[p];
  const eat = (v?: string) => {
    const x = t[p];
    if (!x || (v && !(x.t === 'op' && x.v === v))) throw new ParseError(v ? `Expected “${v}”` : 'Unexpected end');
    p++;
    return x;
  };
  function expr(): Node {
    let l = term();
    while (peek()?.t === 'op' && (peek()!.v === '+' || peek()!.v === '-')) {
      const op = eat().v as '+' | '-';
      l = { k: 'bin', op, l, r: term() };
    }
    return l;
  }
  function term(): Node {
    let l = unary();
    while (peek()?.t === 'op' && (peek()!.v === '*' || peek()!.v === '/')) {
      const op = eat().v as '*' | '/';
      l = { k: 'bin', op, l, r: unary() };
    }
    return l;
  }
  function unary(): Node {
    if (peek()?.t === 'op' && peek()!.v === '-') { eat(); return { k: 'neg', a: unary() }; }
    if (peek()?.t === 'op' && peek()!.v === '+') { eat(); return unary(); }
    return power();
  }
  function power(): Node {
    const base = atom();
    if (peek()?.t === 'op' && peek()!.v === '^') {
      eat();
      return { k: 'bin', op: '^', l: base, r: unary() }; // right-assoc, allows x^-1
    }
    return base;
  }
  function atom(): Node {
    const x = peek();
    if (!x) throw new ParseError('The answer ends too early');
    if (x.t === 'num') { p++; return { k: 'num', v: x.v }; }
    if (x.t === 'id') {
      p++;
      if (FUNCS[x.v]) {
        // sin x  or sin(x) or sin^2(x)
        if (peek()?.t === 'op' && peek()!.v === '^') {
          eat();
          const ex = atom();
          const a = peek()?.t === 'op' && peek()!.v === '(' ? paren() : power();
          return { k: 'bin', op: '^', l: { k: 'fn', n: x.v, a }, r: ex };
        }
        const a = peek()?.t === 'op' && peek()!.v === '(' ? paren() : power();
        return { k: 'fn', n: x.v, a };
      }
      if (CONSTS[x.v] !== undefined && !vars.includes(x.v)) return { k: 'num', v: CONSTS[x.v] };
      return { k: 'var', n: x.v };
    }
    if (x.t === 'op' && x.v === '(') return paren();
    throw new ParseError(`Unexpected “${x.v}”`);
  }
  function paren(): Node {
    eat('(');
    const e = expr();
    eat(')');
    return e;
  }
  const n = expr();
  if (p < t.length) throw new ParseError(`Unexpected “${(t[p] as { v: string | number }).v}”`);
  return n;
}

export function evaluate(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case 'num': return n.v;
    case 'var': {
      const v = env[n.n];
      if (v === undefined) throw new UnknownName(`Unknown name “${n.n}”`);
      return v;
    }
    case 'neg': return -evaluate(n.a, env);
    case 'fn': return FUNCS[n.n](evaluate(n.a, env));
    case 'bin': {
      const a = evaluate(n.l, env), b = evaluate(n.r, env);
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return Math.pow(a, b);
      }
    }
  }
}

/** Seeded PRNG so checks are reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export type Equiv = 'equal' | 'different' | 'undecided';

/**
 * Compare two expressions by evaluating at random points (positive domain, avoids most branch issues).
 * 'undecided' when too few points are valid (e.g. domain problems) → caller falls back to sympy.
 */
export function equivalent(a: string, b: string, vars: string[]): Equiv {
  let A: Node, B: Node;
  try {
    A = parse(a, vars);
    B = parse(b, vars);
  } catch (e) {
    if (e instanceof UnknownName) return 'undecided';
    throw e;
  }
  const r = rng(12345);
  let valid = 0;
  for (let k = 0; k < 24 && valid < 12; k++) {
    const env: Record<string, number> = {};
    for (const v of vars) env[v] = 0.25 + 2.5 * r();
    let x: number, y: number;
    try {
      x = evaluate(A, env);
      y = evaluate(B, env);
    } catch {
      return 'undecided';
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    valid++;
    const tol = 1e-7 * Math.max(1, Math.abs(x), Math.abs(y));
    if (Math.abs(x - y) > tol) return 'different';
  }
  return valid >= 6 ? 'equal' : 'undecided';
}

/** Evaluate a constant expression such as "2/3" or "sqrt(2)*pi". */
export function evalConst(s: string): number {
  return evaluate(parse(s, []), {});
}
