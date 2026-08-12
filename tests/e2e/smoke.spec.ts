/**
 * Optional Playwright smoke test (T034). Not run by `npm test` (Vitest).
 * To run: `npm i -D @playwright/test && npx playwright install chromium`,
 * start the app (`npm run dev`), then `npx playwright test`.
 */
import { test, expect } from '@playwright/test';

test('loads, shows an animal, and navigates', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  // Learn mode is default: a picture and its sentence render.
  await expect(page.getByTestId('learn-phrase')).toBeVisible();
  const firstPhrase = await page.getByTestId('learn-phrase').textContent();

  await page.getByRole('button', { name: 'Next animal' }).click();
  await expect(page.getByTestId('learn-phrase')).not.toHaveText(firstPhrase ?? '');
});
