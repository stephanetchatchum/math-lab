import { useMemo, useState } from 'react';
import type { Answer, HandProblem, Question, WorkedLine } from '../../content/types';
import { checkAnswer, type Verdict } from '../../engine/checker';
import { python } from '../../py/client';
import { Rich } from '../Rich';
import { Tex } from '../Tex';
import { EqView } from '../blocks';

export interface Saved {
  input: unknown;
  ok: boolean;
  tries: number;
  hintsUsed?: number;
}

const sympy = (a: string, b: string, vars: string[]) => python.equiv(a, b, vars);

/** Deterministic shuffle so the order is stable between visits. */
export function shuffled<T>(arr: T[], seed: string): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const idx = arr.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // never show the correct order as the starting order
  if (idx.every((v, i) => v === i) && idx.length > 1) [idx[0], idx[1]] = [idx[1], idx[0]];
  return idx;
}

/** Input + check for any Answer kind. Calls onResult after each real attempt. */
export function AnswerBox({
  id,
  answer,
  saved,
  onResult,
  locked = false,
  submitLabel = 'Check',
}: {
  id: string;
  answer: Answer;
  saved?: Saved;
  onResult: (v: Verdict, input: unknown) => void;
  locked?: boolean;
  submitLabel?: string;
}) {
  const [text, setText] = useState<string>(typeof saved?.input === 'string' ? (saved.input as string) : '');
  const [choice, setChoice] = useState<number | null>(typeof saved?.input === 'number' ? (saved.input as number) : null);
  const initialOrder = useMemo(() => (answer.kind === 'order' ? shuffled(answer.steps, id) : []), [answer, id]);
  const [order, setOrder] = useState<number[]>(Array.isArray(saved?.input) ? (saved!.input as number[]) : initialOrder);
  const [verdict, setVerdict] = useState<Verdict | null>(saved ? { ok: saved.ok, message: saved.ok ? 'Correct.' : 'Not quite yet.' } : null);
  const [busy, setBusy] = useState(false);
  const done = locked || verdict?.ok;

  const submit = async (input: unknown) => {
    setBusy(true);
    const v = await checkAnswer(answer, input as string | number | number[], sympy);
    setBusy(false);
    setVerdict(v);
    if (!v.invalid) onResult(v, input);
  };

  return (
    <div className="answer-box" data-testid={`answer-${id}`}>
      {answer.kind === 'mc' && (
        <div className="opts" role="radiogroup">
          {answer.options.map((o, i) => {
            const cls = done || (verdict && choice === i) ? (i === answer.correct && (done || verdict?.ok) ? 'right' : choice === i && verdict && !verdict.ok ? 'wrong' : '') : '';
            return (
              <button
                key={i}
                role="radio"
                aria-checked={choice === i}
                className={`btn opt ${choice === i ? 'sel' : ''} ${cls}`}
                disabled={!!done || busy}
                data-testid={`opt-${i}`}
                onClick={() => {
                  setChoice(i);
                  void submit(i);
                }}
              >
                {answer.scenes ? <span className="mono">{String.fromCharCode(65 + i)}</span> : null}
                <Rich text={o} />
              </button>
            );
          })}
        </div>
      )}
      {(answer.kind === 'numeric' || answer.kind === 'expr') && (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(text);
          }}
        >
          <input
            className="answer"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!done}
            aria-label={answer.kind === 'numeric' ? `Your answer${answer.unit ? ` in ${answer.unit} (or equivalent units)` : ''}` : `Your expression in ${answer.vars.join(', ')}`}
            placeholder={answer.kind === 'numeric' ? (answer.unit ? `number and unit, e.g. 3.2 ${answer.unit}` : 'a number, e.g. 2/3 or 0.667') : `e.g. 3*${answer.vars[0]}^2 + 1`}
            spellCheck={false}
            autoComplete="off"
            data-testid="answer-input"
          />
          {!done && (
            <button className="btn primary" disabled={busy} data-testid="answer-check">
              {busy ? 'Checking…' : submitLabel}
            </button>
          )}
        </form>
      )}
      {answer.kind === 'order' && (
        <>
          <ol className="order-list">
            {order.map((si, pos) => (
              <li key={si}>
                <span className="mono faint">{pos + 1}</span>
                <span className="grow">
                  <Rich text={answer.steps[si]} />
                </span>
                <button className="btn small" aria-label="Move up" disabled={!!done || pos === 0} onClick={() => setOrder((o) => swap(o, pos, pos - 1))}>
                  ↑
                </button>
                <button className="btn small" aria-label="Move down" disabled={!!done || pos === order.length - 1} onClick={() => setOrder((o) => swap(o, pos, pos + 1))}>
                  ↓
                </button>
              </li>
            ))}
          </ol>
          {!done && (
            <button className="btn primary" onClick={() => submit(order)} data-testid="answer-check">
              {submitLabel}
            </button>
          )}
        </>
      )}
      {answer.kind === 'expr' && <p className="faint small">Write maths like 3*x^2 + 1, sqrt(x), sin(2x), e^x, pi. Equivalent forms all count.</p>}
      {verdict && (
        <div className={`verdict ${verdict.ok ? 'ok' : verdict.invalid ? 'info' : 'bad'}`} role="status" data-testid="verdict">
          {verdict.message}
        </div>
      )}
    </div>
  );
}

function swap(a: number[], i: number, j: number) {
  const b = [...a];
  [b[i], b[j]] = [b[j], b[i]];
  return b;
}

/** A retrieval / quiz question with its explanation shown after answering. */
export function QuestionView({ q, saved, onResult, n, line }: { q: Question; saved?: Saved; onResult: (ok: boolean, input: unknown) => void; n?: number; line?: number }) {
  const [answered, setAnswered] = useState(!!saved);
  const [ok, setOk] = useState(saved?.ok ?? false);
  return (
    <div className="q" data-testid={`q-${q.id}`}>
      <div className="prompt blk" data-line={line}>
        {n !== undefined && <span className="qnum">{n}.</span>} <Rich text={q.prompt} />
      </div>
      <AnswerBox
        id={q.id}
        answer={q.answer}
        saved={saved}
        onResult={(v, input) => {
          setAnswered(true);
          setOk(v.ok);
          onResult(v.ok, input);
        }}
      />
      {answered && (
        <div className={`explain ${ok ? '' : 'after-wrong'}`}>
          {!ok && q.answer.kind === 'mc' && (
            <p>
              <b>Answer:</b> <Rich text={q.answer.options[q.answer.correct]} />
            </p>
          )}
          <Rich text={q.explain} as="p" />
        </div>
      )}
    </div>
  );
}

export function WorkedLines({ lines, upto }: { lines: WorkedLine[]; upto: number }) {
  return (
    <div className="worked">
      {lines.slice(0, upto).map((l, i) => (
        <div key={i} className={`wline ${i === upto - 1 ? 'new' : ''}`} data-testid="wline">
          <div className="wtex">
            <Tex tex={l.tex} say={l.say} display />
          </div>
          <div className="why">{l.why}</div>
        </div>
      ))}
    </div>
  );
}

/** Pen-and-paper problem: answer box, three levels of hints, full worked solution. */
export function HandProblemView({ p, saved, onResult, onHint, n, line }: { p: HandProblem; saved?: Saved; onResult: (ok: boolean, input: unknown) => void; onHint: (k: number) => void; n: number; line?: number }) {
  const [hints, setHints] = useState(saved?.hintsUsed ?? 0);
  const [showSol, setShowSol] = useState(false);
  const [solved, setSolved] = useState(saved?.ok ?? false);
  return (
    <div className="card problem" data-testid={`hand-${p.id}`}>
      <div className="prompt blk" data-line={line}>
        <span className="qnum">{n}.</span> <Rich text={p.prompt} />
      </div>
      {p.eq && <EqView eq={p.eq} />}
      <AnswerBox
        id={p.id}
        answer={p.answer}
        saved={saved}
        onResult={(v, input) => {
          if (v.ok) setSolved(true);
          onResult(v.ok, input);
        }}
      />
      <div className="row hints-row">
        {hints < 3 && !solved && (
          <button
            className="btn small"
            onClick={() => {
              setHints(hints + 1);
              onHint(hints + 1);
            }}
          >
            💡 Hint {hints + 1} of 3
          </button>
        )}
        <button className="btn small ghost" onClick={() => setShowSol((s) => !s)} aria-expanded={showSol}>
          {showSol ? 'Hide' : 'Show'} worked solution
        </button>
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
      {showSol && <WorkedLines lines={p.solution} upto={p.solution.length} />}
    </div>
  );
}
