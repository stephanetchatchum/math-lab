import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAllTopics } from '../../content/registry';
import type { Topic } from '../../content/types';
import { Tex } from '../Tex';
import { getReader } from '../../engine/reader';

export default function FormulasPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    void loadAllTopics().then(setTopics);
  }, []);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return topics.flatMap((t) =>
      t.formulas
        .filter((f) => !needle || `${f.name} ${f.say} ${f.tex} ${t.title}`.toLowerCase().includes(needle))
        .map((f) => ({ t, f })),
    );
  }, [topics, q]);
  return (
    <div>
      <h1>Formula sheet</h1>
      <p className="dim">Every formula with how to say it, linked back to its lesson. Search by name, words or symbols.</p>
      <input className="search" type="search" placeholder="Search formulas…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search formulas" />
      <div className="fgrid" style={{ marginTop: 16 }}>
        {rows.map(({ t, f }, i) => (
          <div key={i} className="card formula">
            <div>
              <b>{f.name}</b>
              <div className="faint small">
                <Link to={`/topic/${t.id}`}>{t.title}</Link>
              </div>
            </div>
            <div>
              <Tex tex={f.tex} say={f.say} display />
              <div className="say">
                <button className="btn small ghost" aria-label={`Say: ${f.say}`} onClick={() => void getReader().speakOnce(f.say)}>
                  🔊
                </button>{' '}
                “{f.say}”
              </div>
            </div>
          </div>
        ))}
        {topics.length > 0 && rows.length === 0 && <p>No formula matches “{q}”.</p>}
      </div>
    </div>
  );
}
