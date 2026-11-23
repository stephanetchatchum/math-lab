import { describe, it, expect } from 'vitest';
import { equivalent, evalConst } from '../../src/engine/expr';
import { checkNumeric, parseUnit } from '../../src/engine/units';
import { checkAnswer } from '../../src/engine/checker';

describe('expression equivalence', () => {
  const eq = (a: string, b: string, v = ['x']) => equivalent(a, b, v);
  it('accepts algebraically equal forms', () => {
    expect(eq('2x+2', '2(x+1)')).toBe('equal');
    expect(eq('2*x + 2', '2 (x + 1)')).toBe('equal');
    expect(eq('x^2', 'x**2')).toBe('equal');
    expect(eq('3x²', '3*x^2')).toBe('equal');
    expect(eq('sin(2x)', '2 sin x cos x')).toBe('equal');
    expect(eq('e^x', 'exp(x)')).toBe('equal');
    expect(eq('1/(2sqrt(x))', '0.5*x^(-1/2)')).toBe('equal');
    expect(eq('-x^2', '-(x^2)')).toBe('equal');
    expect(eq('2xh+h^2', 'h(2x+h)', ['x', 'h'])).toBe('equal');
    expect(eq('ln(x)', 'log(x)')).toBe('equal');
  });
  it('rejects different expressions', () => {
    expect(eq('2x+1', '2(x+1)')).toBe('different');
    expect(eq('x^2', '2x')).toBe('different');
    expect(eq('-x^2', '(-x)^2')).toBe('different');
  });
  it('is undecided for unknown names', () => {
    expect(eq('gamma(x)', 'x')).toBe('undecided');
  });
  it('evaluates constants', () => {
    expect(evalConst('2/3')).toBeCloseTo(0.6667, 3);
    expect(evalConst('sqrt(2)π')).toBeCloseTo(4.4429, 3);
  });
});

describe('units', () => {
  it('parses compound units', () => {
    expect(parseUnit('km/h').f).toBeCloseTo(1000 / 3600);
    expect(parseUnit('m/s^2').d).toEqual([1, 0, -2, 0, 0, 0]);
    expect(parseUnit('kg·m²/s²').d).toEqual(parseUnit('J').d);
  });
  it('accepts equivalent units and rejects wrong dimensions', () => {
    expect(checkNumeric('20 m/s', { value: 72, unit: 'km/h' }).ok).toBe(true);
    expect(checkNumeric('72 km/h', { value: 20, unit: 'm/s' }).ok).toBe(true);
    expect(checkNumeric('2000 mm', { value: 2, unit: 'm' }).ok).toBe(true);
    expect(checkNumeric('20 m', { value: 20, unit: 'm/s' }).ok).toBe(false);
    expect(checkNumeric('20', { value: 20, unit: 'm/s' }).message).toMatch(/Add units/);
    expect(checkNumeric('3e8 m/s', { value: 3e8, unit: 'm/s' }).ok).toBe(true);
  });
});

describe('checkAnswer', () => {
  it('falls back to sympy when JS cannot decide', async () => {
    let called = false;
    const v = await checkAnswer({ kind: 'expr', expr: 'x', vars: ['x'] }, 'gamma(x)', async () => { called = true; return false; });
    expect(called).toBe(true);
    expect(v.ok).toBe(false);
  });
  it('does not call sympy when JS decides', async () => {
    let called = false;
    const v = await checkAnswer({ kind: 'expr', expr: '2(x+1)', vars: ['x'] }, '2x+2', async () => { called = true; return null; });
    expect(called).toBe(false);
    expect(v.ok).toBe(true);
  });
});
