/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

/**
 * Vitest-Konfiguration für die schnellen Tests (Unit + Komponenten in jsdom).
 *
 * - `environment: 'jsdom'`: simuliert ein DOM in Node. Schnell, aber kein
 *   echtes Layout/CSS und keine echten Browser-Events.
 * - `globals: true`: describe/it/expect sind ohne Import verfügbar. Wir
 *   importieren sie trotzdem explizit, das ist lesbarer und typsicherer.
 * - `include`: alles außer *.browser.spec.ts, die laufen im Browser-Modus
 *   (siehe vite.browser.config.mts).
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/frontend/apps/testing-lab',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    name: 'testing-lab',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.browser.spec.ts', '**/node_modules/**'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/frontend/apps/testing-lab',
      provider: 'v8' as const,
    },
  },
}));
