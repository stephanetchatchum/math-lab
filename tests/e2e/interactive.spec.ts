import { test, expect, type Page } from '@playwright/test';
import topic from '../../src/content/topics/calculus/calc-derivative';
import type { CodeProblem, FillGapStep, RecallStep, RecapStep, YourTurnStep } from '../../src/content/types';
import { SHOTS, fresh, setCode, watchErrors } from './helpers';

const step = <K extends string>(kind: K) => topic.steps.find((s) => s.kind === kind)!;
const go = (page: Page, id: string) => page.goto(`./#/topic/calc-derivative/${id}`);

async function runReference(page: Page, p: CodeProblem) {
  const box = page.getByTestId(`runner-${p.id}`);
  // starter fails
  await box.getByTestId('run-tests').click();
  await expect(box.getByTestId('test-summary')).toBeVisible({ timeout: 90_000 });
  await expect(box.getByTestId('test-summary')).not.toContainText(/(\d+) of \1 tests passed/);
  // reference passes
  await setCode(page, p.solution, `[data-testid="runner-${p.id}"]`);
  await box.getByTestId('run-tests').click();
  const n = p.tests.match(/^def test_/gm)!.length;
  await expect(box.getByTestId('test-summary')).toContainText(`${n} of ${n} tests passed`, { timeout: 60_000 });
}

test('Python: compute step and all problems pass with the reference solutions (numpy in the browser)', async ({ page }) => {
  const errs = watchErrors(page);
  await fresh(page);
  const c = step('compute');
  await go(page, c.id);
  if (c.kind === 'compute') await runReference(page, c.problem);
  await page.screenshot({ path: `${SHOTS}/20-compute-passed.png` });
  const pr = step('problems');
  await go(page, pr.id);
  if (pr.kind === 'problems')
    for (const [i, p] of pr.problems.entries()) {
      await page.locator('.tabs [role=tab]').nth(i).click();
      await runReference(page, p);
    }
  await page.screenshot({ path: `${SHOTS}/21-problems-passed.png` });
  expect(errs).toEqual([]);
});

test('Python: infinite loop is stopped and Python restarts', async ({ page }) => {
  await fresh(page);
  const c = step('compute');
  await go(page, c.id);
  if (c.kind !== 'compute') return;
  await setCode(page, 'while True:\n    pass\n');
  await page.getByTestId('run-tests').click();
  await expect(page.getByTestId('run-result')).toContainText(/Stopped after|timed out/, { timeout: 60_000 });
  await setCode(page, c.problem.solution);
  await page.getByTestId('run-tests').click();
  await expect(page.getByTestId('test-summary')).toContainText('3 of 3 tests passed', { timeout: 90_000 });
});

test('Fill the gap with the reference answers', async ({ page }) => {
  await fresh(page);
  const f = step('fillGap') as FillGapStep;
  await go(page, f.id);
  for (const b of f.blanks) await page.getByTestId(`gap-${b.id}`).fill(b.answers[0]);
  await page.getByTestId('gap-check').click();
  await expect(page.getByText('All gaps filled correctly.')).toBeVisible({ timeout: 90_000 });
});

test('Hand answers: numeric, units, symbolic equivalence and ordering', async ({ page }) => {
  await fresh(page);
  const y = step('yourTurn') as YourTurnStep;
  await go(page, y.id);
  const box = (id: string) => page.getByTestId(`answer-${id}`);
  await page.getByTestId('hand-yt-cube').getByRole('button', { name: /Hint 1/ }).click();
  await expect(page.getByTestId('hand-yt-cube').locator('.hint')).toHaveCount(1);
  // wrong first, then right
  await box('yt-quad').getByTestId('answer-input').fill('2');
  await box('yt-quad').getByTestId('answer-check').click();
  await expect(box('yt-quad').getByTestId('verdict')).toContainText('Not quite');
  await box('yt-quad').getByTestId('answer-input').fill('1');
  await box('yt-quad').getByTestId('answer-check').click();
  await expect(box('yt-quad').getByTestId('verdict')).toContainText('Correct');
  // an equivalent but differently written expression
  await box('yt-cube').getByTestId('answer-input').fill('x*3x');
  await box('yt-cube').getByTestId('answer-check').click();
  await expect(box('yt-cube').getByTestId('verdict')).toContainText('Correct');
  // equivalent units: litres per second
  await box('yt-tank').getByTestId('answer-input').fill('-0.4 L/s');
  await box('yt-tank').getByTestId('answer-check').click();
  await expect(box('yt-tank').getByTestId('verdict')).toContainText('Correct');
  // ordering: identify each item by its first word, then sort with the "Move up" buttons
  const o = box('yt-sqrt');
  const order = y.problems[3].answer;
  if (order.kind === 'order') {
    const keys = order.steps.map((t) => t.split(' ')[0]);
    for (let target = 0; target < keys.length; target++) {
      const texts = await o.locator('.order-list li .grow').allInnerTexts();
      let pos = texts.findIndex((t, i) => i >= target && t.trim().startsWith(keys[target]));
      expect(pos).toBeGreaterThanOrEqual(target);
      while (pos > target) {
        await o.locator('.order-list li').nth(pos).getByRole('button', { name: 'Move up' }).click();
        pos--;
      }
    }
    await o.getByTestId('answer-check').click();
    await expect(o.getByTestId('verdict')).toContainText('Correct order');
  }
  await expect(page.getByTestId('hand-yt-quad').getByRole('button', { name: /Hint/ })).toHaveCount(0); // hints hide once solved
  await page.getByTestId('hand-yt-quad').getByRole('button', { name: /Show worked solution/ }).click();
  await page.screenshot({ path: `${SHOTS}/22-your-turn.png`, fullPage: true });
});

test('Finishing the topic updates the dashboard and schedules a review', async ({ page }) => {
  await fresh(page);
  const rc = step('recall') as RecallStep;
  await go(page, rc.id);
  await page.getByTestId('q-rc-secant').getByTestId('opt-1').click();
  await page.getByTestId('q-rc-quotient').getByTestId('answer-input').fill('h + 2a');
  await page.getByTestId('q-rc-quotient').getByTestId('answer-check').click();
  await expect(page.getByTestId('q-rc-quotient').getByTestId('verdict')).toContainText('Correct');
  const r = step('recap') as RecapStep;
  await go(page, r.id);
  await page.getByTestId('own-words').fill('A derivative is the limit of secant slopes as the step size goes to zero. A computer cannot take the limit so it uses a small step and accepts truncation and rounding error.');
  await page.getByTestId('q-qz-fd').getByTestId('answer-input').fill('6.1');
  await page.getByTestId('q-qz-fd').getByTestId('answer-check').click();
  await page.getByTestId('q-qz-corner').getByTestId('opt-1').click();
  await page.getByTestId('q-qz-order').getByTestId('opt-1').click();
  await page.getByTestId('finish-topic').click();
  await page.getByTestId('step-next').click();
  await expect(page.getByTestId('stat-finished')).toHaveText('1');
  // progress survives a reload (stored before render)
  await page.reload();
  await expect(page.getByTestId('stat-finished')).toHaveText('1');
  await page.goto('./#/review');
  await expect(page.getByText('Coming up')).toBeVisible();
  // time travel two days: the review is due
  await page.evaluate(() => {
    const k = 'mathlab.progress.v1';
    const d = JSON.parse(localStorage.getItem(k)!);
    d.review['calc-derivative'].due = '2000-01-01';
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.reload();
  await expect(page.getByTestId('review-calc-derivative')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/23-review.png`, fullPage: true });
});

test('Pages: formulas search, glossary, compare, settings themes and export', async ({ page }) => {
  const errs = watchErrors(page);
  await fresh(page);
  await page.goto('./#/formulas');
  await page.getByLabel('Search formulas').fill('central');
  await expect(page.locator('.formula')).toHaveCount(1);
  await page.screenshot({ path: `${SHOTS}/30-formulas.png` });
  await page.goto('./#/glossary#secant');
  await expect(page.locator('#secant')).toBeVisible();
  await page.goto('./#/compare/calculus');
  await expect(page.getByText('Three ways to get a derivative')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/31-compare.png` });
  await page.goto('./#/settings');
  for (const t of ['chalk', 'paper']) {
    await page.getByTestId(`theme-${t}`).click();
    await page.goto('./#/topic/calc-derivative/learn-1');
    await expect(page.locator('section#picture svg.scene')).toBeVisible();
    await page.locator('section#picture').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/32-theme-${t}.png` });
    await page.goto('./#/settings');
  }
  await page.getByTestId('theme-slate').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  const json = JSON.parse(await (await dl.createReadStream()).toArray().then((b) => Buffer.concat(b).toString()));
  expect(json.version).toBe(1);
  // import it back
  json.solved['imported-marker'] = '2026-01-01';
  await page.getByTestId('import-file').setInputFiles({ name: 'p.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(json)) });
  await expect(page.getByText('Imported progress')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/33-settings.png`, fullPage: true });
  // focus mode hides the rail
  await page.goto('./#/topic/calc-derivative/learn-1');
  await page.getByTestId('focus-toggle').click();
  await expect(page.locator('nav.rail')).toBeHidden();
  await page.screenshot({ path: `${SHOTS}/34-focus.png` });
  expect(errs).toEqual([]);
});

test('Just opening a topic or changing settings does not count as starting or as a study day', async ({ page }) => {
  await fresh(page);
  // the first built topic in course order is the one the dashboard suggests
  await page.goto('./#/topic/f-algebra/learn-1');
  await expect(page.getByTestId('step-label')).toBeVisible();
  await page.getByTestId('focus-toggle').click();
  await page.getByTestId('focus-toggle').click();
  await page.goto('./#/');
  await expect(page.getByTestId('continue')).toContainText('Start here');
  await expect(page.locator('.stat').filter({ hasText: 'day streak' }).locator('b')).toHaveText('0');
  // doing a step does count
  await page.goto('./#/topic/f-algebra/hook');
  await page.getByRole('button', { name: /I want to know/ }).click();
  await page.goto('./#/');
  await expect(page.getByTestId('continue')).toContainText('Continue where you left off');
  await expect(page.locator('.stat').filter({ hasText: 'day streak' }).locator('b')).toHaveText('1');
});

test('A finished topic stays open: it reopens at step 1 and every step is reachable', async ({ page }) => {
  await fresh(page);
  const ids = topic.steps.map((s) => s.id);
  await page.evaluate((stepIds) => {
    localStorage.setItem('mathlab.progress.v1', JSON.stringify({
      version: 1,
      topics: { 'calc-derivative': { step: stepIds.length - 1, total: stepIds.length, completed: stepIds, answers: {}, code: {}, ownWords: 'done', done: true, doneAt: '2026-11-23' } },
      review: {}, solved: {}, activity: [], settings: {}, updatedAt: '',
    }));
  }, ids);
  await page.reload();
  await page.getByTestId('open-calc-derivative').click();
  await expect(page.getByTestId('step-label')).toContainText('step 1 of');
  await expect(page.getByTestId('done-banner')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/24-finished-topic.png` });
  await page.getByTestId('step-jump').selectOption('learn-2');
  await expect(page.getByTestId('step-label')).toContainText(`step ${ids.indexOf('learn-2') + 1} of`);
  await expect(page.getByTestId('step-learn')).toBeVisible();
});
