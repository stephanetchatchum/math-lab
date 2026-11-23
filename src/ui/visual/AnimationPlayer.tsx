import { useEffect, useRef, useState } from 'react';
import type { AnimationDef } from '../../content/types';
import { useReader } from '../reader/ReaderProvider';
import { SceneSvg } from './SceneSvg';
import { EqView } from '../blocks';

const SPEEDS = [0.5, 1, 1.5, 2];

/** Step-by-step animation: Play / Step / Back / Speed, with captions that can be spoken. */
export function AnimationPlayer({ anim, onFinished, autoPlay = false }: { anim: AnimationDef; onFinished?: () => void; autoPlay?: boolean }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const reader = useReader();
  const run = useRef(0);
  const n = anim.frames.length;
  const f = anim.frames[Math.min(i, n - 1)];

  useEffect(() => {
    setI(0);
    setPlaying(autoPlay);
  }, [anim, autoPlay]);

  useEffect(() => {
    if (!playing) return;
    const my = ++run.current;
    let cancelled = false;
    (async () => {
      let k = i;
      while (!cancelled && my === run.current) {
        const t0 = Date.now();
        await reader.narrate(anim.frames[k].caption);
        if (cancelled || my !== run.current) return;
        const spokeFor = Date.now() - t0;
        const words = anim.frames[k].caption.split(/\s+/).length;
        // narrated: speech already paced the frame, so just a short beat; silent: reading time
        const minMs = (spokeFor > 300 ? 600 : Math.max(1400, words * 260)) / speed;
        const left = minMs - (Date.now() - t0);
        if (left > 0) await new Promise((r) => setTimeout(r, left));
        if (cancelled || my !== run.current) return;
        if (k >= n - 1) {
          setPlaying(false);
          onFinished?.();
          return;
        }
        k++;
        setI(k);
      }
    })();
    return () => {
      cancelled = true;
    };
    // restart the loop only when play state or speed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, anim]);

  const stopAnd = (fn: () => void) => {
    run.current++;
    setPlaying(false);
    fn();
  };
  const atEnd = i >= n - 1;

  return (
    <div className="player" data-testid={`anim-${anim.id}`}>
      <SceneSvg scene={f.scene} />
      <div className="ctrls">
        <button className="btn" aria-label="Restart" onClick={() => stopAnd(() => setI(0))}>
          ⏮
        </button>
        <button className="btn" aria-label="Back one frame" disabled={i === 0} onClick={() => stopAnd(() => setI((x) => Math.max(0, x - 1)))}>
          ◀
        </button>
        <button
          className="btn primary"
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid="anim-play"
          onClick={() => {
            if (playing) stopAnd(() => undefined);
            else {
              if (atEnd) setI(0);
              setPlaying(true);
            }
          }}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <button
          className="btn"
          aria-label="Next frame"
          data-testid="anim-step"
          disabled={atEnd}
          onClick={() =>
            stopAnd(() => {
              const k = Math.min(n - 1, i + 1);
              setI(k);
              void reader.narrate(anim.frames[k].caption);
              if (k === n - 1) onFinished?.();
            })
          }
        >
          ▶|
        </button>
        <div className="track" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1} aria-label="Animation progress">
          <i style={{ width: `${((i + 1) / n) * 100}%` }} />
        </div>
        <span className="count">
          {i + 1} / {n}
        </span>
        <button className="btn small" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Animation speed">
          {speed}× speed
        </button>
      </div>
      <p className="cap" aria-live="polite" data-testid="anim-caption">
        {f.caption}
      </p>
      {f.eq && <EqView eq={f.eq} />}
    </div>
  );
}
