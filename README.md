# Math Lab

A visual, listenable, offline-capable website for learning the maths, physics and science behind computational science. Sister project of DSA Lab.

Each topic is taught in up to 13 steps, shown one at a time: hook → learn (in parts) → watch → quick recall → play → predict → worked example → your turn → compute (Python) → fill the gap → where it's used → problems → recap.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 (Python needs public/pyodide, see below)
npm run build        # fetches Pyodide packages, type-checks, builds dist/
npm run preview      # serves dist/ on http://localhost:4173 (service worker active)
```

Requires Node 20+.

## Test and verify

```bash
npm test             # unit tests (reader quirks, answer checker, units, progress, rich text)
npm run verify       # checks every topic file (see below)
npm run build && npm run e2e   # Playwright browser tests (desktop + mobile)
```

`npm run verify` runs every Python snippet in Pyodide, using the same harness as the browser, and checks:

- every reference solution passes its tests, and every starter fails them;
- every hand-answer equals its worked solution and an independent sympy computation (`truth`);
- fill-the-gap templates pass when filled, fail when empty, and every alternative answer passes;
- every equation and inline formula has a spoken form and renders in KaTeX;
- every animation frame, sandbox state and simulation is finite and well formed;
- simulations match their analytic checks;
- paragraphs are at most 400 characters, glossary links exist, and prerequisites form a DAG.

The e2e tests:

- walk every step;
- run every reference solution in the in-browser editor, with numpy;
- check the infinite-loop timeout and Python restart;
- replay six speech-engine quirks against a mocked `speechSynthesis`;
- cut the network and use the app offline, Python included;
- check the phone layout.

Screenshots are saved to `screenshots/`. Playwright uses `/usr/bin/google-chrome` locally; set `CHROME_PATH` to override it, or run `npx playwright install chromium` and set `CI=1`.

## Python in the browser (Pyodide)

`scripts/fetch-pyodide.mjs` runs before every build. It puts the Pyodide runtime, plus numpy, scipy, sympy, matplotlib and their dependencies (about 50 MB), into `public/pyodide/`. The site therefore serves Python from its own origin, with no CDN at runtime.

The script takes files from, in this order:

1. a folder named by `$PYODIDE_DIST`;
2. jsDelivr (used on Vercel);
3. the GitHub release tarball.

Every file is checked against the SHA-256 in Pyodide's `pyodide-lock.json`. `public/pyodide` is git-ignored. To change the Pyodide version, edit `PYODIDE_VERSION` in `src/py/version.ts` together with the `pyodide` version in `package.json`.

Code runs in a Web Worker with a 15 s timeout (`VITE_PY_TIMEOUT_MS`). The worker is killed and restarted after a timeout or a crash. `plt` figures are returned as PNGs and shown inline.

## Offline mode

- On the first visit, the service worker caches the core: HTML, every lesson chunk, CSS, fonts and KaTeX, about 1.6 MB.
- Python files are cached as they are used.
- **Settings → Download everything for offline** caches all of Python at once and shows progress. Settings then shows **Offline ready ✓**, and an *Offline* pill appears whenever the network is gone.
- Speech uses the voices installed on your device. Voices marked "needs internet" in the voice menu, such as Chrome's Google voices, don't work offline. Pick one marked "works offline".

## Deploy to Vercel

1. Import `stephanetchatchum/math-lab` in Vercel. The framework preset is Vite; `vercel.json` sets the build command and output directory.
2. Deploy. The build downloads the Pyodide packages from jsDelivr (about 50 MB, verified by hash).
3. Optionally, add the Supabase variables below.

## Progress storage

Progress is stored as one JSON document per learner, behind the `ProgressStore` interface (`src/engine/progress.ts`). It lives in `localStorage` for now. **Settings → Export / Import** moves it between devices. The app never renders until progress has loaded, so saved work can't be overwritten on first load.

### Supabase (planned; the store interface is ready)

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, `createStore()` will return a Supabase store using this table:

```sql
create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## How to add a topic

1. Make sure the topic exists in `src/content/curriculum.ts`, with an id, prerequisites, blurb and icon.
2. Copy `templates/topic-template.ts` to `src/content/topics/<course>/<topic-id>.ts`. The file name must equal the topic id. It is found automatically, so no component changes are needed.
3. Write the steps. `src/content/topics/calculus/calc-derivative.ts` is a complete example of every step type.
   - Rich text supports `**bold**`, `` `code` ``, `[[glossary-id|shown words]]` and `{{tex|spoken form}}`. The spoken form is required.
   - Colour quantities in TeX with `\Q{slope}{…}`, `\Q{h}{…}`, `\Q{x}{…}` and `\Q{f}{…}`. Colour roles use `\R{error}{…}`, `\R{result}{…}` and so on (see `src/content/quantities.ts`).
4. Run `npm run verify` and fix everything it reports. Then run `npm run build && npm run e2e`.

## How to add a course

Add a `Course` to `COURSES` in `src/content/curriculum.ts`. It can switch steps off for the whole course with `disabledSteps`, or per topic with `topicStepOverrides`. Optionally add `src/content/compare/<course-id>.ts` with "Which tool when?" tables.

## Project layout

```
src/content/      curriculum, types, glossary, compare tables, topics/<course>/<id>.ts
src/engine/       reader (speech), answer checker, expression parser, units, progress
src/py/           Pyodide worker, client (timeout/restart), shared Python harness
src/offline/      service-worker registration, offline status, "download everything"
src/ui/           app shell, pages, step views, SVG scenes, animation player, sandbox, editor
scripts/          fetch-pyodide, verify
tests/unit, tests/e2e, tests/mocks
```
