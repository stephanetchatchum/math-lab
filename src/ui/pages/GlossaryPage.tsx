import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { allGlossary, loadAllTopics } from '../../content/registry';
import { META_BY_ID } from '../../content/curriculum';
import { Rich } from '../Rich';

export default function GlossaryPage() {
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  useEffect(() => {
    void loadAllTopics().then(() => setReady(true));
  }, []);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return allGlossary().filter((g) => !n || g.term.toLowerCase().includes(n) || g.def.toLowerCase().includes(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ready]);
  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [loc.hash, ready]);
  return (
    <div>
      <h1>Glossary</h1>
      <input className="search" type="search" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
      <dl className="glossary">
        {list.map((g) => (
          <div key={g.id} id={g.id} className={`card gentry ${loc.hash === `#${g.id}` ? 'target' : ''}`}>
            <dt>{g.term}</dt>
            <dd>
              <Rich text={g.def} />
              {g.topic && META_BY_ID[g.topic] && (
                <div className="faint small">
                  From <Link to={`/topic/${g.topic}`}>{META_BY_ID[g.topic].title}</Link>
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
