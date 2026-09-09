/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

/**
 * Vitest im Browser-Modus: die Komponenten-Tests laufen in einem echten
 * Chromium (über Playwright), nicht in jsdom. Damit werden Layout, CSS und
 * echte Events geprüft. Nur Dateien mit `.browser.spec.ts` gehören hierher,
 * die schnellen Unit-Tests bleiben bei Jest.
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/frontend/libs/shared/ui-elements',
  plugins: [angular({ tsconfig: 'tsconfig.browser-spec.json' }), nxViteTsPaths()],
  test: {
    name: 'shared-ui-elements-browser',
    watch: false,
    include: ['src/**/*.browser.spec.ts'],
    setupFiles: ['src/test-setup.browser.ts'],
    reporters: ['default'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
}));
