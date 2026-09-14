/**
 * BARRIEREFREIHEIT eines Formulars: Labels und Fehlermeldungen
 *
 * Sehende Nutzer sehen die rote Meldung unter dem Feld. Ein Screenreader-
 * Nutzer im Feld erfährt davon nur, wenn das Feld
 *   - als ungültig markiert ist:           aria-invalid="true"
 *   - mit der Meldung verknüpft ist:        aria-describedby="<id der Meldung>"
 * Dann liest der Screenreader beim Fokus "Titel, ungültig, Titel ist Pflicht".
 *
 * Matcher dafür:
 *   toHaveAccessibleName('…')         Name des Feldes (aus dem <label>)
 *   toHaveAccessibleDescription('…')  Beschreibung (aus aria-describedby)
 *   toHaveAttribute('aria-invalid')   Ungültig-Markierung
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TestBed } from '@angular/core/testing';
import { TaskForm } from './task-form';

describe('TaskForm: Barrierefreiheit', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskForm] }).compileComponents();
    await TestBed.createComponent(TaskForm).whenStable();
  });

  const titleField = () => page.getByRole('textbox', { name: 'Titel' });

  it('jedes Feld hat einen Namen aus seinem Label', async () => {
    await expect.element(titleField()).toHaveAccessibleName('Titel');
    await expect.element(page.getByRole('combobox')).toHaveAccessibleName('Priorität');
    await expect.element(page.getByLabelText('Termin')).toHaveAccessibleName('Termin');
  });

  it('ein unberührtes Feld ist nicht als ungültig markiert', async () => {
    // Fehler erst nach dem Verlassen zeigen, sonst meckert der Screenreader,
    // bevor der Nutzer überhaupt etwas eingeben konnte.
    await expect.element(titleField()).not.toHaveAttribute('aria-invalid', 'true');
    await expect.element(titleField()).toHaveAccessibleDescription('');
  });

  it('nach dem Verlassen: aria-invalid und die Meldung als Beschreibung', async () => {
    await userEvent.click(titleField());
    await userEvent.keyboard('{Tab}');

    await expect.element(titleField()).toHaveAttribute('aria-invalid', 'true');
    await expect.element(titleField()).toHaveAccessibleDescription('Titel ist Pflicht');
  });

  it('die Beschreibung wechselt mit der Fehlerart und verschwindet bei gültiger Eingabe', async () => {
    await userEvent.fill(titleField(), 'ab');
    await userEvent.keyboard('{Tab}');
    await expect.element(titleField()).toHaveAccessibleDescription('Mindestens 3 Zeichen');

    await userEvent.fill(titleField(), 'Gültiger Titel');
    await expect.element(titleField()).not.toHaveAttribute('aria-invalid', 'true');
    await expect.element(titleField()).toHaveAccessibleDescription('');
  });

  it('der gesperrte Absenden-Button ist per Tab nicht erreichbar, das Formular aber schon', async () => {
    await userEvent.click(titleField());
    await userEvent.keyboard('{Tab}{Tab}'); // Priorität, Termin
    await expect.element(page.getByLabelText('Termin')).toHaveFocus();

    // Deaktivierte Buttons fallen aus der Tab-Reihenfolge. Das ist ok, solange
    // die Meldung erklärt, warum. Hier prüfen wir, dass der Button deaktiviert ist.
    await expect.element(page.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  });
});
