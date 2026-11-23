import { test, expect, type Page } from '@playwright/test';
import type { CodeProblem, Topic } from '../../src/content/types';
import { SHOTS, setCode, watchErrors } from './helpers';
import { allTopics } from './topics';

const topics: Topic[] = await allTopics();

async function passReference(page: Page, p: CodeProblem) {
  const box = page.getByTestId(`runner-${p.id}`);
  await setCode(page, p.solution, `[data-testid="runner-${p.id}"]`);
  await box.getByTestId('run-tests').click();
  const n = p.tests.match(/^def test_/gm)!.length;
  await expect(box.getByTestId('test-summary')).toContainText(`${n} of ${n} tests passed`, { timeout: 90_000 });
}

for (const t of topics) {
  test.describe(t.id, () => {
    test(`${t.id}: every step renders without errors`, async ({ page }) => {
      const errs = watchErrors(page);
      await page.goto('./');
      await page.evaluate(() => localStorage.clear());
      for (const [i, s] of t.steps.entries()) {
        await page.goto(`./#/topic/${t.id}/${s.id}`);
        await expect(page.getByTestId(`step-${s.kind}`)).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${SHOTS}/topics/${t.id}-${String(i + 1).padStart(2, '0')}-${s.id}.png` });
      }
      expect(errs).toEqual([]);
    });

    test(`${t.id}: reference solutions pass in the browser`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.goto('./');
      for (const s of t.steps) {
        if (s.kind === 'compute') {
          await page.goto(`./#/topic/${t.id}/${s.id}`);
          await passReference(page, s.problem);
        } else if (s.kind === 'problems') {
          await page.goto(`./#/topic/${t.id}/${s.id}`);
          for (const [i, p] of s.problems.entries()) {
            await page.locator('.tabs [role=tab]').nth(i).click();
            await passReference(page, p);
          }
        } else if (s.kind === 'fillGap') {
          await page.goto(`./#/topic/${t.id}/${s.id}`);
          for (const b of s.blanks) await page.getByTestId(`gap-${b.id}`).fill(b.answers[0]);
          await page.getByTestId('gap-check').click();
          await expect(page.getByText('All gaps filled correctly.')).toBeVisible({ timeout: 90_000 });
        }
      }
    });
  });
}
