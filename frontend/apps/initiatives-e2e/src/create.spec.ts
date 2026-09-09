import { expect, test } from '@playwright/test';

test.describe('Initiative erstellen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/initiativen/erstellen');
  });

  test('zeigt fünf Abschnitte mit Zählern', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Name der Initiative' })).toBeVisible();
    for (const [title, counter] of [
      ['Stammdaten', '0/10'],
      ['Status der Initiative', '0/5'],
      ['Budget', '0/4'],
      ['Gruppenstrategie', '0/3'],
      ['Weitere / Diverse', '0/3'],
    ]) {
      const header = page.getByRole('button', { name: new RegExp(`^${title}`) });
      await expect(header).toContainText(counter);
    }
  });

  test('Zähler und Titel folgen der Eingabe', async ({ page }) => {
    await page.getByRole('button', { name: /^Stammdaten/ }).click();
    await page.getByRole('textbox', { name: 'Name der Initiative' }).fill('E2E Initiative');
    await page.getByRole('textbox', { name: 'Kurztitel' }).fill('25_WSTW_999');

    await expect(page.getByRole('heading', { name: 'E2E Initiative' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Stammdaten/ })).toContainText('2/10');
  });

  test('nur ein Abschnitt ist gleichzeitig offen', async ({ page }) => {
    await page.getByRole('button', { name: /^Stammdaten/ }).click();
    await expect(page.getByRole('textbox', { name: 'Name der Initiative' })).toBeVisible();

    await page.getByRole('button', { name: /^Budget/ }).click();
    await expect(page.getByRole('textbox', { name: 'Name der Initiative' })).toBeHidden();
    await expect(page.getByRole('spinbutton', { name: 'Gesamtbudget (EUR)' })).toBeVisible();
  });

  test('ohne Namen bleibt man auf der Seite und sieht den Fehler', async ({ page }) => {
    await page.getByRole('button', { name: 'Zur Zusammenfassung' }).click();
    await expect(page).toHaveURL(/\/initiativen\/erstellen$/);
    await expect(page.getByText('Name ist ein Pflichtfeld')).toBeVisible();
  });

  test('Zusammenfassung und Speichern legen die Initiative an und öffnen die Detailseite', async ({ page }) => {
    const name = `E2E ${Date.now()}`;
    await page.getByRole('button', { name: /^Stammdaten/ }).click();
    await page.getByRole('textbox', { name: 'Name der Initiative' }).fill(name);
    await page.getByRole('button', { name: 'Zur Zusammenfassung' }).click();

    await expect(page.getByRole('heading', { name: 'Zusammenfassung' })).toBeVisible();
    await expect(page.locator('dd')).toContainText([name]);

    await page.getByRole('button', { name: 'Initiative anlegen' }).click();
    await expect(page).toHaveURL(/\/initiativen\/\d+$/);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.locator('.meta')).toContainText('Entwurf');

    await page.getByRole('link', { name: 'Übersicht' }).click();
    await page.getByRole('searchbox').fill(name);
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('Abbrechen führt zur Übersicht', async ({ page }) => {
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
  });
});
