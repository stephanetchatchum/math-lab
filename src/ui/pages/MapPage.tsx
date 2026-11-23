import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_TOPIC_META, COURSES, META_BY_ID } from '../../content/curriculum';
import { ancestors, depths, descendants } from '../../content/graph';
import { isBuilt } from '../../content/registry';
import { useProgress } from '../state';

const NW = 186, NH = 44, GX = 64, GY = 14;
const COURSE_HUE = ['#f6d860', '#ffa657', '#7cc4f2', '#c3a6ff', '#a6e37f', '#ff8fc7', '#5fd1c1', '#f0b27a', '#9fd8cf', '#ff7b6b', '#b3e5fc', '#e6b3ff'];

export default function MapPage() {
  const { data } = useProgress();
  const nav = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const layout = useMemo(() => {
    const d = depths(ALL_TOPIC_META);
    const cols: string[][] = [];
    const courseIdx = Object.fromEntries(COURSES.map((c, i) => [c.id, i]));
    [...ALL_TOPIC_META]
      .sort((a, b) => courseIdx[a.course] - courseIdx[b.course] || a.number.localeCompare(b.number, undefined, { numeric: true }))
      .forEach((t) => (cols[d[t.id]] ??= []).push(t.id));
    const pos: Record<string, [number, number]> = {};
    cols.forEach((col, ci) => col.forEach((id, ri) => (pos[id] = [20 + ci * (NW + GX), 20 + ri * (NH + GY)])));
    const W = 40 + cols.length * (NW + GX);
    const H = 40 + Math.max(...cols.map((c) => c.length)) * (NH + GY);
    return { pos, W, H };
  }, []);

  const hi = useMemo(() => {
    if (!hover) return null;
    return { up: ancestors(ALL_TOPIC_META, hover), down: descendants(ALL_TOPIC_META, hover) };
  }, [hover]);

  const visible = (id: string) => courseFilter === 'all' || META_BY_ID[id].course === courseFilter;
  const courseIdx = (id: string) => COURSES.findIndex((c) => c.id === META_BY_ID[id].course);

  return (
    <div>
      <h1>Prerequisite map</h1>
      <p className="dim">
        Left to right: what you need before what. Hover or focus a topic to light up what it needs (
        <span className="r-given">needs</span>) and what it unlocks (<span className="r-result">unlocks</span>). Dashed = not built yet.
      </p>
      <div className="row">
        <select className="btn" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Show course">
          <option value="all">All courses</option>
          {COURSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.number}. {c.title}
            </option>
          ))}
        </select>
        <div className="legend">
          {COURSES.map((c, i) => (
            <span key={c.id} style={{ color: COURSE_HUE[i] }}>
              {c.title}
            </span>
          ))}
        </div>
      </div>
      <div className="map-scroll">
        <svg width={layout.W} height={layout.H} className="prereq-map" role="img" aria-label="Prerequisite graph of all topics. A text version follows below.">
          {ALL_TOPIC_META.flatMap((t) =>
            t.prereqs.map((p) => {
              const [x1, y1] = layout.pos[p];
              const [x2, y2] = layout.pos[t.id];
              const a = [x1 + NW, y1 + NH / 2], b = [x2, y2 + NH / 2];
              const needs = !!hi && (t.id === hover || hi.up.has(t.id)) && hi.up.has(p);
              const unlocks = !!hi && (p === hover || hi.down.has(p)) && hi.down.has(t.id);
              const lit = needs || unlocks;
              const dim = (hi && !lit) || !visible(t.id) || !visible(p);
              const mx = (a[0] + b[0]) / 2;
              return (
                <path
                  key={`${p}-${t.id}`}
                  d={`M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`}
                  fill="none"
                  stroke={unlocks ? 'var(--c-result)' : needs ? 'var(--c-given)' : 'var(--line)'}
                  strokeWidth={lit ? 2.5 : 1.2}
                  opacity={dim ? 0.18 : 0.9}
                />
              );
            }),
          )}
          {ALL_TOPIC_META.map((t) => {
            const [x, y] = layout.pos[t.id];
            const built = isBuilt(t.id);
            const done = data.topics[t.id]?.done;
            const role = hover === t.id ? 'self' : hi?.up.has(t.id) ? 'up' : hi?.down.has(t.id) ? 'down' : '';
            const dim = (hi && !role) || !visible(t.id);
            return (
              <g
                key={t.id}
                transform={`translate(${x},${y})`}
                className={`mnode ${built ? 'built' : 'soon'}`}
                opacity={dim ? 0.25 : 1}
                tabIndex={0}
                role="link"
                aria-label={`${t.number} ${t.title}${built ? '' : ' (coming soon)'}${done ? ' (done)' : ''}. Needs: ${t.prereqs.map((p) => META_BY_ID[p].title).join(', ') || 'nothing'}`}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(t.id)}
                onBlur={() => setHover(null)}
                onClick={() => nav(`/topic/${t.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && nav(`/topic/${t.id}`)}
              >
                <rect
                  width={NW}
                  height={NH}
                  rx={9}
                  fill={role === 'self' ? 'var(--panel-2)' : 'var(--panel)'}
                  stroke={role === 'up' ? 'var(--c-given)' : role === 'down' ? 'var(--c-result)' : COURSE_HUE[courseIdx(t.id)]}
                  strokeWidth={role ? 3 : 1.6}
                  strokeDasharray={built ? undefined : '5 4'}
                />
                <text x={10} y={18} className="mn-num" fill={COURSE_HUE[courseIdx(t.id)]}>
                  {t.number} {done ? '✓' : ''}
                </text>
                <text x={10} y={35} className="mn-title" fill="var(--ink)">
                  {t.title.length > 26 ? t.title.slice(0, 25) + '…' : t.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <details className="text-map">
        <summary>Text version of the map</summary>
        {COURSES.map((c) => (
          <div key={c.id}>
            <h3>{c.title}</h3>
            <ul>
              {c.topics.map((t) => (
                <li key={t.id}>
                  <Link to={`/topic/${t.id}`}>
                    {t.number} {t.title}
                  </Link>{' '}
                  — needs: {t.prereqs.map((p) => META_BY_ID[p].title).join(', ') || 'nothing'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </div>
  );
}
