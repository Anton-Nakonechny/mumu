/**
 * Optional Playwright privacy check (T033, SC-008): assert no outbound request carries
 * recorded audio or a transcript while the child answers in Quiz mode — recognition is
 * on-device WASM. Not run by `npm test`.
 *
 * To run: install Playwright (see smoke.spec.ts), start the app, then `npx playwright test`.
 */
import { test, expect } from '@playwright/test';
import { UI_STRINGS } from '../../src/domain/language';

const AUDIO_HINTS = [/speech/i, /recognize/i, /transcri/i, /audio/i, /\.wav|\.ogg|\.webm/i];

// The quiz button label depends on the selected language (default may be non-English).
const QUIZ_LABELS = new RegExp(Object.values(UI_STRINGS).map((s) => s.quiz).join('|'));

test('no audio/transcript leaves the device during Quiz mode', async ({ page }) => {
  const suspicious: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (new URL(url).origin === new URL(page.url() || 'https://localhost:5173').origin) return;
    if (AUDIO_HINTS.some((re) => re.test(url))) suspicious.push(url);
    // Any POST leaving the origin during recognition is itself worth flagging.
    if (req.method() === 'POST') suspicious.push(`POST ${url}`);
  });

  await page.goto('/');
  await page.getByRole('button', { name: QUIZ_LABELS }).click();
  // Give the recognizer time to run (grant mic via test fixtures in a real run).
  await page.waitForTimeout(3000);

  expect(suspicious, `Unexpected outbound requests: ${suspicious.join(', ')}`).toHaveLength(0);
});
