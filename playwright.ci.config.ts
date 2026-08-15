import { defineConfig } from '@playwright/test';

// CI variant: no mkcert certs, plain HTTP.
// Uses `vite preview` (serves the pre-built dist/) instead of the dev server so that
// Vite's allowedHosts restriction on the dev server doesn't block the health check.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npx vite preview --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
