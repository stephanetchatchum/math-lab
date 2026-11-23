import type { Page } from '@playwright/test';

export const SHOTS = 'screenshots';

/** Replace the CodeMirror document, like a paste. Uses the test hook set in CodeEditor. */
export async function setCode(page: Page, code: string, scope = 'body') {
  await page.locator(`${scope} [data-testid="editor"]`).first().evaluate((el, c) => {
    (el as unknown as { __setCode: (s: string) => void }).__setCode(c);
  }, code);
}

/** Collect console errors and page errors during a test. */
export function watchErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(`console: ${m.text()}`);
  });
  return errs;
}

export async function fresh(page: Page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
}
