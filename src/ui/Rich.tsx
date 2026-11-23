import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { parseRich, type Seg } from '../content/richtext';
import { lookupTerm } from '../content/registry';
import { Tex } from './Tex';

/**
 * Renders rich text. Every segment carries its offsets in the *spoken* string
 * (data-a / data-b), so the reader can highlight the exact word being spoken.
 */
export function Rich({ text, as = 'span', offset = 0 }: { text: string; as?: 'span' | 'p' | 'div'; offset?: number }) {
  const segs = parseRich(text);
  let off = offset;
  const kids: ReactNode[] = segs.map((g, i) => {
    const spoken = g.t === 'math' ? g.say : g.s;
    const a = off;
    off += spoken.length;
    return <SegView key={i} g={g} a={a} b={off} />;
  });
  const Tag = as;
  return <Tag className="rich">{kids}</Tag>;
}

function SegView({ g, a, b }: { g: Seg; a: number; b: number }) {
  if (g.t === 'math')
    return (
      <span className="seg seg-math" data-a={a} data-b={b}>
        <Tex tex={g.tex} say={g.say} />
      </span>
    );
  if (g.t === 'term') return <Term id={g.id} text={g.s} a={a} b={b} bold={g.bold} />;
  if (g.t === 'code')
    return (
      <code className="seg" data-a={a} data-b={b}>
        {g.s}
      </code>
    );
  const inner = g.bold ? <strong>{g.s}</strong> : g.s;
  return (
    <span className="seg" data-a={a} data-b={b}>
      {inner}
    </span>
  );
}

function Term({ id, text, a, b, bold }: { id: string; text: string; a: number; b: number; bold?: boolean }) {
  const [open, setOpen] = useState(false);
  const e = lookupTerm(id);
  return (
    <span
      className="seg term"
      data-a={a}
      data-b={b}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(ev) => {
        ev.stopPropagation();
        setOpen((o) => !o);
      }}
      aria-describedby={open ? `term-${id}` : undefined}
    >
      {bold ? <strong>{text}</strong> : text}
      {open && e && (
        <span className="term-card" role="tooltip" id={`term-${id}`}>
          <b>{e.term}</b>
          <Rich text={e.def} />
          <Link className="faint small-link" to={`/glossary#${id}`} onClick={(ev) => ev.stopPropagation()}>
            glossary →
          </Link>
        </span>
      )}
    </span>
  );
}
