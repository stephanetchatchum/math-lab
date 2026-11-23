import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  CodeProblem, ComputeStep, FillGapStep, HookStep, LearnStep, PlayStep, PredictStep, ProblemsStep,
  RecallStep, RecapStep, Step, Topic, UsedStep, WatchStep, WorkedStep, YourTurnStep,
} from '../../content/types';
import type { ReadLine } from '../../engine/reader';
import type { TopicProgress } from '../../engine/progress';
import { spokenOf } from '../../content/richtext';
import { checkAnswer } from '../../engine/checker';
import { python, type RunResult } from '../../py/client';
import { useReadable, useReader } from '../reader/ReaderProvider';
import { useProgress } from '../state';
import { Rich } from '../Rich';
import { EqView, readingMinutes, renderSections } from '../blocks';
import { SceneSvg } from '../visual/SceneSvg';
import { AnimationPlayer } from '../visual/AnimationPlayer';
import { Sandbox } from '../visual/Sandbox';
import { SimCanvas } from '../visual/SimCanvas';
import { CodeRunner, ResultView } from '../code/CodeRunner';
import { AnswerBox, HandProblemView, QuestionView, WorkedLines } from './answers';

export interface StepProps<S extends Step = Step> {
  topic: Topic;
  step: S;
  tp: TopicProgress;
  setTp: (fn: (t: TopicProgress) => void, opts?: { activity?: boolean }) => void;
  /** Allowed to move on (soft gate: always true, but steps can mark themselves complete). */
  markComplete: () => void;
  steps: Step[];
  index: number;
}

/** Prose lines for simple steps: each gets a data-line index so the reader can follow. */
function useProse(stepKey: string, texts: string[]): { lines: ReadLine[]; P: (p: { i: number; className?: string; as?: 'p' | 'div' | 'h2' }) => ReactNode } {
  const lines = useMemo(() => texts.map((t, i) => ({ id: `${stepKey}-${i}`, text: spokenOf(t), kind: 'text' as const })), [stepKey, texts]);
  useReadable(lines, stepKey + lines.length);
  const P = ({ i, className = '', as = 'p' }: { i: number; className?: string; as?: 'p' | 'div' | 'h2' }) => {
    const Tag = as;
    return (
      <Tag className={`blk ${className}`} data-line={i}>
        <Rich text={texts[i]} />
      </Tag>
    );
  };
  return { lines, P };
}

// ------------------------------------------------------------------ 1. Hook

export function HookView({ step, markComplete }: StepProps<HookStep>) {
  const [shown, setShown] = useState(false);
  const { P } = useProse(step.id, useMemo(() => [step.question, step.teaser], [step]));
  return (
    <div className="hook">
      <P i={0} className="hook-q" as="div" />
      {step.scene && <SceneSvg scene={step.scene} />}
      {step.sim && <SimCanvas sim={step.sim} />}
      {step.anim && <AnimationPlayer anim={step.anim} />}
      {!shown ? (
        <button
          className="btn big"
          style={{ marginTop: 16 }}
          onClick={() => {
            setShown(true);
            markComplete();
          }}
        >
          I want to know →
        </button>
      ) : (
        <div className="teaser">
          <P i={1} />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 2. Learn

export function LearnView({ step, steps, index }: StepProps<LearnStep>) {
  const reader = useReader();
  const { data } = useProgress();
  const focus = data.settings.focus;
  const startNumber = useMemo(
    () => 1 + steps.slice(0, index).reduce((n, s) => n + (s.kind === 'learn' ? s.sections.length : 0), 0),
    [steps, index],
  );
  const { nodes, lines, sectionFirstLine } = useMemo(() => renderSections(step.sections, startNumber), [step, startNumber]);
  useReadable(lines, step.id);
  const [cur, setCur] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set([0]));
  const root = useRef<HTMLDivElement>(null);

  // follow the reader into sections
  useEffect(() => {
    if (reader.state === 'idle') return;
    let s = 0;
    sectionFirstLine.forEach((f, i) => {
      if (reader.line >= f) s = i;
    });
    setCur(s);
  }, [reader.line, reader.state, sectionFirstLine]);
  // follow scrolling
  useEffect(() => {
    const el = root.current;
    if (!el || focus) return;
    const io = new IntersectionObserver(
      (ents) => {
        for (const e of ents)
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.section);
            setSeen((s) => new Set(s).add(i));
          }
      },
      { rootMargin: '0px 0px -55% 0px' },
    );
    el.querySelectorAll('section[data-section]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [focus, nodes]);
  useEffect(() => setSeen((s) => new Set(s).add(cur)), [cur]);

  const later = steps.slice(index + 1).filter((s): s is LearnStep => s.kind === 'learn').flatMap((s) => s.sections.map((x) => x.title));
  const go = (i: number) => {
    setCur(i);
    if (!focus) document.getElementById(step.sections[i].id)?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="step-body">
      <div className="lesson" ref={root}>
        <div className="meta-line">
          <span>
            Part {step.part} of {step.partCount}
          </span>
          <span>~{readingMinutes(lines)} min listening</span>
          <button className="btn small" onClick={() => reader.play(focus ? sectionFirstLine[cur] : 0)} data-testid="learn-listen">
            ▶ Listen to this part
          </button>
          <span className="faint">Double-click any paragraph to read from there.</span>
        </div>
        {focus ? (
          <>
            {nodes[cur]}
            <div className="row" style={{ marginTop: 20 }}>
              <button className="btn" disabled={cur === 0} onClick={() => go(cur - 1)}>
                ← {cur > 0 ? step.sections[cur - 1].title : ''}
              </button>
              {cur < nodes.length - 1 && (
                <button className="btn primary" onClick={() => go(cur + 1)}>
                  {step.sections[cur + 1].title} →
                </button>
              )}
            </div>
          </>
        ) : (
          nodes
        )}
      </div>
      <aside className="toc" aria-label="In this part">
        <h3>
          Part {step.part} of {step.partCount}
        </h3>
        <ol>
          {step.sections.map((s, i) => (
            <li key={s.id} className={i === cur ? 'cur' : ''} onClick={() => go(i)}>
              <span className="ck">{seen.has(i) && i !== cur ? '✓' : startNumber + i}</span>
              <button className="linklike" onClick={() => go(i)}>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        {later.length > 0 && <p className="later">Coming later: {later.join(' · ')}</p>}
        <p className="later">Space: play / pause · ← →: previous / next line · Esc: stop</p>
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------ 3. Watch

export function WatchView({ step, markComplete }: StepProps<WatchStep>) {
  const [k, setK] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const { P } = useProse(step.id, useMemo(() => [step.intro], [step]));
  return (
    <div>
      <P i={0} />
      {step.anims.length > 1 && (
        <div className="tabs" role="tablist">
          {step.anims.map((a, i) => (
            <button key={a.id} role="tab" aria-selected={i === k} className={`btn ${i === k ? 'on' : ''}`} onClick={() => setK(i)}>
              {i + 1}. {a.title} {done.has(i) ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
      <AnimationPlayer
        key={step.anims[k].id}
        anim={step.anims[k]}
        onFinished={() => {
          const d = new Set(done).add(k);
          setDone(d);
          if (d.size === step.anims.length) markComplete();
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------------ 4. Recall / quiz

function QuestionList({ qs, tp, setTp, onAllAnswered, prefix, register = true }: { qs: RecallStep['questions']; tp: TopicProgress; setTp: StepProps['setTp']; onAllAnswered: () => void; prefix: string; register?: boolean }) {
  useProse(prefix, useMemo(() => (register ? qs.map((q) => q.prompt) : []), [qs, register]));
  return (
    <div>
      {qs.map((q, i) => (
        <QuestionView
          key={q.id}
          q={q}
          n={i + 1}
          line={register ? i : undefined}
          saved={tp.answers[q.id]}
          onResult={(ok, input) => {
            setTp((t) => {
              const prev = t.answers[q.id];
              t.answers[q.id] = { input, ok, tries: (prev?.tries ?? 0) + 1 };
              if (qs.every((x) => t.answers[x.id])) queueMicrotask(onAllAnswered);
            });
          }}
        />
      ))}
    </div>
  );
}

export function RecallView({ step, tp, setTp, markComplete }: StepProps<RecallStep>) {
  return (
    <div>
      <p className="dim">Answer from memory first — retrieving is what makes it stick. Then read the explanation.</p>
      <QuestionList qs={step.questions} tp={tp} setTp={setTp} onAllAnswered={markComplete} prefix={step.id} />
    </div>
  );
}

// ------------------------------------------------------------------ 5. Play

export function PlayView({ step, markComplete }: StepProps<PlayStep>) {
  const { P } = useProse(step.id, useMemo(() => [step.sandbox.intro], [step]));
  useEffect(() => {
    const t = setTimeout(markComplete, 20000); // counts as done after a little play
    return () => clearTimeout(t);
  }, [markComplete]);
  return (
    <div>
      <P i={0} />
      <Sandbox def={step.sandbox} />
      {step.sim && (
        <>
          <h3>{step.sim.title}</h3>
          <SimCanvas sim={step.sim} />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 6. Predict

export function PredictView({ step, tp, setTp, markComplete }: StepProps<PredictStep>) {
  const saved = tp.answers[step.id];
  const [committed, setCommitted] = useState(!!saved);
  const { P } = useProse(step.id, useMemo(() => [step.question, step.explain], [step]));
  return (
    <div>
      <P i={0} className="hook-q small" as="div" />
      <p className="dim">Commit to an answer first. Then watch what really happens.</p>
      <AnswerBox
        id={step.id}
        answer={step.answer}
        saved={saved}
        locked={committed}
        submitLabel="Lock in my prediction"
        onResult={(v, input) => {
          setCommitted(true);
          setTp((t) => void (t.answers[step.id] = { input, ok: v.ok, tries: 1 }));
        }}
      />
      {committed && (
        <>
          <h3>Now watch</h3>
          <AnimationPlayer anim={step.reveal} autoPlay onFinished={markComplete} />
          <div className="explain">
            <h3>Why</h3>
            <P i={1} />
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 7. Worked example

export function WorkedView({ step, markComplete }: StepProps<WorkedStep>) {
  const [n, setN] = useState(1);
  const reader = useReader();
  const lines = useMemo<ReadLine[]>(
    () => [
      { id: `${step.id}-p`, text: spokenOf(step.problem), kind: 'text' },
      ...step.lines.map((l, i) => ({ id: `${step.id}-${i}`, text: `${l.say}. ${l.why}.`, kind: 'text' as const })),
      { id: `${step.id}-t`, text: spokenOf(step.takeaway), kind: 'text' },
    ],
    [step],
  );
  useReadable(lines.slice(0, 1 + n + (n >= step.lines.length ? 1 : 0)), `${step.id}-${n}`);
  const reveal = () => {
    const k = Math.min(step.lines.length, n + 1);
    setN(k);
    const l = step.lines[k - 1];
    void reader.narrate(`${l.say}. ${l.why}.`);
    if (k === step.lines.length) markComplete();
  };
  return (
    <div>
      <div className="blk prompt" data-line={0}>
        <Rich text={step.problem} />
      </div>
      {step.eq && <EqView eq={step.eq} />}
      <div className="worked">
        {step.lines.slice(0, n).map((l, i) => (
          <div key={i} className={`wline blk ${i === n - 1 ? 'new' : ''}`} data-line={i + 1} data-testid="wline">
            <div className="wtex">
              <EqView eq={{ tex: l.tex, say: l.say }} />
            </div>
            <div className="why">{l.why}</div>
          </div>
        ))}
      </div>
      {n < step.lines.length ? (
        <div className="row">
          <button className="btn primary" onClick={reveal} data-testid="reveal-line">
            Next line ({n} of {step.lines.length})
          </button>
          <button
            className="btn ghost small"
            onClick={() => {
              setN(step.lines.length);
              markComplete();
            }}
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="note remember blk" data-line={step.lines.length + 1}>
          <span className="ni">📌</span>
          <div>
            <div className="nk">Takeaway</div>
            <Rich text={step.takeaway} as="p" />
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 8. Your turn

export function YourTurnView({ step, tp, setTp, markComplete }: StepProps<YourTurnStep>) {
  useProse(step.id, useMemo(() => step.problems.map((p) => p.prompt), [step]));
  const { update } = useProgress();
  return (
    <div>
      <p className="dim">Work on paper first, then type your final answer. Hints come in three levels; the full solution is always there.</p>
      {step.problems.map((p, i) => (
        <HandProblemView
          key={p.id}
          p={p}
          n={i + 1}
          line={i}
          saved={tp.answers[p.id]}
          onHint={(k) => setTp((t) => void (t.answers[p.id] = { ...(t.answers[p.id] ?? { input: null, ok: false, tries: 0 }), hintsUsed: k }))}
          onResult={(ok, input) => {
            setTp((t) => {
              const prev = t.answers[p.id];
              t.answers[p.id] = { input, ok: ok || !!prev?.ok, tries: (prev?.tries ?? 0) + 1, hintsUsed: prev?.hintsUsed };
              if (step.problems.every((x) => t.answers[x.id]?.ok)) queueMicrotask(markComplete);
            });
            if (ok) update((d) => void (d.solved[`${p.id}`] ??= new Date().toISOString()));
          }}
        />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ 9. Compute & 12. Problems

export function CodeProblemView({ p, tp, setTp, onPass, line }: { p: CodeProblem; tp: TopicProgress; setTp: StepProps['setTp']; onPass: () => void; line?: number }) {
  const [hints, setHints] = useState(0);
  const code = tp.code[p.id] ?? p.starter;
  const { update, data } = useProgress();
  const solved = !!data.solved[p.id];
  return (
    <div className="code-problem" data-testid={`code-${p.id}`}>
      <h3>
        {p.title} {p.difficulty && <span className="tag">{p.difficulty}</span>} {solved && <span className="r-done">✓ solved</span>}
      </h3>
      <div className="blk" data-line={line}>
        <Rich text={p.prompt} as="div" />
      </div>
      <CodeRunner
        id={p.id}
        starter={p.starter}
        value={code}
        onChange={(v) => setTp((t) => void (t.code[p.id] = v))}
        tests={p.tests}
        solution={hints >= 3 || solved ? p.solution : undefined}
        onPass={() => {
          update((d) => void (d.solved[p.id] ??= new Date().toISOString()));
          onPass();
        }}
      />
      <div className="row hints-row">
        {hints < 3 && (
          <button className="btn small" onClick={() => setHints(hints + 1)}>
            💡 Hint {hints + 1} of 3
          </button>
        )}
        {hints >= 3 && <span className="faint small">The reference solution is now available under the editor.</span>}
      </div>
      {hints > 0 && (
        <div className="hints">
          {p.hints.slice(0, hints).map((h, i) => (
            <div className="hint" key={i}>
              <b>Hint {i + 1}.</b> <Rich text={h} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ComputeView({ step, tp, setTp, markComplete }: StepProps<ComputeStep>) {
  useProse(step.id, useMemo(() => [step.problem.prompt], [step]));
  return <CodeProblemView p={step.problem} tp={tp} setTp={setTp} onPass={markComplete} line={0} />;
}

export function ProblemsView({ step, tp, setTp, markComplete }: StepProps<ProblemsStep>) {
  const [k, setK] = useState(0);
  const { data } = useProgress();
  useProse(`${step.id}-${k}`, useMemo(() => [step.problems[k].prompt], [step, k]));
  const p = step.problems[k];
  return (
    <div>
      <div className="tabs" role="tablist">
        {step.problems.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === k} className={`btn ${i === k ? 'on' : ''}`} onClick={() => setK(i)}>
            {i + 1}. {x.title} {data.solved[x.id] ? '✓' : ''}
          </button>
        ))}
      </div>
      <CodeProblemView
        key={p.id}
        p={p}
        tp={tp}
        setTp={setTp}
        line={0}
        onPass={() => {
          if (step.problems.every((x) => x.id === p.id || data.solved[x.id])) markComplete();
        }}
      />
      <h2>More practice elsewhere</h2>
      <p className="dim">Real, free resources. Look these up by name.</p>
      <ul className="outside">
        {step.outside.map((o, i) => (
          <li key={i}>
            <b>{o.source}</b> — {o.item}. <span className="dim">{o.why}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ 10. Fill the gap

const norm = (s: string) => s.replace(/\s+/g, '').replace(/\*\*/g, '^').toLowerCase();

export function FillGapView({ step, tp, setTp, markComplete }: StepProps<FillGapStep>) {
  const parts = useMemo(() => step.template.split(/(⟦[a-z0-9_]+⟧)/i), [step]);
  const [vals, setVals] = useState<Record<string, string>>(() => (tp.answers[step.id]?.input as Record<string, string>) ?? {});
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [res, setRes] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const { P } = useProse(step.id, useMemo(() => [step.intro], [step]));

  const check = async () => {
    setBusy(true);
    const m: Record<string, boolean> = {};
    for (const b of step.blanks) {
      const v = (vals[b.id] ?? '').trim();
      if (b.check === 'exact') m[b.id] = b.answers.some((a) => norm(a) === norm(v));
      else {
        const r = await checkAnswer({ kind: 'expr', expr: b.answers[0], vars: b.vars ?? ['x'] }, v, (a, c, vs) => python.equiv(a, c, vs));
        m[b.id] = r.ok;
      }
    }
    let testsOk = true;
    if (step.mode === 'code' && step.tests) {
      const filled = parts.map((p) => (p.startsWith('⟦') ? vals[p.slice(1, -1)] ?? '' : p)).join('');
      const r = await python.run(filled, step.tests);
      setRes(r);
      testsOk = !!r.tests?.length && r.tests.every((t) => t.ok);
      // tests are the judge for code: an equivalent blank that passes counts
      if (testsOk) step.blanks.forEach((b) => (m[b.id] = true));
    }
    setMarks(m);
    setBusy(false);
    const ok = step.blanks.every((b) => m[b.id]) && testsOk;
    setTp((t) => void (t.answers[step.id] = { input: vals, ok, tries: (t.answers[step.id]?.tries ?? 0) + 1 }));
    if (ok) markComplete();
  };

  return (
    <div>
      <P i={0} />
      <pre className={`static gap ${step.mode}`} data-testid="gap-template">
        {parts.map((p, i) => {
          if (!p.startsWith('⟦')) return <span key={i}>{p}</span>;
          const id = p.slice(1, -1);
          const b = step.blanks.find((x) => x.id === id)!;
          return (
            <input
              key={i}
              className={`gap-input ${marks[id] === true ? 'ok' : marks[id] === false ? 'bad' : ''}`}
              style={{ width: `${Math.max(4, b.width ?? b.answers[0].length + 2)}ch` }}
              value={vals[id] ?? ''}
              aria-label={`Blank ${id}`}
              data-testid={`gap-${id}`}
              onChange={(e) => setVals((v) => ({ ...v, [id]: e.target.value }))}
              spellCheck={false}
              autoComplete="off"
            />
          );
        })}
      </pre>
      <button className="btn primary" onClick={check} disabled={busy} data-testid="gap-check">
        {busy ? 'Checking…' : step.mode === 'code' ? 'Check and run tests' : 'Check'}
      </button>
      <div className="hints">
        {step.blanks
          .filter((b) => marks[b.id] === false)
          .map((b) => (
            <div className="hint" key={b.id}>
              <b>Blank {b.id}:</b> <Rich text={b.hint} />
            </div>
          ))}
      </div>
      {step.blanks.length > 0 && step.blanks.every((b) => marks[b.id]) && <div className="verdict ok">All gaps filled correctly.</div>}
      {res && <ResultView r={res} />}
    </div>
  );
}

// ------------------------------------------------------------------ 11. Where it's used

export function UsedView({ step, markComplete }: StepProps<UsedStep>) {
  const texts = useMemo(() => step.items.flatMap((it) => [`${it.field}. ${it.title}.`, it.text]), [step]);
  useProse(step.id, texts);
  useEffect(markComplete, [markComplete]);
  return (
    <div className="used-grid">
      {step.items.map((it, i) => (
        <div className="card" key={i}>
          <div className="field blk" data-line={2 * i}>
            {it.field}
          </div>
          <h3>{it.title}</h3>
          <div className="blk" data-line={2 * i + 1}>
            <Rich text={it.text} as="p" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ 13. Recap

export function RecapView({ step, tp, setTp, markComplete }: StepProps<RecapStep>) {
  const [txt, setTxt] = useState(tp.ownWords ?? '');
  const { P } = useProse(step.id, useMemo(() => [step.prompt], [step]));
  const [allAnswered, setAll] = useState(step.quiz.every((q) => tp.answers[q.id]));
  const words = txt.trim().split(/\s+/).filter(Boolean).length;
  useEffect(() => {
    const t = setTimeout(() => setTp((x) => void (x.ownWords = txt)), 400);
    return () => clearTimeout(t);
  }, [txt, setTp]);
  return (
    <div>
      <h2>In your own words</h2>
      <P i={0} />
      <textarea className="answer" value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Explain the idea in your own words" data-testid="own-words" />
      <p className="faint small">{words} words · saved automatically</p>
      <h2>Three-question quiz</h2>
      <QuestionList qs={step.quiz} tp={tp} setTp={setTp} onAllAnswered={() => setAll(true)} prefix={`${step.id}-quiz`} register={false} />
      {allAnswered && words >= 10 && (
        <button className="btn big primary" onClick={markComplete} data-testid="finish-topic">
          Finish topic ✓
        </button>
      )}
      {(!allAnswered || words < 10) && <p className="faint">Write at least a couple of sentences and answer the quiz to finish the topic.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ dispatcher

export function StepView(props: StepProps) {
  const s = props.step;
  switch (s.kind) {
    case 'hook': return <HookView {...(props as StepProps<HookStep>)} />;
    case 'learn': return <LearnView {...(props as StepProps<LearnStep>)} />;
    case 'watch': return <WatchView {...(props as StepProps<WatchStep>)} />;
    case 'recall': return <RecallView {...(props as StepProps<RecallStep>)} />;
    case 'play': return <PlayView {...(props as StepProps<PlayStep>)} />;
    case 'predict': return <PredictView {...(props as StepProps<PredictStep>)} />;
    case 'worked': return <WorkedView {...(props as StepProps<WorkedStep>)} />;
    case 'yourTurn': return <YourTurnView {...(props as StepProps<YourTurnStep>)} />;
    case 'compute': return <ComputeView {...(props as StepProps<ComputeStep>)} />;
    case 'fillGap': return <FillGapView {...(props as StepProps<FillGapStep>)} />;
    case 'used': return <UsedView {...(props as StepProps<UsedStep>)} />;
    case 'problems': return <ProblemsView {...(props as StepProps<ProblemsStep>)} />;
    case 'recap': return <RecapView {...(props as StepProps<RecapStep>)} />;
  }
}

export { WorkedLines };
