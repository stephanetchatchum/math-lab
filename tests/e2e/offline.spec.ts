import { test, expect } from '@playwright/test';
import topic from '../../src/content/topics/calculus/calc-derivative';
import { SHOTS, setCode } from './helpers';

test('after one online visit + "Download everything", the whole app works with the network cut', async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await page.goto('./#/settings');
  await page.getByTestId('download-all').click();
  await expect(page.getByTestId('offline-status')).toContainText('Offline ready ✓', { timeout: 240_000 });
  await page.screenshot({ path: `${SHOTS}/50-offline-ready.png` });

  // cut the network
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('offline-pill')).toBeVisible();
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: /See it/ })).toBeVisible();

  // lessons + KaTeX + fonts
  await page.goto('./#/topic/calc-derivative/learn-1');
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "Atkinson Hyperlegible"') && document.fonts.check('20px "Caveat Brush"'); })).toBe(true);
  // animations and sandbox
  await page.goto('./#/topic/calc-derivative/play');
  await expect(page.getByTestId('meter')).toBeVisible();

  // Python with numpy, offline
  const c = topic.steps.find((s) => s.kind === 'compute')!;
  await page.goto(`./#/topic/calc-derivative/${c.id}`);
  if (c.kind === 'compute') {
    await setCode(page, c.problem.solution + '\nimport scipy, sympy, matplotlib.pyplot as plt\nplt.plot([0, 1], [0, 1])\n');
    await page.getByTestId('run-tests').click();
    await expect(page.getByTestId('test-summary')).toContainText('3 of 3 tests passed', { timeout: 120_000 });
    await expect(page.locator('img.plot-img')).toBeVisible();
  }
  await page.screenshot({ path: `${SHOTS}/51-offline-python.png` });
  // symbolic answer check falls back to sympy offline too
  await page.goto('./#/topic/calc-derivative/your-turn');
  await page.getByTestId('answer-yt-cube').getByTestId('answer-input').fill('3x^2');
  await page.getByTestId('answer-yt-cube').getByTestId('answer-check').click();
  await expect(page.getByTestId('answer-yt-cube').getByTestId('verdict')).toContainText('Correct');
});
