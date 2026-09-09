import { expect, test } from '@playwright/test';

/**
 * E2E: Übersicht. Läuft gegen das echte Mock-Backend, deshalb werden nur
 * stabile Testdaten geprüft (feste Namen, 32 Einträge, 20 pro Seite).
 */
test.describe('Übersicht', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/initiativen');
  });

  test('zeigt Navigation und Tabelle mit 20 Zeilen', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
    await expect(page.locator('.sub-nav a.active')).toHaveText('Übersicht');
    await expect(page.locator('tbody tr')).toHaveCount(20);
    await expect(page.getByText(/1-20 von \d+/)).toBeVisible();
  });

  test('filtert über das Suchfeld', async ({ page }) => {
    await page.getByRole('searchbox').fill('Mobilität');
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('tbody')).toContainText('Angebotsportfolio Mobilität und Logistik');
  });

  test('sortiert beim Klick auf den Spaltenkopf', async ({ page }) => {
    const firstCell = page.locator('tbody tr').first().locator('td').first();
    await expect(firstCell).toHaveText('Angebotsportfolio Energie');

    // Zweiter Klick auf "Initiative" dreht die Richtung um.
    // Erste Spalte "Initiative" (Name-Regex würde auch "Initiativen-Manager*in" treffen).
    await page.locator('th button').first().click();
    await expect(firstCell).toHaveText('Wasserstoff-Busse');
  });

  test('blättert zur zweiten Seite', async ({ page }) => {
    await page.getByRole('button', { name: 'Nächste Seite' }).click();
    await expect(page.getByText(/21-\d+ von \d+/)).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('Filter nach Freigabe zeigt nur Entwürfe', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/ }).click();
    await page.getByLabel('Freigabe').selectOption('Entwurf');
    // Keine feste Anzahl: der Speichern-Test legt weitere Entwürfe an, und das
    // Mock-Backend behält sie, solange es läuft. Stattdessen: jede Zeile ist ein Entwurf.
    await expect(page.locator('tbody')).toContainText('Projekt Z');
    await expect(page.locator('tbody')).toContainText('Richard Wagner');
    const rows = page.locator('tbody tr');
    const badges = page.locator('tbody tr .badge.info', { hasText: 'Entwurf' });
    await expect(badges).toHaveCount(await rows.count());
    await expect(page.locator('tbody')).not.toContainText('Veröffentlicht');
  });

  test('Archiv nutzt dieselbe Ansicht ohne Einträge', async ({ page }) => {
    await page.getByRole('link', { name: 'Archiv' }).click();
    await expect(page.getByRole('heading', { name: 'Archiv' })).toBeVisible();
    await expect(page.getByText('Keine Initiativen gefunden.')).toBeVisible();
  });
});
