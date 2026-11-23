/**
 * Units: parse "9.81 m/s^2", "35 km/h", "2.5 kN·m", convert to SI and compare dimensions.
 * Dimensions vector: [m, kg, s, A, K, mol]
 */
import { evalConst } from './expr';

type Dim = [number, number, number, number, number, number];
interface U { f: number; d: Dim }

const Z: Dim = [0, 0, 0, 0, 0, 0];
const d = (m = 0, kg = 0, s = 0, A = 0, K = 0, mol = 0): Dim => [m, kg, s, A, K, mol];

const BASE: Record<string, U> = {
  m: { f: 1, d: d(1) },
  g: { f: 1e-3, d: d(0, 1) },
  s: { f: 1, d: d(0, 0, 1) },
  min: { f: 60, d: d(0, 0, 1) },
  h: { f: 3600, d: d(0, 0, 1) },
  day: { f: 86400, d: d(0, 0, 1) },
  yr: { f: 365.25 * 86400, d: d(0, 0, 1) },
  A: { f: 1, d: d(0, 0, 0, 1) },
  K: { f: 1, d: d(0, 0, 0, 0, 1) },
  mol: { f: 1, d: d(0, 0, 0, 0, 0, 1) },
  N: { f: 1, d: d(1, 1, -2) },
  J: { f: 1, d: d(2, 1, -2) },
  W: { f: 1, d: d(2, 1, -3) },
  Pa: { f: 1, d: d(-1, 1, -2) },
  Hz: { f: 1, d: d(0, 0, -1) },
  C: { f: 1, d: d(0, 0, 1, 1) },
  V: { f: 1, d: d(2, 1, -3, -1) },
  ohm: { f: 1, d: d(2, 1, -3, -2) },
  'Ω': { f: 1, d: d(2, 1, -3, -2) },
  L: { f: 1e-3, d: d(3) },
  rad: { f: 1, d: Z },
  deg: { f: Math.PI / 180, d: Z },
  '°': { f: Math.PI / 180, d: Z },
  eV: { f: 1.602176634e-19, d: d(2, 1, -2) },
};
const PREFIX: Record<string, number> = { G: 1e9, M: 1e6, k: 1e3, c: 1e-2, m: 1e-3, u: 1e-6, 'µ': 1e-6, n: 1e-9 };

function lookup(sym: string): U {
  if (BASE[sym]) return BASE[sym];
  const p = sym[0];
  const rest = sym.slice(1);
  if (PREFIX[p] && BASE[rest] && !['min', 'mol', 'deg', 'rad', 'ohm', 'day', 'yr'].includes(rest)) {
    return { f: PREFIX[p] * BASE[rest].f, d: BASE[rest].d };
  }
  throw new Error(`Unknown unit “${sym}”`);
}

/** Parse a unit expression like "m/s^2", "kg*m^2/s^2", "N·m", "m s^-1". */
export function parseUnit(src: string): U {
  const s = src.replace(/[·⋅*]/g, ' ').replace(/²/g, '^2').replace(/³/g, '^3').replace(/−/g, '-').trim();
  if (!s) return { f: 1, d: [...Z] as Dim };
  let f = 1;
  const dim: Dim = [...Z] as Dim;
  let sign = 1;
  const re = /\s*(\/)?\s*([A-Za-zµΩ°]+)(?:\^\(?(-?\d+)\)?)?/y;
  let i = 0;
  while (i < s.length) {
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) throw new Error(`Can't read the unit “${s}”`);
    if (m[1]) sign = -1;
    const u = lookup(m[2]);
    const e = (m[3] ? parseInt(m[3], 10) : 1) * sign;
    f *= Math.pow(u.f, e);
    for (let k = 0; k < 6; k++) dim[k] += u.d[k] * e;
    i = re.lastIndex;
    while (s[i] === ' ') i++;
  }
  return { f, d: dim };
}

export function sameDim(a: Dim, b: Dim) {
  return a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
}

/** Split "12.5 m/s" into number and unit. The number part may be an expression ("2/3", "3e8"). */
export function splitQuantity(input: string): { value: number; unit: string } {
  const s = input.trim().replace(/−/g, '-');
  // try every split point from the right; prefer the longest unit that parses
  for (let i = 0; i <= s.length; i++) {
    const num = s.slice(0, i).trim();
    const unit = s.slice(i).trim();
    if (!num) continue;
    if (unit && !/^[A-Za-zµΩ°]/.test(unit)) continue;
    try {
      const v = evalConst(num);
      if (!Number.isFinite(v)) continue;
      if (unit) parseUnit(unit);
      return { value: v, unit };
    } catch {
      /* keep trying */
    }
  }
  throw new Error('Type a number, optionally followed by a unit, e.g. 9.8 m/s^2');
}

export type NumericVerdict = { ok: boolean; message: string };

export function checkNumeric(
  input: string,
  expected: { value: number; relTol?: number; absTol?: number; unit?: string },
): NumericVerdict {
  let q: { value: number; unit: string };
  try {
    q = splitQuantity(input);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  let value = q.value;
  if (expected.unit) {
    if (!q.unit) return { ok: false, message: `Add units (expected something like ${expected.unit}).` };
    let ue: U, ug: U;
    try {
      ue = parseUnit(expected.unit);
      ug = parseUnit(q.unit);
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
    if (!sameDim(ue.d, ug.d)) return { ok: false, message: `Those units measure a different kind of quantity than ${expected.unit}.` };
    value = (q.value * ug.f) / ue.f; // in expected units
  } else if (q.unit) {
    try {
      const u = parseUnit(q.unit);
      if (!sameDim(u.d, Z)) return { ok: false, message: 'This answer has no units.' };
      value = q.value * u.f;
    } catch {
      return { ok: false, message: 'This answer has no units.' };
    }
  }
  const rel = expected.relTol ?? 1e-3;
  const abs = expected.absTol ?? 1e-9;
  const ok = Math.abs(value - expected.value) <= Math.max(abs, rel * Math.abs(expected.value));
  return { ok, message: ok ? 'Correct.' : 'Not quite.' };
}
