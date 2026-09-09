import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

/**
 * E2E-Tests der Initiativen-App.
 * Playwright startet beide Server selbst (Mock-Backend + Angular-App), so
 * dass `pnpm nx e2e initiatives-e2e` ohne manuelle Vorbereitung läuft.
 * `reuseExistingServer`: läuft lokal schon ein Server, wird er benutzt.
 */
const baseURL = process.env['BASE_URL'] || 'http://localhost:4300';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm nx serve mock-backend',
      url: 'http://localhost:5100/api',
      reuseExistingServer: !process.env['CI'],
      cwd: '../../..',
      timeout: 120_000,
    },
    {
      command: 'pnpm nx serve initiatives --port=4300',
      url: baseURL,
      reuseExistingServer: !process.env['CI'],
      cwd: '../../..',
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
