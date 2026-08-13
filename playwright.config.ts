import { defineConfig } from '@playwright/test';

/** E2E config (T033/T034). Runs the specs in tests/e2e against the Vite dev server. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'https://localhost:5173', ignoreHTTPSErrors: true },
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:5173',
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
