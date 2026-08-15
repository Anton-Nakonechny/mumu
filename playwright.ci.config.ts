import { defineConfig } from '@playwright/test';

/** CI variant: no mkcert certs, plain HTTP. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
