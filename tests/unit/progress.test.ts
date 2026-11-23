import { describe, it, expect } from 'vitest';
import { addDays, streak, scheduleFirst, scheduleAfter, migrate, LocalStore, emptyProgress } from '../../src/engine/progress';

describe('review schedule', () => {
  it('follows 1,3,7,14,30 and resets on a miss', () => {
    let r = scheduleFirst('2026-01-01');
    expect(r.due).toBe('2026-01-02');
    r = scheduleAfter(r, true, '2026-01-02'); expect(r.due).toBe('2026-01-05');
    r = scheduleAfter(r, true, '2026-01-05'); expect(r.due).toBe('2026-01-12');
    r = scheduleAfter(r, true, '2026-01-12'); expect(r.due).toBe('2026-01-26');
    r = scheduleAfter(r, true, '2026-01-26'); expect(r.due).toBe('2026-02-25');
    r = scheduleAfter(r, true, '2026-02-25'); expect(r.due).toBe('2026-03-27');
    r = scheduleAfter(r, false, '2026-03-27'); expect(r.due).toBe('2026-03-28');
    expect(r.stage).toBe(0);
  });
  it('counts streaks across month ends', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(streak(['2026-02-27', '2026-02-28', '2026-03-01'], '2026-03-01')).toBe(3);
    expect(streak(['2026-02-27', '2026-02-28'], '2026-03-01')).toBe(2);
    expect(streak(['2026-02-26'], '2026-03-01')).toBe(0);
  });
});

describe('storage', () => {
  it('round-trips and rejects foreign JSON', async () => {
    const s = new LocalStore(window.localStorage);
    const d = emptyProgress();
    d.solved['x'] = '2026-01-01';
    await s.save(d);
    expect((await s.load()).solved['x']).toBe('2026-01-01');
    expect(() => migrate({ hello: 1 })).toThrow();
  });
});
