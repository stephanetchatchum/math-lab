/**
 * Rich text mini-markup → segments. Shared by the renderer (React) and the
 * reader (speech), so what is highlighted always matches what is spoken.
 */
export type Seg =
  | { t: 'text'; s: string; bold?: boolean }
  | { t: 'math'; tex: string; say: string }
  | { t: 'term'; id: string; s: string; bold?: boolean }
  | { t: 'code'; s: string };

// {{tex|spoken}}: the spoken part has no braces or bars, so TeX may contain `}}` and `|`.
const TOKEN = /\{\{([\s\S]+?)\|([^{}|]*)\}\}|\[\[([^\]]+?)\]\]|`([^`]+)`|\*\*/g;

export function parseRich(src: string): Seg[] {
  const out: Seg[] = [];
  let bold = false;
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: 'text', s: src.slice(last, i), bold });
    if (m[0] === '**') {
      bold = !bold;
    } else if (m[1] !== undefined) {
      out.push({ t: 'math', tex: m[1].trim(), say: m[2].trim() });
    } else if (m[3] !== undefined) {
      const [id, shown] = m[3].split('|');
      out.push({ t: 'term', id: id.trim(), s: (shown ?? id).trim(), bold });
    } else if (m[4] !== undefined) {
      out.push({ t: 'code', s: m[4] });
    }
    last = i + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', s: src.slice(last), bold });
  for (const g of out) if (g.t === 'text' && g.s.includes('{{')) throw new Error(`Inline maths without spoken form near “${g.s.slice(g.s.indexOf('{{'), g.s.indexOf('{{') + 40)}”`);
  return out;
}

/** Plain text as it appears on screen (maths shown as its spoken form). */
export function spokenOf(src: string): string {
  return parseRich(src)
    .map((g) => (g.t === 'math' ? g.say : g.s))
    .join('');
}

/** Visible character length, used for the paragraph length rule (maths counts as ~its spoken length/2). */
export function visibleLength(src: string): number {
  return parseRich(src).reduce((n, g) => n + (g.t === 'math' ? Math.ceil(g.tex.length / 2) : g.s.length), 0);
}

/** Spoken string plus a map from character offsets back to segment indices. */
export function spokenMap(segs: Seg[]): { text: string; spans: { start: number; end: number; seg: number }[] } {
  let text = '';
  const spans: { start: number; end: number; seg: number }[] = [];
  segs.forEach((g, i) => {
    const s = g.t === 'math' ? g.say : g.s;
    spans.push({ start: text.length, end: text.length + s.length, seg: i });
    text += s;
  });
  return { text, spans };
}

export function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}
