import { expect, Page, test } from '@playwright/test';

/** Legt über die UI eine frische Initiative an und landet auf ihrer Detailseite. */
async function createInitiative(page: Page, name: string) {
  await page.goto('/initiativen/erstellen');
  await page.getByRole('button', { name: /^Stammdaten/ }).click();
  await page.getByRole('textbox', { name: 'Name der Initiative' }).fill(name);
  await page.getByRole('textbox', { name: 'Kurztitel' }).fill('25_E2E_001');
  await page.getByRole('button', { name: 'Zur Zusammenfassung' }).click();
  await page.getByRole('button', { name: 'Initiative anlegen' }).click();
  await expect(page).toHaveURL(/\/initiativen\/\d+$/);
}

test.describe('Detailseite', () => {
  test('öffnet sich per Klick auf eine Zeile der Übersicht', async ({ page }) => {
    await page.goto('/initiativen');
    await page.getByRole('cell', { name: 'Mobilität', exact: true }).click();

    await expect(page).toHaveURL(/\/initiativen\/2$/);
    await expect(page.getByRole('heading', { name: 'Mobilität', exact: true })).toBeVisible();
    await expect(page.locator('.meta')).toContainText('Freigabe offen');
    await expect(page.locator('.meta')).toContainText('Erstellt von John Doe');

    const stammdaten = page.locator('.section').first();
    await expect(stammdaten.getByRole('heading', { name: 'Stammdaten' })).toBeVisible();
    await expect(stammdaten).toContainText('Eingabedatum');
    await expect(stammdaten).toContainText('Konzernunternehmen im Lead');
    await expect(stammdaten).toContainText('Kurztitel');
    await expect(stammdaten).toContainText('25_WSTW_002');
    await expect(stammdaten).toContainText('Interne Kooperation (optional)');
    await expect(stammdaten).toContainText('keine Angabe');
  });

  test('Absenden setzt einen Entwurf auf "Freigabe offen"', async ({ page }) => {
    await createInitiative(page, `Absenden ${Date.now()}`);
    await expect(page.locator('.meta')).toContainText('Entwurf');

    await page.getByRole('button', { name: 'Absenden' }).click();
    await expect(page.locator('.meta')).toContainText('Freigabe offen');
    await expect(page.getByRole('button', { name: 'Absenden' })).toBeDisabled();
  });

  test('Bearbeiten lädt die Daten ins Formular und speichert Änderungen', async ({ page }) => {
    const name = `Bearbeiten ${Date.now()}`;
    await createInitiative(page, name);

    await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    await expect(page).toHaveURL(/\/bearbeiten$/);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Stammdaten/ })).toContainText('2/10');

    await page.getByRole('button', { name: /^Stammdaten/ }).click();
    await page.getByRole('textbox', { name: 'Initiativen-Manager*in' }).fill('Stefan Tichacek');
    await page.getByRole('button', { name: 'Zur Zusammenfassung' }).click();
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();

    await expect(page).toHaveURL(/\/initiativen\/\d+$/);
    await expect(page.locator('.section').first()).toContainText('Stefan Tichacek');
  });

  test('Löschen entfernt die Initiative und führt zur Übersicht', async ({ page }) => {
    const name = `Löschen ${Date.now()}`;
    await createInitiative(page, name);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Löschen' }).click();

    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
    await page.getByRole('searchbox').fill(name);
    await expect(page.getByText('Keine Initiativen gefunden.')).toBeVisible();
  });
});
