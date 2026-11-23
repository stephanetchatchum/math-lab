import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { META_BY_ID } from '../../content/curriculum';
import { loadTopic } from '../../content/registry';
import type { HandProblem, Question, Topic } from '../../content/types';
import { addDays, dueReviews, REVIEW_INTERVALS, scheduleAfter, today } from '../../engine/progress';
import { useProgress } from '../state';
import { HandProblemView, QuestionView } from '../steps/answers';

/** Pick review material: rotate through the topic's recall/quiz questions and its hand problems. */
export function reviewMaterial(t: Topic, round: number): { q: Question | null; p: HandProblem | null } {
  const qs = t.steps.flatMap((s) => (s.kind === 'recall' ? s.questions : s.kind === 'recap' ? s.quiz : []));
  const ps = t.steps.flatMap((s) => (s.kind === 'yourTurn' ? s.problems : []));
  return { q: qs.length ? qs[round % qs.length] : null, p: ps.length ? ps[round % ps.length] : null };
}

export default function ReviewPage() {
  const { data } = useProgress();
  const due = dueReviews(data);
  const upcoming = Object.entries(data.review)
    .filter(([id]) => !due.includes(id))
    .sort((a, b) => a[1].due.localeCompare(b[1].due));
  return (
    <div>
      <h1>Review</h1>
      <p className="dim">
        Finished topics come back after {REVIEW_INTERVALS.join(', ')} days. Get the question and the problem right and the gap grows; miss one and it comes
        back tomorrow. Short, regular recall beats rereading.
      </p>
      {due.length === 0 && <p className="card">Nothing due today. {upcoming.length ? '' : 'Finish a topic to start your review schedule.'}</p>}
      {due.map((id) => (
        <ReviewCard key={id} id={id} />
      ))}
      {upcoming.length > 0 && (
        <>
          <h2>Coming up</h2>
          <table className="plain">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Due</th>
                <th>Interval</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(([id, r]) => (
                <tr key={id}>
                  <td>{META_BY_ID[id]?.title ?? id}</td>
                  <td>{r.due}</td>
                  <td>{REVIEW_INTERVALS[r.stage]} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function ReviewCard({ id }: { id: string }) {
  const { data, update } = useProgress();
  const item = data.review[id];
  const [topic, setTopic] = useState<Topic | null>(null);
  const [qOk, setQOk] = useState<boolean | null>(null);
  const [pOk, setPOk] = useState<boolean | null>(null);
  useEffect(() => {
    loadTopic(id).then(setTopic, () => setTopic(null));
  }, [id]);
  if (!topic || !item) return null;
  const round = item.history.length;
  const { q, p } = reviewMaterial(topic, round);
  const ready = (q ? qOk !== null : true) && (p ? pOk !== null : true);
  const ok = (q ? !!qOk : true) && (p ? !!pOk : true);
  const nextStage = ok ? Math.min(item.stage + 1, REVIEW_INTERVALS.length - 1) : 0;
  return (
    <div className="card review-card" data-testid={`review-${id}`}>
      <h2 style={{ marginTop: 0 }}>
        <Link to={`/topic/${id}`}>{topic.title}</Link>
      </h2>
      {q && <QuestionView key={`${id}-q-${round}`} q={{ ...q, id: `${q.id}-rv${round}` }} onResult={(o) => setQOk((prev) => (prev === null ? o : prev))} />}
      {p && <HandProblemView key={`${id}-p-${round}`} p={{ ...p, id: `${p.id}-rv${round}` }} n={1} onHint={() => undefined} onResult={(o) => setPOk((prev) => (prev === null ? o : prev))} />}
      {ready && (
        <div className="row">
          <span className={ok ? 'r-done' : 'r-error'}>
            {ok ? 'Both right first time.' : 'Not this time — that is useful information.'} Next review in {REVIEW_INTERVALS[nextStage]} day
            {REVIEW_INTERVALS[nextStage] > 1 ? 's' : ''} ({addDays(today(), REVIEW_INTERVALS[nextStage])}).
          </span>
          <button className="btn primary" onClick={() => update((d) => void (d.review[id] = scheduleAfter(d.review[id], ok)))} data-testid="review-done">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
