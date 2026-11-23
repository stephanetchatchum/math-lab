import { test, expect } from '@playwright/test';
import topic from '../../src/content/topics/calculus/calc-derivative';
import { SHOTS, fresh, watchErrors } from './helpers';

test('dashboard, map and every step of the sample topic render', async ({ page }) => {
  const errs = watchErrors(page);
  await fresh(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: /See it/ })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-dashboard.png` });

  await page.goto('./#/map');
  await expect(page.getByRole('heading', { name: 'Prerequisite map' })).toBeVisible();
  await page.locator('g.mnode').filter({ hasText: 'The derivative' }).first().hover();
  await page.screenshot({ path: `${SHOTS}/02-map.png` });

  await page.goto('./#/topic/calc-derivative');
  for (let i = 0; i < topic.steps.length; i++) {
    const s = topic.steps[i];
    await expect(page.getByTestId('step-label')).toContainText(`step ${i + 1} of ${topic.steps.length}`);
    await expect(page.getByTestId(`step-${s.kind}`)).toBeVisible();
    if (s.kind === 'hook') {
      await page.getByTestId('sim-play').click();
      await page.waitForTimeout(1300);
      await page.getByTestId('sim-play').click();
    }
    if (s.kind === 'watch') await page.getByTestId('anim-step').first().click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${SHOTS}/10-step-${String(i + 1).padStart(2, '0')}-${s.id}.png`, fullPage: s.kind === 'learn' && i < 2 });
    await page.getByTestId('step-next').click();
  }
  await expect(page.getByRole('heading', { name: /See it/ })).toBeVisible();
  expect(errs).toEqual([]);
});
