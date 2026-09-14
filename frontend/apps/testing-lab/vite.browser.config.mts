/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

/**
 * Vitest im Browser-Modus: die *.browser.spec.ts laufen in einem echten
 * Chromium, das Playwright startet. Vorteile gegenüber jsdom:
 * - echtes Rendering (CSS, Layout, Fokus, Scrollen)
 * - echte Eingaben über `userEvent` (tippen, klicken, Tab)
 * - Locator-API `page.getByRole(...)` und `expect.element(...)`, die
 *   automatisch wartet, bis der Zustand eingetreten ist (kein manuelles
 *   `await fixture.whenStable()` mehr nötig)
 * Nachteil: langsamer als jsdom. Deshalb nur für Interaktionen nutzen.
 */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/frontend/apps/testing-lab-browser',
  plugins: [angular({ tsconfig: 'tsconfig.browser-spec.json' }), nxViteTsPaths()],
  test: {
    name: 'testing-lab-browser',
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
