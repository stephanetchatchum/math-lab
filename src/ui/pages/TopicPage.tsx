import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { COURSES, META_BY_ID } from '../../content/curriculum';
import { loadTopic, stepsFor } from '../../content/registry';
import { STEP_LABEL, type Topic } from '../../content/types';
import { scheduleFirst, today } from '../../engine/progress';
import { BarPortal } from '../App';
import { useReader } from '../reader/ReaderProvider';
import { useProgress, useTopicProgress } from '../state';
import { StepView } from '../steps/StepViews';

export default function TopicPage() {
  const { id = '', step: stepParam } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setTopic(null);
    setErr('');
    loadTopic(id).then(setTopic, (e) => setErr(String(e.message ?? e)));
  }, [id]);
  if (err) {
    const m = META_BY_ID[id];
    return (
      <div>
        <p className="crumbs">
          <Link to="/">Map</Link>
        </p>
        <h1>{m?.title ?? 'Unknown topic'}</h1>
        <p>{m ? 'This topic is planned but not built yet. See PROGRESS.md for the build order.' : err}</p>
      </div>
    );
  }
  if (!topic) return <p className="faint">Loading topic…</p>;
  return <Player topic={topic} stepParam={stepParam} />;
}

function Player({ topic, stepParam }: { topic: Topic; stepParam?: string }) {
  const steps = stepsFor(topic);
  const [tp, setTp] = useTopicProgress(topic.id);
  const { data, update } = useProgress();
  const nav = useNavigate();
  const reader = useReader();
  const course = COURSES.find((c) => c.id === topic.course)!;
  const tIndex = course.topics.findIndex((t) => t.id === topic.id);

  const fromParam = stepParam ? steps.findIndex((s) => s.id === stepParam) : -1;
  const index = fromParam >= 0 ? fromParam : Math.min(tp.step, steps.length - 1);
  const step = steps[index];

  useEffect(() => {
    if (tp.step !== index || tp.total !== steps.length)
      setTp((t) => {
        t.step = index;
        t.total = steps.length;
      });
  }, [index, tp.step, tp.total, steps.length, setTp]);

  const markComplete = useCallback(() => {
    setTp((t) => {
      if (!t.completed.includes(step.id)) t.completed.push(step.id);
    });
    if (step.kind === 'recap') {
      update((d) => {
        const t = d.topics[topic.id];
        if (t && !t.done) {
          t.done = true;
          t.doneAt = today();
          d.review[topic.id] ??= scheduleFirst();
        }
      });
    }
  }, [setTp, step.id, step.kind, topic.id, update]);

  const go = (i: number) => {
    nav(`/topic/${topic.id}/${steps[i].id}`);
  };
  const next = () => {
    setTp((t) => {
      if (!t.completed.includes(step.id) && step.kind !== 'recap') t.completed.push(step.id);
    });
    if (index < steps.length - 1) go(index + 1);
    else nav('/');
  };
  const nextLabel = index < steps.length - 1 ? `Next: ${steps[index + 1].title ?? STEP_LABEL[steps[index + 1].kind]}` : tp.done ? 'Back to the map ✓' : 'Back to the map';
  const label = step.title ?? STEP_LABEL[step.kind];

  return (
    <div
      className="topic"
      onDoubleClick={(e) => {
        const el = (e.target as HTMLElement).closest('[data-line]');
        if (!el || (e.target as HTMLElement).closest('input, textarea, .cm-editor, button')) return;
        const i = Number(el.getAttribute('data-line'));
        if (Number.isFinite(i)) {
          window.getSelection()?.removeAllRanges();
          reader.play(i);
        }
      }}
    >
      <div className="topic-top">
        <div>
          <div className="crumbs">
            <Link to="/">{course.title}</Link> · Topic {tIndex + 1} of {course.topics.length}
          </div>
          <h1 className="topic-title">{topic.title}</h1>
        </div>
        <div className="row topic-progress">
          <div className="ticks" role="tablist" aria-label="Steps">
            {steps.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Step ${i + 1}: ${s.title ?? STEP_LABEL[s.kind]}${tp.completed.includes(s.id) ? ' (done)' : ''}`}
                title={s.title ?? STEP_LABEL[s.kind]}
                className={`${i === index ? 'cur' : ''} ${tp.completed.includes(s.id) ? 'done' : ''}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <span className="step-label" data-testid="step-label">
            step <b>{index + 1}</b> of {steps.length} — {label}
          </span>
          <button
            className={`btn ${data.settings.focus ? 'on' : ''}`}
            aria-pressed={data.settings.focus}
            onClick={() => update((d) => void (d.settings.focus = !d.settings.focus))}
            data-testid="focus-toggle"
          >
            ◎ Focus
          </button>
        </div>
      </div>
      <div className="progress-bar thin" aria-hidden="true">
        <i style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <div className="step-wrap" key={step.id} data-testid={`step-${step.kind}`}>
        <StepView topic={topic} step={step} tp={tp} setTp={setTp} markComplete={markComplete} steps={steps} index={index} />
      </div>
      <BarPortal>
        <button className="btn" onClick={() => go(Math.max(0, index - 1))} disabled={index === 0} data-testid="step-back">
          Back
        </button>
        <button className="btn big primary" onClick={next} data-testid="step-next">
          {nextLabel}
        </button>
      </BarPortal>
    </div>
  );
}
