import type { TopicMeta } from './types';

/** Longest-path depth of each topic in the prerequisite DAG. Throws on cycles or unknown ids. */
export function depths(topics: TopicMeta[]): Record<string, number> {
  const by = new Map(topics.map((t) => [t.id, t]));
  const memo: Record<string, number> = {};
  const visiting = new Set<string>();
  const d = (id: string, path: string[]): number => {
    if (memo[id] !== undefined) return memo[id];
    const t = by.get(id);
    if (!t) throw new Error(`Unknown prerequisite “${id}” (from ${path.at(-1)})`);
    if (visiting.has(id)) throw new Error(`Prerequisite cycle: ${[...path, id].join(' → ')}`);
    visiting.add(id);
    const v = t.prereqs.length ? 1 + Math.max(...t.prereqs.map((p) => d(p, [...path, id]))) : 0;
    visiting.delete(id);
    return (memo[id] = v);
  };
  topics.forEach((t) => d(t.id, []));
  return memo;
}

export function ancestors(topics: TopicMeta[], id: string): Set<string> {
  const by = new Map(topics.map((t) => [t.id, t]));
  const out = new Set<string>();
  const walk = (x: string) => by.get(x)?.prereqs.forEach((p) => !out.has(p) && (out.add(p), walk(p)));
  walk(id);
  return out;
}

export function descendants(topics: TopicMeta[], id: string): Set<string> {
  const out = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of topics)
      if (!out.has(t.id) && t.prereqs.some((p) => p === id || out.has(p))) {
        out.add(t.id);
        grew = true;
      }
  }
  return out;
}
