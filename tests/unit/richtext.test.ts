import { describe, it, expect } from 'vitest';
import { parseRich, spokenOf } from '../../src/content/richtext';

describe('rich text', () => {
  it('handles TeX containing }} and |', () => {
    const s = parseRich('Root: {{\\frac{1}{2\\sqrt{x}}|1 over 2 root x}} and {{|x||absolute x}}.');
    expect(s.filter((g) => g.t === 'math').map((g) => (g as { tex: string }).tex)).toEqual(['\\frac{1}{2\\sqrt{x}}', '|x|']);
    expect(spokenOf('a {{x^2|x squared}} b')).toBe('a x squared b');
  });
  it('parses terms, code and bold', () => {
    const s = parseRich('**bold** [[limit|limits]] `np.sin`');
    expect(s.map((g) => g.t)).toEqual(['text', 'text', 'term', 'text', 'code']);
  });
  it('rejects maths without a spoken form', () => {
    expect(() => parseRich('bad {{x^2}} here')).toThrow(/spoken/);
  });
});
