/**
 * STUFE 3: Komponententest im echten Browser (Vitest Browser Mode + Playwright).
 *
 * Neu gegenüber jsdom:
 *  - `page.getByRole/getByLabelText/...` sind Locators: sie beschreiben ein
 *    Element so, wie ein Nutzer es sieht (Rolle, Label, Text), nicht über CSS-Klassen.
 *  - `userEvent.fill/click/keyboard` erzeugen echte Browser-Events inklusive
 *    Fokus, Tastatur und Formular-Verhalten.
 *  - `expect.element(locator).toBeVisible()` ist eine wartende Assertion:
 *    sie pollt, bis der Zustand eintritt (Retry), statt sofort zu scheitern.
 *    Deshalb braucht es kein `await fixture.whenStable()` nach Interaktionen.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TestBed } from '@angular/core/testing';
import { NewTask, TaskForm } from './task-form';

describe('TaskForm (Browser)', () => {
  let created: ReturnType<typeof vi.fn<(t: NewTask) => void>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskForm] }).compileComponents();
    const fixture = TestBed.createComponent(TaskForm);
    created = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    await fixture.whenStable();
  });

  it('Button ist deaktiviert, solange der Titel leer ist', async () => {
    await expect.element(page.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  });

  it('zeigt eine Fehlermeldung, wenn das Feld nach dem Verlassen leer ist', async () => {
    const title = page.getByPlaceholder('Was ist zu tun?');
    await userEvent.click(title);
    await userEvent.keyboard('{Tab}'); // Feld verlassen -> touched

    await expect.element(page.getByRole('alert')).toHaveTextContent('Titel ist Pflicht');
  });

  it('zu kurzer Titel zeigt die minLength-Meldung', async () => {
    await userEvent.fill(page.getByPlaceholder('Was ist zu tun?'), 'ab');
    await userEvent.keyboard('{Tab}');

    await expect.element(page.getByRole('alert')).toHaveTextContent('Mindestens 3 Zeichen');
    await expect.element(page.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  });

  it('gültige Eingabe wird als Output gemeldet und das Formular geleert', async () => {
    await userEvent.fill(page.getByPlaceholder('Was ist zu tun?'), 'Browser-Test schreiben');
    await userEvent.selectOptions(page.getByLabelText('Priorität'), 'hoch');
    await userEvent.fill(page.getByLabelText('Termin'), '2026-10-01');
    await userEvent.click(page.getByRole('button', { name: 'Hinzufügen' }));

    expect(created).toHaveBeenCalledExactlyOnceWith({
      title: 'Browser-Test schreiben',
      priority: 'hoch',
      dueDate: '2026-10-01',
    });
    await expect.element(page.getByPlaceholder('Was ist zu tun?')).toHaveValue('');
    await expect.element(page.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  });

  it('Enter im Titelfeld sendet das Formular ab', async () => {
    await userEvent.fill(page.getByPlaceholder('Was ist zu tun?'), 'Per Enter');
    await userEvent.keyboard('{Enter}');

    expect(created).toHaveBeenCalledTimes(1);
    expect(created.mock.calls[0][0].title).toBe('Per Enter');
  });
});
