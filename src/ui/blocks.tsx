import type { ReactNode } from 'react';
import type { Block, Eq, NoteKind, Role, QuantityClass, Section } from '../content/types';
import type { ReadLine } from '../engine/reader';
import { spokenOf } from '../content/richtext';
import { Rich } from './Rich';
import { Tex } from './Tex';
import { SceneSvg } from './visual/SceneSvg';
import { AnimationPlayer } from './visual/AnimationPlayer';

export const NOTE_META: Record<NoteKind, { icon: string; label: string }> = {
  remember: { icon: '📌', label: 'Remember' },
  why: { icon: '❓', label: 'Why' },
  pitfall: { icon: '⚠️', label: 'Pitfall' },
  intuition: { icon: '💡', label: 'Intuition' },
  python: { icon: '🐍', label: 'In Python' },
  compsci: { icon: '🖥️', label: 'In computational science' },
  units: { icon: '📏', label: 'Units' },
};

export function EqView({ eq, line }: { eq: Eq; line?: number }) {
  return (
    <div className="eq blk" data-line={line} data-kind="eq">
      <span className="seg" data-a={0} data-b={eq.say.length} style={{ flex: 1 }}>
        <Tex tex={eq.tex} say={eq.say} display />
      </span>
      {eq.label && <span className="eq-label">{eq.label}</span>}
    </div>
  );
}

const PY_KW = new Set('def return if elif else for while in import from as and or not None True False lambda with class try except raise assert pass break continue is yield global'.split(' '));

/** Tiny Python highlighter with quantity colours for named identifiers. */
export function PyCode({ code, colors }: { code: string; colors?: Record<string, Role | QuantityClass> }) {
  const out: ReactNode[] = [];
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')|(\b\d+\.?\d*(?:e[+-]?\d+)?\b)|([A-Za-z_][A-Za-z_0-9]*)|([\s\S])/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    const [t] = m;
    if (m[1]) out.push(<span key={k++} className="tk-c">{t}</span>);
    else if (m[2]) out.push(<span key={k++} className="tk-s">{t}</span>);
    else if (m[3]) out.push(<span key={k++} className="tk-n">{t}</span>);
    else if (m[4]) {
      const c = colors?.[t];
      if (c) out.push(<span key={k++} className={c.startsWith('q-') ? c : `r-${c}`}>{t}</span>);
      else if (PY_KW.has(t)) out.push(<span key={k++} className="tk-k">{t}</span>);
      else out.push(t);
    } else out.push(t);
  }
  return <code>{out}</code>;
}

/**
 * Render lesson sections AND produce the reader's lines in one pass,
 * so data-line indices always match what is spoken.
 */
export function renderSections(sections: Section[], startNumber = 1): { nodes: ReactNode[]; lines: ReadLine[]; sectionFirstLine: number[] } {
  const lines: ReadLine[] = [];
  const sectionFirstLine: number[] = [];
  const add = (text: string, kind: ReadLine['kind'], id: string) => {
    lines.push({ id, text, kind });
    return lines.length - 1;
  };
  const nodes = sections.map((sec, si) => {
    sectionFirstLine.push(lines.length);
    const h = add(`${startNumber + si}. ${sec.title}.`, 'heading', `${sec.id}-h`);
    return (
      <section key={sec.id} id={sec.id} data-section={si}>
        <h2 className="blk" data-line={h}>
          <span className="seg" data-a={0} data-b={lines[h].text.length}>
            {startNumber + si}. {sec.title}
          </span>
        </h2>
        {sec.blocks.map((b, bi) => renderBlock(b, `${sec.id}-${bi}`, add))}
      </section>
    );
  });
  return { nodes, lines, sectionFirstLine };
}

function renderBlock(b: Block, key: string, add: (text: string, kind: ReadLine['kind'], id: string) => number): ReactNode {
  switch (b.type) {
    case 'p': {
      const i = add(spokenOf(b.text), 'text', key);
      return (
        <p key={key} className="blk" data-line={i}>
          <Rich text={b.text} />
        </p>
      );
    }
    case 'eq': {
      const i = add(b.eq.say, 'eq', key);
      return <EqView key={key} eq={b.eq} line={i} />;
    }
    case 'note': {
      const meta = NOTE_META[b.kind];
      const prefix = `${meta.label}: `;
      const i = add(prefix + spokenOf(b.text), 'text', key);
      // offsets inside the note body are shifted by the spoken prefix
      return (
        <aside key={key} className={`note ${b.kind} blk`} data-line={i}>
          <span className="ni" aria-hidden="true">
            {meta.icon}
          </span>
          <div>
            <div className="nk">
              <span className="seg" data-a={0} data-b={prefix.length}>
                {meta.label}
              </span>
            </div>
            <Rich text={b.text} as="p" offset={prefix.length} />
          </div>
        </aside>
      );
    }
    case 'list':
      return (
        <ul key={key}>
          {b.items.map((it, j) => {
            const i = add(spokenOf(it), 'text', `${key}-${j}`);
            return (
              <li key={j} className="blk" data-line={i}>
                <Rich text={it} />
              </li>
            );
          })}
        </ul>
      );
    case 'figure': {
      const i = b.caption ? add(spokenOf(b.caption), 'caption', key) : undefined;
      return (
        <figure key={key} className="blk" data-line={i}>
          <SceneSvg scene={b.scene} />
          {b.caption && (
            <figcaption>
              <Rich text={b.caption} />
            </figcaption>
          )}
        </figure>
      );
    }
    case 'anim': {
      const i = add(`Animation: ${b.anim.title}. Press play to watch it.`, 'caption', key);
      return (
        <div key={key} className="blk" data-line={i}>
          <h3 className="anim-title">
            <span className="seg" data-a={11} data-b={11 + b.anim.title.length}>
              {b.anim.title}
            </span>
          </h3>
          <AnimationPlayer anim={b.anim} />
        </div>
      );
    }
    case 'code': {
      const i = add(b.say, 'code', key);
      return (
        <pre key={key} className="static blk" data-line={i}>
          <PyCode code={b.code} colors={b.colors} />
        </pre>
      );
    }
    case 'table': {
      const head = add(b.head.map(spokenOf).join(', ') + '.', 'text', `${key}-h`);
      return (
        <div key={key} className="table-wrap">
          <table>
            <thead>
              <tr className="blk" data-line={head}>
                {b.head.map((c, j) => (
                  <th key={j}>
                    <Rich text={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => {
                const i = add(r.map(spokenOf).join(', ') + '.', 'text', `${key}-${ri}`);
                return (
                  <tr key={ri} className="blk" data-line={i}>
                    {r.map((c, j) => (
                      <td key={j}>
                        <Rich text={c} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
  }
}

export function readingMinutes(lines: ReadLine[]): number {
  const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 150)); // ~150 wpm, a calm listening pace
}
