import { Link } from 'react-router-dom';
import { COURSES, META_BY_ID } from '../../content/curriculum';
import { COMPARE, isBuilt } from '../../content/registry';
import { dueReviews, streak } from '../../engine/progress';
import { useProgress } from '../state';

export function Dashboard() {
  const { data } = useProgress();
  const finished = Object.values(data.topics).filter((t) => t.done).length;
  const solved = Object.keys(data.solved).length;
  const due = dueReviews(data).length;
  const nextId = COURSES.flatMap((c) => c.topics).find((t) => isBuilt(t.id) && !data.topics[t.id]?.done)?.id;

  return (
    <div className="dashboard">
      <div className="dash-head">
        <div>
          <p className="dim" style={{ margin: 0 }}>
            {finished || solved ? 'Welcome back' : 'Welcome'}
          </p>
          <h1 className="motto">See it. Hear it. Write it. Compute it.</h1>
        </div>
        <div className="stats">
          <div className="stat">
            <b data-testid="stat-finished">{finished}</b>
            <span>topics finished</span>
          </div>
          <div className="stat">
            <b>{solved}</b>
            <span>problems solved</span>
          </div>
          <div className="stat">
            <b>{streak(data.activity)}</b>
            <span>day streak</span>
          </div>
          <Link className={`stat ${due ? 'due' : ''}`} to="/review">
            <b>{due}</b>
            <span>reviews due</span>
          </Link>
        </div>
      </div>
      {nextId && (
        <Link to={`/topic/${nextId}`} className="card continue" data-testid="continue">
          <span className="faint">{data.topics[nextId] ? 'Continue where you left off' : 'Start here'}</span>
          <b className="display">
            {META_BY_ID[nextId].number} {META_BY_ID[nextId].title}
          </b>
          <span className="btn primary">{data.topics[nextId] ? 'Continue →' : 'Start →'}</span>
        </Link>
      )}
      <p className="row" style={{ marginTop: 10 }}>
        <Link className="btn small ghost" to="/map">
          Prerequisite map
        </Link>
        <Link className="btn small ghost" to="/formulas">
          Formula sheet
        </Link>
        <Link className="btn small ghost" to="/glossary">
          Glossary
        </Link>
      </p>

      {COURSES.map((c) => {
        const built = c.topics.filter((t) => isBuilt(t.id)).length;
        return (
          <section key={c.id} className="course" aria-labelledby={`c-${c.id}`}>
            <div className="course-head">
              <h2 id={`c-${c.id}`}>
                <span className="faint">{c.number}</span> {c.title}
              </h2>
              {COMPARE[c.id] && (
                <Link className="btn small" to={`/compare/${c.id}`}>
                  Which tool when?
                </Link>
              )}
            </div>
            <p className="dim">
              {c.blurb} <span className="faint">· {built ? `${built} of ${c.topics.length} topics built` : `${c.topics.length} topics, coming in a later milestone`}</span>
            </p>
            <div className="topic-grid">
              {c.topics.map((t) => {
                const tp = data.topics[t.id];
                const builtT = isBuilt(t.id);
                const pct = tp ? Math.min(100, (tp.completed.length / (tp.total ?? 13)) * 100) : 0;
                const cls = `card tcard ${builtT ? '' : 'soon'} ${t.id === nextId ? 'next' : ''} ${tp?.done ? 'done' : ''}`;
                const body = (
                  <>
                    <span className="num">{t.number}</span>
                    <span className="icon" aria-hidden="true">
                      {t.icon}
                    </span>
                    <h3>{t.title}</h3>
                    <p>{t.blurb}</p>
                    {t.prereqs.length > 0 && (
                      <p className="needs">Needs: {t.prereqs.map((p) => META_BY_ID[p]?.title ?? p).join(', ')}</p>
                    )}
                    {builtT ? (
                      <span className="bar" aria-label={`${Math.round(pct)}% done`}>
                        <i style={{ width: `${pct}%` }} />
                      </span>
                    ) : (
                      <span className="soon-tag">coming soon</span>
                    )}
                  </>
                );
                return builtT ? (
                  <Link key={t.id} to={`/topic/${t.id}`} className={cls} data-testid={`card-${t.id}`}>
                    {body}
                  </Link>
                ) : (
                  <div key={t.id} className={cls} aria-disabled="true">
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
