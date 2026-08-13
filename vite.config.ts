/// <reference types="vitest/config" />
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The mic is a "secure context" API, so LAN devices need real https. These certs
// are minted by mkcert (`npm run cert`) and trusted per-device via mkcert's root CA,
// giving warning-free https over the local network. Absent certs → plain http (mic
// still works on localhost, which browsers already treat as secure).
const certExists = existsSync('certs/dev-cert.pem') && existsSync('certs/dev-key.pem');
const https = certExists
  ? { key: readFileSync('certs/dev-key.pem'), cert: readFileSync('certs/dev-cert.pem') }
  : undefined;

export default defineConfig({
  plugins: [react()],
  server: { host: true, https, allowedHosts: ['anakon.local'] },
  // Allow the on-device recognizer worker + WASM assets to be served as static files.
  worker: { format: 'es' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    css: false,
  },
});
