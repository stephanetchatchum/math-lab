/**
 * Finds topic files by convention, so adding a topic never touches components:
 *   src/content/topics/<course>/<topic-id>.ts   (default export: Topic)
 *   src/content/compare/<course-id>.ts          (default export: CompareTable[])
 */
import { COURSES, META_BY_ID } from './curriculum';
import { CORE_GLOSSARY } from './glossary';
import type { CompareTable, Course, GlossaryEntry, Step, Topic } from './types';

type TopicModule = { default: Topic };
const topicFiles = import.meta.glob<TopicModule>('./topics/*/*.ts');
const compareFiles = import.meta.glob<{ default: CompareTable[] }>('./compare/*.ts', { eager: true });

const idOf = (path: string) => path.split('/').pop()!.replace(/\.ts$/, '');
const LOADERS: Record<string, () => Promise<TopicModule>> = Object.fromEntries(
  Object.entries(topicFiles).map(([p, f]) => [idOf(p), f]),
);

export const COMPARE: Record<string, CompareTable[]> = Object.fromEntries(
  Object.entries(compareFiles).map(([p, m]) => [idOf(p), m.default]),
);

export function isBuilt(id: string): boolean {
  return id in LOADERS;
}
export const BUILT_IDS = (): string[] => COURSES.flatMap((c) => c.topics.map((t) => t.id)).filter(isBuilt);

const loaded = new Map<string, Topic>();
export async function loadTopic(id: string): Promise<Topic> {
  const hit = loaded.get(id);
  if (hit) return hit;
  const l = LOADERS[id];
  if (!l) throw new Error(`Topic “${id}” isn’t built yet.`);
  const t = (await l()).default;
  loaded.set(id, t);
  t.glossary?.forEach((g) => GLOSSARY.set(g.id, { ...g, topic: g.topic ?? id }));
  return t;
}
export function loadedTopic(id: string): Topic | undefined {
  return loaded.get(id);
}
export async function loadAllTopics(): Promise<Topic[]> {
  return Promise.all(BUILT_IDS().map(loadTopic));
}

const GLOSSARY = new Map<string, GlossaryEntry>(CORE_GLOSSARY.map((g) => [g.id, g]));
export function lookupTerm(id: string): GlossaryEntry | undefined {
  return GLOSSARY.get(id);
}
export function allGlossary(): GlossaryEntry[] {
  return [...GLOSSARY.values()].sort((a, b) => a.term.localeCompare(b.term));
}

export function courseOf(topicId: string): Course | undefined {
  const m = META_BY_ID[topicId];
  return COURSES.find((c) => c.id === m?.course);
}

/** Steps after applying course-level and per-topic switches. */
export function stepsFor(t: Topic): Step[] {
  const c = courseOf(t.id);
  const off = new Set([...(c?.disabledSteps ?? []), ...(c?.topicStepOverrides?.[t.id] ?? [])]);
  return t.steps.filter((s) => !off.has(s.kind));
}
