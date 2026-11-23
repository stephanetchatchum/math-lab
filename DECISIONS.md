# Decisions

## Architecture

- **React + Vite + TypeScript, hash router, static hosting.** No server is needed, and the hash router means Vercel needs no rewrite rules.
- **Content is data.** `src/content/topics/<course>/<id>.ts` files are found with `import.meta.glob`, and each is loaded lazily as its own chunk. All step types live in one typed union (`src/content/types.ts`), so malformed content fails `tsc` or `npm run verify` instead of failing at runtime. Visuals are declared as data (`Scene`, `AnimationDef`, `SandboxDef`, `SimDef`) and drawn by generic components, so adding a topic never touches components.
- **One pass renders text and builds the reader's lines** (`renderSections` in `src/ui/blocks.tsx`). The `data-line` index on screen therefore always matches the line being spoken. Every spoken segment carries its character offsets (`data-a`/`data-b`), which the word highlight uses.
- **Python:** Pyodide 0.29.5 (CPython 3.13) runs in a module Web Worker, one job at a time.
  - A hard timeout terminates the worker, and a fresh one starts on the next run.
  - Package downloads don't count against the time limit.
  - The same harness (`src/py/harness.ts`) runs in the browser and in `npm run verify` under Node. "Passes verify" therefore means "passes in the browser".
- **Packages come from the build, not a CDN.** `scripts/fetch-pyodide.mjs` hash-checks every file against Pyodide's lock file.
  - In this build sandbox the Pyodide CDN is blocked. The wheels in `public/pyodide` were found already present in the workspace and confirmed byte-identical to the official 0.29.5 hashes before use.
  - On Vercel the script downloads them from jsDelivr.
  - I chose 0.29.5 over the newer 314.x because 0.29 is the established line whose packages are known to work together.
- **Answer checking is JS first, sympy second** (agreed in planning).
  - Expressions are compared by evaluating both at 12 seeded random points. The checker gives a verdict only when they all agree or one clearly differs. "Undecided" (unknown names, domain trouble) falls back to sympy in the worker.
  - Numbers with units are converted to SI and compared by dimension, so −0.4 L/s is accepted for −24 L/min.
- **Hand problems carry an independent `truth`.** This is a sympy expression such as `diff(x**3, x)`. Verify requires answer = worked solution = truth, so a typo in any one of the three is caught.
- **Progress:** one JSON document behind `ProgressStore`. It uses localStorage now; Supabase is deferred (agreed in planning) and the SQL is in the README. Saves are debounced and flushed on `pagehide`. The app renders nothing until progress has loaded, and corrupt data is copied aside rather than overwritten.
- **Spaced repetition:** finishing a topic schedules a review in 1 day. Getting both the recall question and the problem right moves the topic one interval along 1 → 3 → 7 → 14 → 30 days. Getting either wrong resets it to 1 day. This is simple and predictable, and it matches the brief.
- **Offline:** Workbox precaches the core (about 1.6 MB, every lesson chunk included). Python goes into a separate runtime cache, `pyodide-<version>`, filled on use or all at once via "Download everything". This avoids a 50 MB first visit on a phone. Speech depends on OS voices, so the voice menu labels each voice "works offline" or "needs internet", and Auto prefers a local voice when offline.

## Reader (text-to-speech) robustness

The engine (`src/engine/reader.ts`) is a standalone state machine:

- Each utterance carries a token, and stale events are ignored.
- It polls `speaking`/`pending` because Chrome may never fire `onend`.
- Each chunk has a hard time cap, and long lines are split into chunks under 180 characters, because Chrome cuts utterances off at about 15 s.
- `cancel()` is followed by a 60 ms delay before speaking again.
- A silent primer utterance is spoken synchronously inside the first click, which unlocks Safari.
- When the engine gives no word-boundary events, word timings are estimated instead.
- Pause is implemented as cancel-and-remember-the-word, because native `pause()` is unreliable.
- After three failures in a row it shows a clear message.

All of this is unit-tested against a mock that reproduces each quirk, and tested again in Chrome via Playwright.

## Design

- **Look:** DSA Lab's feel, rebuilt for maths. It has a dark slate-green background, chunky offset-shadow buttons and hand-lettered headings (Caveat Brush). Body text uses **Atkinson Hyperlegible**, which was designed for low-vision readers and has distinct letterforms (Il1, 0O). Code uses **JetBrains Mono**.
- **Themes:** *Slate* (default), *Chalkboard* (Kalam headings, a faint chalk-dust texture and slightly rough SVG strokes) and *Paper* (light, with darker role colours for contrast).
- **Colour roles** are fixed across the site: active = yellow, given = blue, result = green, error = red, done = teal.
- **Quantity colours** follow a quantity everywhere, in KaTeX (`\Q{slope}{…}`), SVG, canvas, readouts and code identifiers: input/position = blue, function value = purple, slope/velocity = orange, step size h = pink, time = mint, second derivative/acceleration = pale yellow.

## Learning-design choices (with the research behind them)

- **Dual coding** (Paivio; Mayer's multimedia principle). Every concept has a picture next to its words, and equations are both shown and spoken.
- **Modality and signalling** (Mayer). Narrated animations put words in the ear while the picture holds the eye. Colour-coded quantities signal which symbol is which part of the picture.
- **Segmenting and low extraneous load** (Sweller's cognitive load theory; Mayer's segmenting principle).
  - Only one step is on screen at a time.
  - Lessons are split into parts of 3–5 sections, with hands-on breaks between parts.
  - Paragraphs are capped at 400 characters, and verify enforces the cap.
  - Focus mode hides everything but the current step.
  - These choices suit ADHD attention patterns.
- **Worked examples before problem solving** (the worked-example effect; Sweller & Cooper). Each worked line is revealed one at a time with its justification. Hints then fade the support in three levels before the full solution.
- **Retrieval practice** (Roediger & Karpicke 2006). There are quick-recall questions straight after the first part, a 3-question quiz at the end, and review questions later.
- **Prediction before reveal** (generation effect; Brod 2021 on prediction). The learner must commit before the animation runs.
- **Spacing** (Cepeda et al. 2006). Reviews come back after 1, 3, 7, 14 and 30 days.
- **Self-explanation** (Chi). The recap asks for the idea in the learner's own words, saved.
- **Concept first.** Every lesson opens with "Where this fits" and a precise definition, as the brief asks, and examples come after.

## Curriculum changes

- **Added Course 10 "Machine learning" and Course 11 "Learning agents and scientific ML"** (2026-11-23, at your request), taught to the same depth as the other courses.
  - Course 10 runs from learning-from-data and regression, through classic methods, unsupervised learning, neural networks built from scratch, backpropagation, training, CNNs, transformers and generative models, to probabilistic ML and ML in practice.
  - Course 11 covers evolutionary methods, reinforcement learning, deep RL, building learning environments from physics simulations, and multi-agent emergence. This is the "AI agents learn in a simulated world" kind of project. Its scientific-ML half covers surrogates, physics-informed networks and learned simulators.
  - Each course ends with a capstone.
  - **Browser limit:** Pyodide ships scikit-learn but not PyTorch, JAX or TensorFlow. Neural networks are therefore built from scratch in numpy, which is also better for understanding them, and the in-browser exercises use small models. Where a real framework matters, lessons show the PyTorch equivalent as read-only code and name it as the tool to use on your own machine.

- None yet. Calculus 1.2 was built ahead of Course 0 as the Milestone 1 sample, because it exercises every step type, including the numerical "cost/accuracy" meter.
- Its prerequisite is Calculus 1.1 (Limits), which is not built yet. The dashboard marks unbuilt topics "coming soon", and the derivative topic links them by name.

## Known limits

- **3D views** (surfaces, vector fields, orbits) are not built yet. They will be a small hand-rolled projection with drag-to-rotate, added with Calculus 1.8 (multivariable functions and partial derivatives).
- The **cost / accuracy meter** exists as a reusable sandbox panel (`MeterData`). Course 6 will use it heavily.
