/**
 * Progress: one JSON document per learner. `ProgressStore` hides where it lives
 * (localStorage now; Supabase later, same document shape).
 */

export interface TopicProgress {
  step: number; // index of current step
  completed: string[]; // step ids completed
  answers: Record<string, { input: unknown; ok: boolean; tries: number; hintsUsed?: number }>;
  code: Record<string, string>;
  ownWords?: string;
  done?: boolean;
  doneAt?: string; // ISO date
  total?: number; // number of steps (for progress bars without loading the topic)
}

export interface ReviewItem {
  stage: number; // index into REVIEW_INTERVALS
  due: string; // YYYY-MM-DD
  history: { date: string; ok: boolean }[];
}

export interface Settings {
  theme: 'slate' | 'chalk' | 'paper';
  textScale: number;
  rate: number;
  voice: string;
  skipCode: boolean;
  narrate: boolean;
  focus: boolean;
  reducedMotion: 'system' | 'on' | 'off';
}

export interface ProgressData {
  version: 1;
  topics: Record<string, TopicProgress>;
  review: Record<string, ReviewItem>;
  solved: Record<string, string>; // problem id → ISO date first solved
  activity: string[]; // YYYY-MM-DD days with activity (for streak)
  settings: Settings;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'slate',
  textScale: 1,
  rate: 1,
  voice: '',
  skipCode: true,
  narrate: false,
  focus: false,
  reducedMotion: 'system',
};

export function emptyProgress(): ProgressData {
  return { version: 1, topics: {}, review: {}, solved: {}, activity: [], settings: { ...DEFAULT_SETTINGS }, updatedAt: new Date().toISOString() };
}

export interface ProgressStore {
  readonly kind: 'local' | 'supabase';
  load(): Promise<ProgressData>;
  save(data: ProgressData): Promise<void>;
}

const KEY = 'mathlab.progress.v1';

export class LocalStore implements ProgressStore {
  readonly kind = 'local' as const;
  constructor(private storage: Storage = localStorage) {}
  async load(): Promise<ProgressData> {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return emptyProgress();
      return migrate(JSON.parse(raw));
    } catch {
      // Corrupt data: keep a copy rather than overwrite it silently.
      const raw = this.storage.getItem(KEY);
      if (raw) this.storage.setItem(`${KEY}.corrupt.${Date.now()}`, raw);
      return emptyProgress();
    }
  }
  async save(data: ProgressData): Promise<void> {
    this.storage.setItem(KEY, JSON.stringify(data));
  }
}

/** Accepts any older/partial document and fills defaults. Throws on non-progress JSON. */
export function migrate(x: unknown): ProgressData {
  if (!x || typeof x !== 'object' || (x as { version?: unknown }).version !== 1) throw new Error('Not a Math Lab progress file.');
  const d = x as Partial<ProgressData>;
  return {
    version: 1,
    topics: d.topics ?? {},
    review: d.review ?? {},
    solved: d.solved ?? {},
    activity: d.activity ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
    updatedAt: d.updatedAt ?? new Date().toISOString(),
  };
}

export function createStore(): ProgressStore {
  // Supabase: planned (see README). When VITE_SUPABASE_URL/KEY are set a SupabaseStore will be returned here.
  return new LocalStore();
}

// ------------------------------------------------------------------ dates, streak, review

export function today(d = new Date()): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function streak(activity: string[], now = today()): number {
  const set = new Set(activity);
  let n = 0;
  let day = set.has(now) ? now : addDays(now, -1); // today not done yet doesn't break the streak
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/**
 * Spaced repetition, deliberately simple:
 *   finish a topic → review in 1 day.
 *   review right   → move one step along 1, 3, 7, 14, 30 days (stays at 30).
 *   review wrong   → back to 1 day.
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export function scheduleFirst(now = today()): ReviewItem {
  return { stage: 0, due: addDays(now, REVIEW_INTERVALS[0]), history: [] };
}

export function scheduleAfter(item: ReviewItem, ok: boolean, now = today()): ReviewItem {
  const stage = ok ? Math.min(item.stage + 1, REVIEW_INTERVALS.length - 1) : 0;
  return { stage, due: addDays(now, REVIEW_INTERVALS[stage]), history: [...item.history, { date: now, ok }] };
}

export function dueReviews(data: ProgressData, now = today()): string[] {
  return Object.entries(data.review)
    .filter(([, r]) => r.due <= now)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}
