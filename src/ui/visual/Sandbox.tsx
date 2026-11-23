import { useMemo, useState } from 'react';
import type { MeterData, Pt, SandboxDef, SandboxState, Scene } from '../../content/types';
import { colorVar } from '../../content/quantities';
import { Rich } from '../Rich';
import { EqView } from '../blocks';
import { SceneSvg } from './SceneSvg';

export function initialState(def: SandboxDef): SandboxState {
  return {
    values: Object.fromEntries((def.sliders ?? []).map((s) => [s.id, s.log ? Math.pow(10, s.init) : s.init])),
    choices: Object.fromEntries((def.choices ?? []).map((c) => [c.id, c.init])),
    points: Object.fromEntries((def.points ?? []).map((p) => [p.id, p.init])),
  };
}

export function Sandbox({ def }: { def: SandboxDef }) {
  const [st, setSt] = useState<SandboxState>(() => initialState(def));
  const out = useMemo(() => def.render(st), [def, st]);
  const meter = useMemo(() => def.meter?.(st), [def, st]);
  const raw = (id: string) => {
    const s = def.sliders!.find((x) => x.id === id)!;
    return s.log ? Math.log10(st.values[id]) : st.values[id];
  };
  const onDrag = (id: string, p: Pt) => {
    const dp = def.points!.find((x) => x.id === id)!;
    const [x0, x1] = out.scene.x, [y0, y1] = out.scene.y;
    let q: Pt = [Math.max(x0, Math.min(x1, p[0])), Math.max(y0, Math.min(y1, p[1]))];
    if (dp.constrain) q = dp.constrain(q, st);
    setSt((s) => ({ ...s, points: { ...s.points, [id]: q } }));
  };

  return (
    <div className="sandbox" data-testid={`sandbox-${def.id}`}>
      <div>
        <SceneSvg scene={out.scene} drag={def.points?.map((p) => ({ id: p.id, at: st.points[p.id], label: p.label, role: p.role }))} onDrag={onDrag} />
        {out.eq && <EqView eq={out.eq} />}
        {out.note && <p className="dim" aria-live="polite">{out.note}</p>}
        {meter && <Meter data={meter} />}
      </div>
      <div className="panel">
        {def.sliders?.map((s) => {
          const v = st.values[s.id];
          return (
            <div className="ctl" key={s.id}>
              <label htmlFor={`sl-${def.id}-${s.id}`}>
                <span className={s.role ? (s.role.startsWith('q-') ? s.role : `r-${s.role}`) : ''}>{s.label}</span>
                <span className="mono">{s.format ? s.format(v) : +v.toPrecision(4)}</span>
              </label>
              <input
                id={`sl-${def.id}-${s.id}`}
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={raw(s.id)}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setSt((x) => ({ ...x, values: { ...x.values, [s.id]: s.log ? Math.pow(10, r) : r } }));
                }}
              />
            </div>
          );
        })}
        {def.choices?.map((c) => (
          <div className="ctl" key={c.id}>
            <label htmlFor={`ch-${def.id}-${c.id}`}>{c.label}</label>
            <select id={`ch-${def.id}-${c.id}`} className="btn" value={st.choices[c.id]} onChange={(e) => setSt((x) => ({ ...x, choices: { ...x.choices, [c.id]: e.target.value } }))}>
              {c.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {out.readouts && (
          <div className="readouts" aria-live="polite">
            {out.readouts.map((r) => (
              <div className="readout" key={r.label}>
                <span>{r.label}</span>
                <b style={{ color: colorVar(r.role) }}>{r.value}</b>
              </div>
            ))}
          </div>
        )}
        <button className="btn small ghost" style={{ marginTop: 12 }} onClick={() => setSt(initialState(def))}>
          Reset
        </button>
        {def.tryThis.length > 0 && (
          <>
            <h3>Try this</h3>
            <ol className="try">
              {def.tryThis.map((t, i) => (
                <li key={i}>
                  <Rich text={t} />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

/** Cost / accuracy meter: error vs parameter on log–log axes, plus an operation count. */
export function Meter({ data }: { data: MeterData }) {
  const all = data.curves.flatMap((c) => c.points).filter((p) => p[0] > 0 && p[1] > 0);
  if (!all.length) return null;
  const lx = all.map((p) => Math.log10(p[0]));
  const ly = all.map((p) => Math.log10(p[1]));
  const xr: [number, number] = [Math.floor(Math.min(...lx)), Math.ceil(Math.max(...lx))];
  const yr: [number, number] = [Math.floor(Math.min(...ly)), Math.ceil(Math.max(...ly))];
  if (yr[0] === yr[1]) yr[1]++;
  const scene: Scene = {
    x: xr,
    y: yr,
    size: [640, 300],
    xLabel: data.xLabel,
    yLabel: data.yLabel,
    logTicks: { x: true, y: true },
    alt: `${data.title}: ${data.yLabel} against ${data.xLabel} on log scales.`,
    items: [
      ...data.curves.map((c) => ({
        kind: 'polyline' as const,
        points: c.points.filter((p) => p[0] > 0 && p[1] > 0).map((p): Pt => [Math.log10(p[0]), Math.log10(p[1])]),
        role: c.role,
        width: 2.5,
      })),
      ...(data.marker ? [{ kind: 'vline' as const, x: Math.log10(data.marker.x), role: 'active' as const, label: data.marker.label }] : []),
    ],
  };
  return (
    <div className="meter" data-testid="meter">
      <h3>{data.title}</h3>
      <div className="legend">
        {data.curves.map((c) => (
          <span key={c.label} style={{ color: colorVar(c.role) }}>
            {c.label}
          </span>
        ))}
      </div>
      <SceneSvg scene={scene} />
      {data.ops && (
        <div className="readouts">
          {data.ops.map((o) => (
            <div className="readout" key={o.label}>
              <span>{o.label}</span>
              <b>{o.value.toLocaleString()}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
