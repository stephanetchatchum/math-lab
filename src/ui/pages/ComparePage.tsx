import { Link, useParams } from 'react-router-dom';
import { COURSES } from '../../content/curriculum';
import { COMPARE } from '../../content/registry';
import { Rich } from '../Rich';

export default function ComparePage() {
  const { course } = useParams();
  const list = course ? COURSES.filter((c) => c.id === course) : COURSES.filter((c) => COMPARE[c.id]);
  return (
    <div>
      <h1>Which tool when?</h1>
      <p className="dim">Side-by-side choices for each course: what to reach for, when it works, and what it costs.</p>
      {!course && (
        <p className="row">
          {COURSES.map((c) =>
            COMPARE[c.id] ? (
              <Link key={c.id} className="btn small" to={`/compare/${c.id}`}>
                {c.title}
              </Link>
            ) : null,
          )}
        </p>
      )}
      {list.map((c) => (
        <section key={c.id}>
          <h2>{c.title}</h2>
          {(COMPARE[c.id] ?? []).map((t) => (
            <div key={t.id} className="compare-table">
              <h3>{t.title}</h3>
              <Rich text={t.intro} as="p" />
              <div className="table-wrap">
                <table className="plain">
                  <thead>
                    <tr>
                      {t.head.map((h, i) => (
                        <th key={i}>
                          <Rich text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((cell, j) => (
                          <td key={j}>
                            <Rich text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {!COMPARE[c.id] && <p className="faint">Comparison tables arrive with this course.</p>}
        </section>
      ))}
    </div>
  );
}
