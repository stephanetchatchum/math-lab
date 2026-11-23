import { useRef, type PointerEvent as RPE, type ReactNode } from 'react';
import type { Pt, Scene, SceneItem } from '../../content/types';
import { colorVar } from '../../content/quantities';

export interface DragSpec {
  id: string;
  at: Pt;
  label: string;
  role?: string;
}

const PAD = { l: 46, r: 16, t: 14, b: 36 };

export function niceTicks(lo: number, hi: number, target = 6): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [];
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= target) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function fmtTick(v: number, log: boolean) {
  if (log) return `10${sup(v)}`;
  if (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0)) return v.toExponential(0);
  return String(+v.toFixed(4));
}
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (v: number) => String(Math.round(v)).split('').map((c) => SUP[c] ?? c).join('');

export function makeMap(scene: Scene) {
  const [W, H] = scene.size ?? [640, 400];
  const [x0, x1] = scene.x;
  const [y0, y1] = scene.y;
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const ix = (px: number) => x0 + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (x1 - x0);
  const iy = (py: number) => y0 + ((H - PAD.b - py) / (H - PAD.t - PAD.b)) * (y1 - y0);
  return { W, H, sx, sy, ix, iy };
}

const clampY = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : NaN);

export function SceneSvg({
  scene,
  drag,
  onDrag,
  className = '',
  testId,
}: {
  scene: Scene;
  drag?: DragSpec[];
  onDrag?: (id: string, p: Pt) => void;
  className?: string;
  testId?: string;
}) {
  const m = makeMap(scene);
  const { W, H, sx, sy } = m;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const [x0, x1] = scene.x;
  const [y0, y1] = scene.y;
  // keep off-screen values from producing giant paths
  const ylo = y0 - (y1 - y0) * 2;
  const yhi = y1 + (y1 - y0) * 2;

  const toWorld = (e: RPE): Pt => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    return [m.ix(px), m.iy(py)];
  };

  const grid: ReactNode[] = [];
  const xt = niceTicks(x0, x1, Math.round(W / 90));
  const yt = niceTicks(y0, y1, Math.round(H / 60));
  if (scene.grid !== false) {
    xt.forEach((v) => grid.push(<line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={sy(y0)} y2={sy(y1)} className="grid" />));
    yt.forEach((v) => grid.push(<line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={sx(x0)} x2={sx(x1)} className="grid" />));
  }
  const axes: ReactNode[] = [];
  if (scene.axes !== false) {
    const ax = y0 <= 0 && y1 >= 0 ? 0 : y0;
    const ay = x0 <= 0 && x1 >= 0 ? 0 : x0;
    axes.push(<line key="ax" x1={sx(x0)} x2={sx(x1)} y1={sy(ax)} y2={sy(ax)} className="axis" />);
    axes.push(<line key="ay" x1={sx(ay)} x2={sx(ay)} y1={sy(y0)} y2={sy(y1)} className="axis" />);
    xt.forEach((v) =>
      axes.push(
        <text key={`tx${v}`} x={sx(v)} y={H - PAD.b + 16} className="tick" textAnchor="middle">
          {fmtTick(v, !!scene.logTicks?.x)}
        </text>,
      ),
    );
    yt.forEach((v) =>
      axes.push(
        <text key={`ty${v}`} x={PAD.l - 6} y={sy(v) + 4} className="tick" textAnchor="end">
          {fmtTick(v, !!scene.logTicks?.y)}
        </text>,
      ),
    );
    if (scene.xLabel)
      axes.push(
        <text key="xl" x={W - PAD.r} y={H - 4} className="axlabel" textAnchor="end">
          {scene.xLabel}
        </text>,
      );
    if (scene.yLabel)
      axes.push(
        <text key="yl" x={PAD.l + 4} y={PAD.t + 10} className="axlabel">
          {scene.yLabel}
        </text>,
      );
  }

  const item = (it: SceneItem, k: number): ReactNode => {
    const col = colorVar(it.role);
    switch (it.kind) {
      case 'fn': {
        const a = it.from ?? x0, b = it.to ?? x1;
        const n = it.samples ?? 240;
        let d = '';
        let pen = false;
        for (let i = 0; i <= n; i++) {
          const x = a + ((b - a) * i) / n;
          const y = clampY(it.f(x), ylo, yhi);
          if (!Number.isFinite(y)) {
            pen = false;
            continue;
          }
          d += `${pen ? 'L' : 'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`;
          pen = true;
        }
        return <path key={k} d={d} fill="none" stroke={col} strokeWidth={it.width ?? 3} strokeDasharray={it.dash ? '7 6' : undefined} className="stroke" />;
      }
      case 'polyline': {
        const pts = it.points.filter((p) => Number.isFinite(p[1])).map((p) => `${sx(p[0]).toFixed(2)},${sy(clampY(p[1], ylo, yhi)).toFixed(2)}`);
        if (it.closed || it.fill)
          return <polygon key={k} points={pts.join(' ')} fill={it.fill ? col : 'none'} fillOpacity={it.fill ? 0.2 : undefined} stroke={col} strokeWidth={it.width ?? 2.5} className="stroke" />;
        return <polyline key={k} points={pts.join(' ')} fill="none" stroke={col} strokeWidth={it.width ?? 2.5} strokeDasharray={it.dash ? '7 6' : undefined} className="stroke" />;
      }
      case 'point': {
        const [px, py] = [sx(it.at[0]), sy(it.at[1])];
        if (!Number.isFinite(py)) return null;
        const dir = it.labelDir ?? 'ne';
        const dx = dir.includes('e') ? 10 : dir.includes('w') ? -10 : 0;
        const dy = dir.includes('n') ? -10 : dir.includes('s') ? 20 : 4;
        return (
          <g key={k}>
            <circle cx={px} cy={py} r={it.r ?? 6} fill={it.hollow ? 'var(--panel)' : col} stroke={col} strokeWidth={2.5} />
            {it.label && (
              <text x={px + dx} y={py + dy} fill={col} className="plabel" textAnchor={dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'}>
                {it.label}
              </text>
            )}
          </g>
        );
      }
      case 'segment': {
        const id = `ah${k}`;
        return (
          <g key={k}>
            {it.arrow && (
              <defs>
                <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0L10,5L0,10z" fill={col} />
                </marker>
              </defs>
            )}
            <line
              x1={sx(it.a[0])}
              y1={sy(it.a[1])}
              x2={sx(it.b[0])}
              y2={sy(it.b[1])}
              stroke={col}
              strokeWidth={it.width ?? 2.5}
              strokeDasharray={it.dash ? '7 6' : undefined}
              markerEnd={it.arrow ? `url(#${id})` : undefined}
              className="stroke"
            />
          </g>
        );
      }
      case 'line': {
        const [px, py] = it.through;
        const f = (x: number) => py + it.slope * (x - px);
        return <line key={k} x1={sx(x0)} y1={sy(clampY(f(x0), ylo, yhi))} x2={sx(x1)} y2={sy(clampY(f(x1), ylo, yhi))} stroke={col} strokeWidth={it.width ?? 2.5} strokeDasharray={it.dash ? '7 6' : undefined} className="stroke" />;
      }
      case 'vline':
        return (
          <g key={k}>
            <line x1={sx(it.x)} x2={sx(it.x)} y1={sy(y0)} y2={sy(y1)} stroke={col} strokeWidth={1.8} strokeDasharray={it.dash !== false ? '5 5' : undefined} />
            {it.label && (
              <text x={sx(it.x) + 5} y={PAD.t + 14} fill={col} className="plabel">
                {it.label}
              </text>
            )}
          </g>
        );
      case 'hline':
        return (
          <g key={k}>
            <line y1={sy(it.y)} y2={sy(it.y)} x1={sx(x0)} x2={sx(x1)} stroke={col} strokeWidth={1.8} strokeDasharray={it.dash !== false ? '5 5' : undefined} />
            {it.label && (
              <text x={sx(x1) - 4} y={sy(it.y) - 6} fill={col} className="plabel" textAnchor="end">
                {it.label}
              </text>
            )}
          </g>
        );
      case 'rect': {
        const xa = sx(it.x), xb = sx(it.x + it.w), ya = sy(it.y), yb = sy(it.y + it.h);
        return <rect key={k} x={Math.min(xa, xb)} y={Math.min(ya, yb)} width={Math.abs(xb - xa)} height={Math.abs(yb - ya)} fill={col} fillOpacity={it.opacity ?? 0.25} stroke={col} strokeWidth={1.5} />;
      }
      case 'area': {
        const n = 120;
        let d = `M${sx(it.from)},${sy(0)}`;
        for (let i = 0; i <= n; i++) {
          const x = it.from + ((it.to - it.from) * i) / n;
          d += `L${sx(x).toFixed(2)},${sy(clampY(it.f(x), ylo, yhi)).toFixed(2)}`;
        }
        d += `L${sx(it.to)},${sy(0)}Z`;
        return <path key={k} d={d} fill={col} fillOpacity={it.opacity ?? 0.22} stroke="none" />;
      }
      case 'label':
        return (
          <text
            key={k}
            x={sx(it.at[0])}
            y={sy(it.at[1])}
            fill={col}
            fontSize={it.size ?? 16}
            textAnchor={it.anchor ?? 'start'}
            className={it.hand ? 'hand' : 'plabel'}
          >
            {it.text}
          </text>
        );
      case 'brace': {
        const [ax, ay] = [sx(it.a[0]), sy(it.a[1])];
        const [bx, by] = [sx(it.b[0]), sy(it.b[1])];
        const vertical = Math.abs(ax - bx) < 1;
        return (
          <g key={k}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke={col} strokeWidth={2} />
            <line x1={ax - (vertical ? 5 : 0)} y1={ay - (vertical ? 0 : 5)} x2={ax + (vertical ? 5 : 0)} y2={ay + (vertical ? 0 : 5)} stroke={col} strokeWidth={2} />
            <line x1={bx - (vertical ? 5 : 0)} y1={by - (vertical ? 0 : 5)} x2={bx + (vertical ? 5 : 0)} y2={by + (vertical ? 0 : 5)} stroke={col} strokeWidth={2} />
            <text x={(ax + bx) / 2 + (vertical ? 8 : 0)} y={(ay + by) / 2 + (vertical ? 5 : -8)} fill={col} className="plabel" textAnchor={vertical ? 'start' : 'middle'}>
              {it.text}
            </text>
          </g>
        );
      }
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`scene ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={scene.alt}
      data-testid={testId}
      onPointerMove={(e) => {
        if (!dragging.current || !onDrag) return;
        onDrag(dragging.current, toWorld(e));
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerLeave={() => (dragging.current = null)}
    >
      <title>{scene.alt}</title>
      <g>{grid}</g>
      <g>{axes}</g>
      <g>{scene.items.map(item)}</g>
      {drag?.map((d) => (
        <g
          key={d.id}
          className="handle"
          tabIndex={0}
          role="slider"
          aria-label={`${d.label}: drag, or use arrow keys`}
          aria-valuetext={`x ${d.at[0].toFixed(2)}, y ${d.at[1].toFixed(2)}`}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            dragging.current = d.id;
          }}
          onKeyDown={(e) => {
            const step = (x1 - x0) / 100;
            const ystep = (y1 - y0) / 100;
            const map: Record<string, Pt> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, ystep], ArrowDown: [0, -ystep] };
            const dv = map[e.key];
            if (!dv || !onDrag) return;
            e.preventDefault();
            e.stopPropagation();
            onDrag(d.id, [d.at[0] + dv[0], d.at[1] + dv[1]]);
          }}
        >
          <circle cx={sx(d.at[0])} cy={sy(d.at[1])} r={18} fill="transparent" />
          <circle cx={sx(d.at[0])} cy={sy(d.at[1])} r={9} fill={colorVar(d.role ?? 'active')} stroke="var(--shadow)" strokeWidth={2.5} />
        </g>
      ))}
    </svg>
  );
}
