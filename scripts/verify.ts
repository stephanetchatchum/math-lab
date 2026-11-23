/**
 * npm run verify — checks every topic file for correctness.
 *
 *  - curriculum: prerequisites exist, no cycles, topic files match the curriculum
 *  - text: every {{tex|say}} has a spoken form, every TeX renders in KaTeX, every [[term]] exists,
 *          paragraphs ≤ 400 visible characters, captions contain no raw LaTeX
 *  - equations / formulas / worked lines: non-empty `say`, no TeX in `say`
 *  - animations: every frame's scene is finite and well-formed
 *  - sandboxes: render() and meter() give finite output over a sweep of inputs
 *  - simulations: analytic `check` passes
 *  - questions: options/answers well-formed
 *  - hand problems: answer == worked-solution final == independent sympy truth
 *  - code problems: reference solution passes every test, starter fails at least one
 *  - fill-the-gap: filled template passes, blank template fails, every alternative answer passes
 *  - lesson code blocks: run without error
 * Python runs in Pyodide (Node) with the same harness as the browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import katex from 'katex';
import { COURSES, ALL_TOPIC_META, META_BY_ID } from '../src/content/curriculum';
import { depths } from '../src/content/graph';
import { CORE_GLOSSARY } from '../src/content/glossary';
import { KATEX_MACROS } from '../src/content/quantities';
import { parseRich, visibleLength } from '../src/content/richtext';
import { parse as parseExpr, evalConst } from '../src/engine/expr';
import { parseUnit } from '../src/engine/units';
import type { Block, CodeProblem, CompareTable, Eq, HandProblem, Question, Scene, SceneItem, SandboxDef, SimDef, Step, Topic } from '../src/content/types';
import { nodePython } from './lib/nodePython';

const MAX_P = 400;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fails: string[] = [];
let checks = 0;
const ok = (cond: unknown, msg: string) => {
  checks++;
  if (!cond) fails.push(msg);
  return !!cond;
};

// ------------------------------------------------------------------ text

function tex(t: string, where: string) {
  try {
    katex.renderToString(t, { throwOnError: true, strict: 'ignore', trust: true, macros: { ...KATEX_MACROS }, displayMode: true });
    checks++;
  } catch (e) {
    fails.push(`${where}: KaTeX error in “${t}”: ${(e as Error).message.split('\n')[0]}`);
  }
}
function say(s: string | undefined, where: string) {
  ok(s && s.trim().length > 0, `${where}: missing spoken form`);
  ok(!s || !/[\\{}^_]/.test(s), `${where}: spoken form contains TeX characters: “${s}”`);
}
function rich(s: string, where: string, glossary: Set<string>, maxLen?: number) {
  let segs;
  try {
    segs = parseRich(s);
    checks++;
  } catch (e) {
    fails.push(`${where}: ${(e as Error).message}`);
    return;
  }
  for (const g of segs) {
    if (g.t === 'math') {
      tex(g.tex, where);
      say(g.say, `${where} (inline maths ${g.tex})`);
    }
    if (g.t === 'term') ok(glossary.has(g.id), `${where}: unknown glossary term [[${g.id}]]`);
    if (g.t === 'text') ok(!/\\[a-z]+/i.test(g.s), `${where}: raw LaTeX outside {{…}}: “${g.s.slice(0, 50)}”`);
  }
  if (maxLen) {
    const n = visibleLength(s);
    ok(n <= maxLen, `${where}: paragraph is ${n} characters (limit ${maxLen})`);
  }
}
function eq(e: Eq, where: string) {
  tex(e.tex, where);
  say(e.say, where);
}

// ------------------------------------------------------------------ scenes

function finite(v: number) {
  return typeof v === 'number' && Number.isFinite(v);
}
function scene(sc: Scene, where: string) {
  if (!ok(sc && Array.isArray(sc.items), `${where}: no scene`)) return;
  ok(finite(sc.x[0]) && finite(sc.x[1]) && sc.x[0] < sc.x[1], `${where}: bad x range`);
  ok(finite(sc.y[0]) && finite(sc.y[1]) && sc.y[0] < sc.y[1], `${where}: bad y range`);
  ok(sc.alt && sc.alt.length > 10, `${where}: scene needs alt text`);
  sc.items.forEach((it: SceneItem, i) => {
    const w = `${where} item ${i} (${it.kind})`;
    const pts: number[] = [];
    switch (it.kind) {
      case 'fn': {
        const a = it.from ?? sc.x[0], b = it.to ?? sc.x[1];
        let good = 0;
        for (let k = 0; k <= 50; k++) if (finite(it.f(a + ((b - a) * k) / 50))) good++;
        ok(good >= 10, `${w}: function is not finite on the visible range`);
        break;
      }
      case 'polyline': it.points.forEach((p) => pts.push(p[0], p[1])); ok(it.points.length >= 1, `${w}: empty polyline`); break;
      case 'point': pts.push(...it.at); break;
      case 'segment': pts.push(...it.a, ...it.b); break;
      case 'line': pts.push(...it.through, it.slope); break;
      case 'vline': pts.push(it.x); break;
      case 'hline': pts.push(it.y); break;
      case 'rect': pts.push(it.x, it.y, it.w, it.h); break;
      case 'area': pts.push(it.from, it.to); break;
      case 'label': pts.push(...it.at); ok(it.text.length > 0, `${w}: empty label`); break;
      case 'brace': pts.push(...it.a, ...it.b); break;
    }
    ok(pts.every(finite), `${w}: non-finite coordinate`);
  });
}

// ------------------------------------------------------------------ collect

async function loadTopics(): Promise<{ file: string; topic: Topic }[]> {
  const dir = path.join(root, 'src/content/topics');
  const out: { file: string; topic: Topic }[] = [];
  for (const c of fs.readdirSync(dir)) {
    const cdir = path.join(dir, c);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const f of fs.readdirSync(cdir).filter((x) => x.endsWith('.ts'))) {
      const mod = await import(pathToFileURL(path.join(cdir, f)).href);
      out.push({ file: `${c}/${f}`, topic: mod.default as Topic });
    }
  }
  return out;
}

type Py = Awaited<ReturnType<typeof nodePython>>;

const TRUTH_HELPER = `
import sympy as _sp
def mathlab_truth(expr, names):
    loc = {v: _sp.Symbol(v, positive=True) for v in names}
    loc.update({'e': _sp.E, 'pi': _sp.pi})
    return _sp.sympify(expr, locals=loc)
def mathlab_same(a, b, names):
    A = mathlab_truth(a, names); B = mathlab_truth(b, names)
    d = _sp.simplify(A - B)
    return bool(d == 0 or d.equals(0))
def mathlab_float(a):
    return float(_sp.N(mathlab_truth(a, [])))
`;

async function codeProblem(py: Py, p: CodeProblem, where: string) {
  rich(p.prompt, `${where} prompt`, GLOSS);
  ok(p.hints.length === 3, `${where}: needs 3 hints`);
  p.hints.forEach((h, i) => rich(h, `${where} hint ${i + 1}`, GLOSS));
  const sol = py.run(p.solution, p.tests);
  const bad = sol.tests?.filter((t) => !t.ok) ?? [];
  ok(sol.tests && sol.tests.length > 0, `${where}: tests define no test_* functions`);
  ok(sol.ok && bad.length === 0, `${where}: reference solution fails: ${sol.error ?? bad.map((t) => `${t.name}: ${t.message}`).join('; ')}`);
  const st = py.run(p.starter, p.tests);
  ok(!st.tests || st.tests.some((t) => !t.ok), `${where}: starter code already passes every test`);
}

async function handProblem(py: Py, p: HandProblem, where: string) {
  rich(p.prompt, `${where} prompt`, GLOSS);
  if (p.eq) eq(p.eq, `${where} eq`);
  ok(p.hints.length === 3, `${where}: needs 3 hints`);
  p.hints.forEach((h, i) => rich(h, `${where} hint ${i + 1}`, GLOSS));
  ok(p.solution.length > 0, `${where}: needs a worked solution`);
  p.solution.forEach((l, i) => {
    tex(l.tex, `${where} solution line ${i + 1}`);
    say(l.say, `${where} solution line ${i + 1}`);
    ok(l.why.trim().length > 0, `${where} solution line ${i + 1}: missing justification`);
  });
  const a = p.answer;
  const exec = (code: string) => py.exec(code);
  if (a.kind === 'numeric') {
    const fin = Number(exec(`mathlab_float(${JSON.stringify(p.solutionFinal)})`));
    const tol = Math.max(a.absTol ?? 1e-9, (a.relTol ?? 1e-3) * Math.abs(a.value));
    ok(Math.abs(fin - a.value) <= tol, `${where}: answer ${a.value} ≠ worked solution final ${fin}`);
    if (p.truth) {
      const tr = Number(exec(`mathlab_float(${JSON.stringify(p.truth)})`));
      ok(Math.abs(tr - a.value) <= tol, `${where}: answer ${a.value} ≠ independent truth ${p.truth} = ${tr}`);
    } else fails.push(`${where}: numeric problem needs a \`truth\` expression`);
    if (a.unit) {
      try {
        parseUnit(a.unit);
        checks++;
      } catch (e) {
        fails.push(`${where}: unit “${a.unit}” not understood: ${(e as Error).message}`);
      }
    }
  } else if (a.kind === 'expr') {
    try {
      parseExpr(a.expr, a.vars);
      checks++;
    } catch (e) {
      fails.push(`${where}: answer expression doesn't parse in the browser checker: ${(e as Error).message}`);
    }
    const names = JSON.stringify(a.vars);
    const pyExpr = a.expr.replace(/\^/g, '**');
    ok(exec(`mathlab_same(${JSON.stringify(pyExpr)}, ${JSON.stringify(p.solutionFinal)}, ${names})`) === true, `${where}: answer ${a.expr} ≠ worked solution ${p.solutionFinal}`);
    if (p.truth) ok(exec(`mathlab_same(${JSON.stringify(pyExpr)}, ${JSON.stringify(p.truth)}, ${names})`) === true, `${where}: answer ${a.expr} ≠ truth ${p.truth}`);
    else fails.push(`${where}: expression problem needs a \`truth\` expression`);
  } else if (a.kind === 'order') {
    ok(a.steps.length >= 3, `${where}: ordering needs at least 3 steps`);
    a.steps.forEach((s, i) => rich(s, `${where} step ${i + 1}`, GLOSS));
    if (p.truth) {
      const vars = ['x'];
      ok(exec(`mathlab_same(${JSON.stringify(p.solutionFinal)}, ${JSON.stringify(p.truth)}, ${JSON.stringify(vars)})`) === true, `${where}: worked solution ${p.solutionFinal} ≠ truth ${p.truth}`);
    }
  } else if (a.kind === 'mc') {
    ok(a.correct >= 0 && a.correct < a.options.length, `${where}: correct option out of range`);
  }
}

function question(q: Question, where: string) {
  rich(q.prompt, `${where} prompt`, GLOSS);
  rich(q.explain, `${where} explanation`, GLOSS);
  const a = q.answer;
  if (a.kind === 'mc') {
    ok(a.correct >= 0 && a.correct < a.options.length, `${where}: correct option out of range`);
    a.options.forEach((o, i) => rich(o, `${where} option ${i + 1}`, GLOSS));
    ok(new Set(a.options).size === a.options.length, `${where}: duplicate options`);
  } else if (a.kind === 'expr') {
    try {
      parseExpr(a.expr, a.vars);
      checks++;
    } catch (e) {
      fails.push(`${where}: expression doesn't parse: ${(e as Error).message}`);
    }
  } else if (a.kind === 'numeric') ok(finite(a.value), `${where}: answer not finite`);
}

function blocks(bs: Block[], where: string) {
  bs.forEach((b, i) => {
    const w = `${where} block ${i + 1} (${b.type})`;
    switch (b.type) {
      case 'p': rich(b.text, w, GLOSS, MAX_P); break;
      case 'note': rich(b.text, w, GLOSS, MAX_P); break;
      case 'list': b.items.forEach((t, j) => rich(t, `${w} item ${j + 1}`, GLOSS, MAX_P)); break;
      case 'eq': eq(b.eq, w); break;
      case 'figure': scene(b.scene, w); if (b.caption) rich(b.caption, `${w} caption`, GLOSS, MAX_P); break;
      case 'anim': animation(b.anim, w); break;
      case 'code': say(b.say, w); LESSON_CODE.push({ code: b.code, where: w }); break;
      case 'table': [...b.head, ...b.rows.flat()].forEach((c) => rich(c, w, GLOSS)); break;
    }
  });
}

function animation(a: { id: string; frames: { scene: Scene; caption: string; eq?: Eq }[] }, where: string) {
  ok(a.frames.length >= 2, `${where}: animation ${a.id} needs at least 2 frames`);
  a.frames.forEach((f, i) => {
    const w = `${where} anim ${a.id} frame ${i + 1}`;
    scene(f.scene, w);
    ok(f.caption.trim().length > 0, `${w}: empty caption`);
    ok(!/[\\{}$]/.test(f.caption), `${w}: caption contains TeX: “${f.caption}”`);
    if (f.eq) eq(f.eq, w);
  });
}

function sandbox(def: SandboxDef, where: string) {
  rich(def.intro, `${where} intro`, GLOSS, MAX_P);
  def.tryThis.forEach((t, i) => rich(t, `${where} try ${i + 1}`, GLOSS));
  const sliders = def.sliders ?? [];
  const choices = def.choices ?? [];
  const combos: Record<string, string>[] = [{}];
  for (const c of choices) {
    const next: Record<string, string>[] = [];
    for (const base of combos) for (const o of c.options) next.push({ ...base, [c.id]: o.value });
    combos.splice(0, combos.length, ...next);
  }
  for (const ch of combos)
    for (const frac of [0, 0.37, 1]) {
      const values = Object.fromEntries(sliders.map((s) => {
        const raw = s.min + (s.max - s.min) * frac;
        return [s.id, s.log ? Math.pow(10, raw) : raw];
      }));
      const state = { values, choices: ch, points: {} as Record<string, [number, number]> };
      for (const p of def.points ?? []) state.points[p.id] = p.constrain ? p.constrain(p.init, state) : p.init;
      const w = `${where} sandbox ${JSON.stringify(ch)} at ${frac}`;
      try {
        const out = def.render(state);
        scene(out.scene, w);
        if (out.eq) eq(out.eq, w);
        out.readouts?.forEach((r) => ok(r.value.length > 0, `${w}: empty readout ${r.label}`));
        const m = def.meter?.(state);
        if (m) m.curves.forEach((c) => ok(c.points.every((p) => finite(p[0]) && finite(p[1])), `${w}: meter curve ${c.label} not finite`));
      } catch (e) {
        fails.push(`${w}: render threw ${(e as Error).message}`);
      }
    }
}

function sim(s: SimDef<unknown>, where: string) {
  const params = Object.fromEntries(s.params.map((p) => [p.id, p.init]));
  let st = s.init(params);
  const n = s.check?.steps ?? 100;
  const dt = s.check?.dt ?? 1 / 60;
  for (let i = 0; i < n; i++) st = s.step(st, dt, params);
  ok(JSON.stringify(st) !== undefined, `${where}: state not serialisable`);
  if (s.check) {
    const m = s.check.measure(st, params);
    ok(finite(m) && m < s.check.tol, `${where}: simulation check failed: measure ${m} ≥ tol ${s.check.tol}`);
  }
}

// ------------------------------------------------------------------ main

const GLOSS = new Set(CORE_GLOSSARY.map((g) => g.id));
const LESSON_CODE: { code: string; where: string }[] = [];

async function main() {
  const t0 = Date.now();
  // curriculum
  try {
    depths(ALL_TOPIC_META);
    checks++;
  } catch (e) {
    fails.push(`curriculum: ${(e as Error).message}`);
  }
  ok(new Set(ALL_TOPIC_META.map((t) => t.id)).size === ALL_TOPIC_META.length, 'curriculum: duplicate topic ids');

  const topics = await loadTopics();
  topics.forEach(({ topic }) => topic.glossary?.forEach((g) => GLOSS.add(g.id)));
  CORE_GLOSSARY.forEach((g) => rich(g.def, `glossary ${g.id}`, GLOSS));

  // compare tables
  for (const f of fs.readdirSync(path.join(root, 'src/content/compare'))) {
    const tables = (await import(pathToFileURL(path.join(root, 'src/content/compare', f)).href)).default as CompareTable[];
    ok(COURSES.some((c) => c.id === f.replace(/\.ts$/, '')), `compare/${f}: no course with that id`);
    tables.forEach((t) => [t.intro, ...t.head, ...t.rows.flat()].forEach((c) => rich(c, `compare/${f} ${t.id}`, GLOSS)));
  }

  console.log('Starting Python (Pyodide in Node)…');
  const py = await nodePython();
  py.exec(TRUTH_HELPER);

  for (const { file, topic: t } of topics) {
    const W = t.id;
    console.log(`• ${W}`);
    ok(file.endsWith(`/${t.id}.ts`), `${file}: file name must be <topic id>.ts`);
    const meta = META_BY_ID[t.id];
    if (ok(meta, `${W}: not in the curriculum`)) {
      ok(meta.course === t.course && meta.number === t.number && meta.title === t.title, `${W}: course/number/title differ from curriculum.ts`);
      ok(JSON.stringify(meta.prereqs) === JSON.stringify(t.prereqs), `${W}: prereqs differ from curriculum.ts`);
    }
    ok(new Set(t.steps.map((s) => s.id)).size === t.steps.length, `${W}: duplicate step ids`);
    const qids: string[] = [];
    t.formulas.forEach((f, i) => {
      tex(f.tex, `${W} formula ${i + 1}`);
      say(f.say, `${W} formula ${i + 1}`);
    });
    t.glossary?.forEach((g) => rich(g.def, `${W} glossary ${g.id}`, GLOSS));
    const learn = t.steps.filter((s) => s.kind === 'learn');
    learn.forEach((s, i) => s.kind === 'learn' && ok(s.part === i + 1 && s.partCount === learn.length, `${W} ${s.id}: part ${s.part}/${s.partCount} should be ${i + 1}/${learn.length}`));

    for (const s of t.steps as Step[]) {
      const w = `${W} › ${s.id}`;
      switch (s.kind) {
        case 'hook':
          rich(s.question, `${w} question`, GLOSS);
          rich(s.teaser, `${w} teaser`, GLOSS, MAX_P);
          if (s.scene) scene(s.scene, w);
          if (s.anim) animation(s.anim, w);
          if (s.sim) sim(s.sim, w);
          break;
        case 'learn':
          ok(s.sections.length >= 2 && s.sections.length <= 6, `${w}: ${s.sections.length} sections; break into parts of about 4–5`);
          s.sections.forEach((sec) => blocks(sec.blocks, `${w} § ${sec.title}`));
          break;
        case 'watch':
          rich(s.intro, `${w} intro`, GLOSS, MAX_P);
          s.anims.forEach((a) => animation(a, w));
          break;
        case 'recall':
          ok(s.questions.length >= 2 && s.questions.length <= 3, `${w}: needs 2–3 questions`);
          s.questions.forEach((q) => (qids.push(q.id), question(q, `${w} ${q.id}`)));
          break;
        case 'play':
          sandbox(s.sandbox, w);
          if (s.sim) sim(s.sim, w);
          break;
        case 'predict':
          rich(s.question, `${w} question`, GLOSS);
          rich(s.explain, `${w} explain`, GLOSS, MAX_P);
          question({ id: s.id, prompt: s.question, answer: s.answer, explain: s.explain }, w);
          animation(s.reveal, w);
          break;
        case 'worked':
          rich(s.problem, `${w} problem`, GLOSS);
          rich(s.takeaway, `${w} takeaway`, GLOSS, MAX_P);
          s.lines.forEach((l, i) => {
            tex(l.tex, `${w} line ${i + 1}`);
            say(l.say, `${w} line ${i + 1}`);
            ok(l.why.trim(), `${w} line ${i + 1}: missing justification`);
          });
          break;
        case 'yourTurn':
          ok(s.problems.length >= 3 && s.problems.length <= 5, `${w}: needs 3–5 problems`);
          for (const p of s.problems) (qids.push(p.id), await handProblem(py, p, `${w} ${p.id}`));
          break;
        case 'compute':
          await codeProblem(py, s.problem, `${w} ${s.problem.id}`);
          break;
        case 'fillGap': {
          rich(s.intro, `${w} intro`, GLOSS, MAX_P);
          const parts = s.template.split(/(⟦[a-z0-9_]+⟧)/i);
          const ids = parts.filter((p) => p.startsWith('⟦')).map((p) => p.slice(1, -1));
          ok(JSON.stringify([...new Set(ids)].sort()) === JSON.stringify(s.blanks.map((b) => b.id).sort()), `${w}: blanks in template don't match blank definitions`);
          const fill = (pick: Record<string, string>) => parts.map((p) => (p.startsWith('⟦') ? pick[p.slice(1, -1)] : p)).join('');
          const first = Object.fromEntries(s.blanks.map((b) => [b.id, b.answers[0]]));
          if (s.mode === 'code' && s.tests) {
            const r = py.run(fill(first), s.tests);
            ok(r.ok && r.tests?.length && r.tests.every((x) => x.ok), `${w}: filled template fails: ${r.error ?? r.tests?.filter((x) => !x.ok).map((x) => x.message).join('; ')}`);
            const empty = py.run(fill(Object.fromEntries(s.blanks.map((b) => [b.id, '']))), s.tests);
            ok(!empty.ok || empty.tests?.some((x) => !x.ok), `${w}: template with empty blanks passes the tests`);
            for (const b of s.blanks)
              for (const alt of b.answers.slice(1)) {
                const r2 = py.run(fill({ ...first, [b.id]: alt }), s.tests);
                ok(r2.ok && r2.tests?.every((x) => x.ok), `${w}: alternative answer “${alt}” for blank ${b.id} fails the tests`);
              }
          }
          for (const b of s.blanks) {
            rich(b.hint, `${w} blank ${b.id} hint`, GLOSS);
            if (b.check === 'expr') {
              const vars = b.vars ?? ['x'];
              for (const a of b.answers) {
                try {
                  parseExpr(a, vars);
                  checks++;
                } catch (e) {
                  fails.push(`${w}: blank ${b.id} answer “${a}” doesn't parse: ${(e as Error).message}`);
                }
                ok(py.exec(`mathlab_same(${JSON.stringify(a.replace(/\^/g, '**'))}, ${JSON.stringify(b.answers[0].replace(/\^/g, '**'))}, ${JSON.stringify(vars)})`) === true, `${w}: blank ${b.id} alternatives are not equivalent`);
              }
            }
          }
          break;
        }
        case 'used':
          ok(s.items.length >= 3, `${w}: needs at least 3 uses`);
          s.items.forEach((it, i) => rich(it.text, `${w} item ${i + 1}`, GLOSS, MAX_P));
          break;
        case 'problems':
          ok(s.problems.length === 3, `${w}: needs 3 problems (easy, easy, medium)`);
          for (const p of s.problems) await codeProblem(py, p, `${w} ${p.id}`);
          ok(s.outside.length >= 2, `${w}: list some outside practice`);
          s.outside.forEach((o, i) => ok(o.source && o.item && !/https?:/.test(o.item), `${w}: outside practice ${i + 1} must be named, not linked`));
          break;
        case 'recap':
          rich(s.prompt, `${w} prompt`, GLOSS);
          ok(s.quiz.length === 3, `${w}: quiz needs 3 questions`);
          s.quiz.forEach((q) => (qids.push(q.id), question(q, `${w} ${q.id}`)));
          break;
      }
    }
    ok(new Set(qids).size === qids.length, `${W}: duplicate question/problem ids`);
  }

  console.log(`Running ${LESSON_CODE.length} lesson code blocks…`);
  for (const c of LESSON_CODE) {
    const r = py.run(c.code);
    ok(r.ok, `${c.where}: lesson code raises ${r.error}`);
  }

  // sanity: the browser's expression checker handles what we ship
  ok(Math.abs(evalConst('2/3') - 2 / 3) < 1e-15, 'expr: evalConst broken');

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (fails.length) {
    console.error(`\n✗ ${fails.length} problem(s) in ${checks + fails.length} checks (${secs} s):`);
    fails.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log(`\n✓ verify passed: ${checks} checks across ${topics.length} topic(s) in ${secs} s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
