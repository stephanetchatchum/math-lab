import { test, expect, type Page } from '@playwright/test';
import { installSpeechMock, type SpeechQuirks } from '../mocks/speechMock';
import { SHOTS } from './helpers';

async function setup(page: Page, quirks: SpeechQuirks) {
  await page.addInitScript(installSpeechMock, { msPerWord: 12, ...quirks });
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./#/topic/calc-derivative/learn-1');
  await expect(page.getByTestId('reader-status')).toContainText('Ready');
}
const spoken = (page: Page) => page.evaluate(() => ((globalThis as unknown as { __spoken: string[] }).__spoken || []).filter((s) => s.trim()));
const lineNo = async (page: Page) => Number(/Line (\d+)/.exec((await page.getByTestId('reader-status').innerText()) ?? '')?.[1] ?? 0);

test('normal browser: reads line by line, highlights the line and the word, auto-advances', async ({ page }) => {
  await setup(page, {});
  await page.getByTestId('listen').click();
  await expect(page.getByTestId('reader-status')).toContainText(/Line \d+ of \d+/);
  await expect(page.locator('[data-line].reading')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.has('ml-word') ?? false)).toBe(true);
  await expect.poll(() => lineNo(page), { timeout: 40_000 }).toBeGreaterThan(9);
  await page.screenshot({ path: `${SHOTS}/40-reading.png` });
  const said = await spoken(page);
  // equations are spoken from their `say` field, never raw LaTeX
  expect(said.some((s) => s.includes('all over h'))).toBe(true);
  expect(said.every((s) => !/\\frac|\\lim|\{/.test(s))).toBe(true);
});

test('keyboard: Space plays and pauses, arrows move, Esc stops', async ({ page }) => {
  await setup(page, { msPerWord: 80 });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press(' ');
  await expect(page.getByTestId('reader-status')).toContainText('Line 1 of');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('reader-status')).toContainText('Line 2 of');
  await page.keyboard.press(' ');
  await expect(page.getByTestId('listen')).toContainText('Resume');
  await page.keyboard.press(' ');
  await expect(page.getByTestId('listen')).toContainText('Pause');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('reader-status')).toContainText('Ready');
});

test('double-click a paragraph to start reading there', async ({ page }) => {
  await setup(page, { msPerWord: 80 });
  const p = page.locator('section#picture p.blk').first();
  const idx = Number(await p.getAttribute('data-line'));
  await p.dblclick();
  await expect(page.getByTestId('reader-status')).toContainText(`Line ${idx + 1} of`);
  await expect(p).toHaveClass(/reading/);
});

for (const [name, q] of [
  ['Chrome: onend never fires', { noOnEnd: true }],
  ['speaking flag stuck', { stuckSpeaking: true }],
  ['Safari: needs a user gesture', { needGesture: true }],
  ['no voices at first', { noVoicesAtFirst: true }],
  ['no word-boundary events', { noBoundary: true, msPerWord: 60 }],
] as [string, SpeechQuirks][]) {
  test(`quirk — ${name}: keeps reading`, async ({ page }) => {
    await setup(page, q);
    await page.getByTestId('listen').click();
    await expect.poll(() => lineNo(page), { timeout: 40_000 }).toBeGreaterThanOrEqual(3);
    expect((await spoken(page)).length).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('quirk — broken engine: shows a clear message', async ({ page }) => {
  await setup(page, { neverStart: true });
  await page.getByTestId('listen').click();
  await expect(page.getByRole('alert')).toContainText('Speech isn’t working', { timeout: 20_000 });
  await page.screenshot({ path: `${SHOTS}/41-speech-error.png` });
});

test('pauses when the tab is hidden and stops on navigation', async ({ page }) => {
  await setup(page, { msPerWord: 80 });
  await page.getByTestId('listen').click();
  await expect(page.getByTestId('listen')).toContainText('Pause');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('listen')).toContainText('Resume');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
  await page.getByTestId('listen').click();
  await expect(page.getByTestId('listen')).toContainText('Pause');
  await page.getByTestId('step-next').click();
  await expect(page.getByTestId('listen')).toContainText('Listen');
});

test('narrated animation: every caption is spoken, in order, and frames wait for speech', async ({ page }) => {
  await setup(page, { msPerWord: 15 });
  await page.getByRole('button', { name: /Narrate/ }).click();
  await page.goto('./#/topic/calc-derivative/watch');
  await page.getByTestId('anim-play').first().click();
  await expect(page.getByTestId('anim-caption')).toContainText('h = 0.01', { timeout: 60_000 });
  const caps = async () => (await spoken(page)).filter((s) => /h = /.test(s));
  await expect.poll(async () => (await caps()).length).toBeGreaterThanOrEqual(9);
  const c = await caps();
  expect(c[0]).toContain('h = 1.5');
  expect(c.at(-1)).toContain('h = 0.01');
});
