/**
 * BARRIEREFREIHEIT (a11y) einer Listenzeile: Tastatur und Accessible Names
 *
 * Zwei Fragen, die jeder a11y-Test beantworten sollte:
 *
 *  1. Ist alles per Tastatur erreichbar und bedienbar?
 *     Nutzer ohne Maus springen mit Tab von Element zu Element und bedienen
 *     mit Leertaste/Enter. Wir tabben wirklich durch und prüfen mit
 *     `toHaveFocus()`, wo der Fokus landet.
 *
 *  2. Hat jedes Bedienelement den RICHTIGEN Namen?
 *     Der "Accessible Name" ist das, was ein Screenreader vorliest. Er wird vom
 *     Browser berechnet: aus aria-label, aria-labelledby, <label> oder dem Text.
 *     `toHaveAccessibleName('…')` prüft den EXAKTEN Namen. Das ist strenger als
 *     `getByRole('button', { name: 'Löschen' })`, das auch Teiltreffer findet.
 *
 * Warum wichtig? Der Löschen-Button zeigt nur "✕". Ohne aria-label würde ein
 * Screenreader "Mal" oder gar nichts vorlesen, und bei zehn Zeilen gäbe es
 * zehn gleich benannte Buttons, ohne zu wissen, welcher was löscht.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Clock } from '../data-access/clock';
import { Task } from '../data-access/task';
import { TaskItem } from './task-item';

@Component({
  imports: [TaskItem],
  template: `
    <button type="button">Vorher</button>
    <ul>
      @for (task of tasks(); track task.id) {
        <lab-task-item [task]="task" (toggled)="toggle($event)" />
      }
    </ul>
  `,
})
class Host {
  readonly tasks = signal<Task[]>([
    { id: 'a', title: 'Steuererklärung', priority: 'hoch', done: false, dueDate: null },
    { id: 'b', title: 'Zahnarzt anrufen', priority: 'niedrig', done: false, dueDate: null },
  ]);

  toggle(id: string) {
    this.tasks.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
}

describe('TaskItem: Barrierefreiheit', () => {
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: Clock, useValue: { now: () => new Date('2026-09-14') } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Accessible Names', () => {
    it('die Checkbox heißt wie die Aufgabe (über das umschließende <label>)', async () => {
      const checkboxes = page.getByRole('checkbox');
      await expect.element(checkboxes.nth(0)).toHaveAccessibleName('Steuererklärung');
      await expect.element(checkboxes.nth(1)).toHaveAccessibleName('Zahnarzt anrufen');
    });

    it('der Löschen-Button nennt die Aufgabe, nicht nur "✕"', async () => {
      const deleteButtons = page.getByRole('button', { name: /^Löschen/ });

      await expect.element(deleteButtons.nth(0)).toHaveAccessibleName('Löschen: Steuererklärung');
      await expect.element(deleteButtons.nth(1)).toHaveAccessibleName('Löschen: Zahnarzt anrufen');
      // Gegenprobe: nach dem sichtbaren Zeichen darf man NICHT suchen können.
      await expect.element(page.getByRole('button', { name: '✕', exact: true })).not.toBeInTheDocument();
    });

    it('jeder Name ist eindeutig, auch bei mehreren Zeilen', () => {
      // Ein Screenreader listet alle Buttons einer Seite auf. Doppelte Namen sind
      // dort nicht unterscheidbar. elements() liefert die echten DOM-Knoten.
      const names = page
        .getByRole('button', { name: /^Löschen/ })
        .elements()
        .map((el) => el.getAttribute('aria-label'));

      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('Tastatur', () => {
    it('Tab-Reihenfolge: Checkbox, dann Löschen, dann nächste Zeile', async () => {
      await userEvent.click(page.getByRole('button', { name: 'Vorher' }));

      await userEvent.keyboard('{Tab}');
      await expect.element(page.getByRole('checkbox', { name: 'Steuererklärung' })).toHaveFocus();

      await userEvent.keyboard('{Tab}');
      await expect.element(page.getByRole('button', { name: 'Löschen: Steuererklärung' })).toHaveFocus();

      await userEvent.keyboard('{Tab}');
      await expect.element(page.getByRole('checkbox', { name: 'Zahnarzt anrufen' })).toHaveFocus();
    });

    it('Leertaste hakt die fokussierte Aufgabe ab, ohne Maus', async () => {
      await userEvent.click(page.getByRole('button', { name: 'Vorher' }));
      await userEvent.keyboard('{Tab}'); // auf die erste Checkbox
      await userEvent.keyboard(' ');

      await expect.element(page.getByRole('checkbox', { name: 'Steuererklärung' })).toBeChecked();
      expect(host.tasks()[0].done).toBe(true);
    });

    it('der Fokus ist sichtbar (Fokusring), nicht per CSS weggeblendet', async () => {
      await userEvent.click(page.getByRole('button', { name: 'Vorher' }));
      await userEvent.keyboard('{Tab}{Tab}'); // auf den Löschen-Button

      const button = page.getByRole('button', { name: 'Löschen: Steuererklärung' });
      await expect.element(button).toHaveFocus();
      // `outline: none` ohne Ersatz ist einer der häufigsten a11y-Fehler.
      const style = getComputedStyle(button.element());
      expect(style.outlineStyle).not.toBe('none');
    });
  });
});
