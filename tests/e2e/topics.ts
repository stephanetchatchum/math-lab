import fs from 'node:fs';
import path from 'node:path';
import type { Topic } from '../../src/content/types';

/** Every built topic file, loaded the same way verify does. */
export async function allTopics(): Promise<Topic[]> {
  const dir = path.resolve('src/content/topics');
  const out: Topic[] = [];
  for (const c of fs.readdirSync(dir))
    for (const f of fs.readdirSync(path.join(dir, c)).filter((x) => x.endsWith('.ts')))
      out.push((await import(path.join(dir, c, f))).default as Topic);
  return out;
}
