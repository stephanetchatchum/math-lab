import { test, expect } from '@playwright/test';
import { SHOTS, watchErrors } from './helpers';

test('phone layout: dashboard, lesson, sandbox, problems', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('continue')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/60-mobile-dashboard.png` });
  for (const id of ['learn-1', 'play', 'your-turn', 'compute']) {
    await page.goto(`./#/topic/calc-derivative/${id}`);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${id}`).toBeLessThanOrEqual(2);
    await page.screenshot({ path: `${SHOTS}/61-mobile-${id}.png` });
  }
  expect(errs).toEqual([]);
});
