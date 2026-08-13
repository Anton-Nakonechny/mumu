/**
 * Optional Playwright smoke test (T034). Not run by `npm test` (Vitest).
 * To run: `npm i -D @playwright/test && npx playwright install chromium`,
 * start the app (`npm run dev`), then `npx playwright test`.
 */
import { test, expect } from '@playwright/test';

test('loads, shows an animal, and navigates', async ({ page }) => {
  await page.goto('/');
  // Learn mode is default: a picture and its sentence render.
  await expect(page.getByTestId('learn-phrase')).toBeVisible();
  const firstPhrase = await page.getByTestId('learn-phrase').textContent();

  await page.getByRole('button', { name: 'Next animal' }).click();
  await expect(page.getByTestId('learn-phrase')).not.toHaveText(firstPhrase ?? '');
});

test('desktop layout unchanged', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const prevBtn = page.getByRole('button', { name: 'Previous animal' });
  const nextBtn = page.getByRole('button', { name: 'Next animal' });
  const img = page.locator('img.animal-image');

  const prevBox = await prevBtn.boundingBox();
  const nextBox = await nextBtn.boundingBox();
  const imgBox = await img.boundingBox();

  if (!prevBox || !nextBox || !imgBox) throw new Error('Layout elements not found');

  // On desktop, prev is left of image and next is right of image (horizontal layout).
  expect(prevBox.x + prevBox.width).toBeLessThan(imgBox.x);
  expect(nextBox.x).toBeGreaterThan(imgBox.x + imgBox.width);
});

test('mobile proportional layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // SC-002: animal image width ≥ 55% of viewport (≥ 206px at 375px wide)
  const img = page.locator('img.animal-image');
  const imgBox = await img.boundingBox();
  if (!imgBox) throw new Error('animal-image not found');
  expect(imgBox.width).toBeGreaterThanOrEqual(206);

  // SC-003: nav buttons ≥ 64×64px touch targets
  const prevBtn = page.getByRole('button', { name: 'Previous animal' });
  const nextBtn = page.getByRole('button', { name: 'Next animal' });
  const prevBox = await prevBtn.boundingBox();
  const nextBox = await nextBtn.boundingBox();
  if (!prevBox || !nextBox) throw new Error('nav buttons not found');
  expect(prevBox.width).toBeGreaterThanOrEqual(64);
  expect(prevBox.height).toBeGreaterThanOrEqual(64);
  expect(nextBox.width).toBeGreaterThanOrEqual(64);
  expect(nextBox.height).toBeGreaterThanOrEqual(64);
});

test('mobile nav buttons visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const prevBtn = page.getByRole('button', { name: 'Previous animal' });
  const nextBtn = page.getByRole('button', { name: 'Next animal' });

  await expect(prevBtn).toBeInViewport();
  await expect(nextBtn).toBeInViewport();

  // Navigation still works on mobile.
  await expect(page.getByTestId('learn-phrase')).toBeVisible();
  const firstPhrase = await page.getByTestId('learn-phrase').textContent();
  await nextBtn.click();
  await expect(page.getByTestId('learn-phrase')).not.toHaveText(firstPhrase ?? '');
});
