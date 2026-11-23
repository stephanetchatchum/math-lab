import katex from 'katex';
import { memo, useMemo } from 'react';
import { KATEX_MACROS } from '../content/quantities';

const cache = new Map<string, string>();

export function renderTex(tex: string, display: boolean): string {
  const key = (display ? 'D' : 'I') + tex;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: (ctx) => ctx.command === '\\htmlClass',
      macros: { ...KATEX_MACROS },
      output: 'html',
    });
    cache.set(key, html);
  }
  return html;
}

/** KaTeX maths. `say` becomes the accessible label, so screen readers and our reader agree. */
export const Tex = memo(function Tex({ tex, say, display = false }: { tex: string; say?: string; display?: boolean }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  return (
    <span
      className={display ? 'tex tex-d' : 'tex'}
      role={say ? 'math' : undefined}
      aria-label={say}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
