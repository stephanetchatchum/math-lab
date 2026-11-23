// Review helper (not part of CI): screenshot every animation frame of a topic.
// TOPIC=f-algebra npx playwright test -c tests/review/pw.config.ts
import { test } from '@playwright/test';
const id = process.env.TOPIC!;
test(`frames of ${id}`, async ({ page }) => {
  await page.goto(`./#/topic/${id}/watch`);
  await page.getByTestId('step-watch').waitFor();
  const tabs = page.locator('.tabs [role=tab]');
  const nTabs = Math.max(1, await tabs.count());
  for (let t = 0; t < nTabs; t++) {
    if (await tabs.count()) {
      await tabs.nth(t).click();
      await page.waitForTimeout(200);
    }
    let k = 0;
    for (;;) {
      await page.locator('.player svg.scene').first().screenshot({ path: `screenshots/frames/${id}-${t}-${k}.png` });
      const next = page.getByTestId('anim-step').first();
      if (await next.isDisabled()) break;
      await next.click();
      k++;
    }
  }
});
