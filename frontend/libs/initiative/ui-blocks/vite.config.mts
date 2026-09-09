/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

/** Vitest Browser-Modus, siehe frontend/libs/shared/ui-elements/vite.config.mts */
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/frontend/libs/initiative/ui-blocks',
  plugins: [angular({ tsconfig: 'tsconfig.browser-spec.json' }), nxViteTsPaths()],
  test: {
    name: 'initiative-ui-blocks-browser',
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
