/**
 * DIALOG / MODAL (nur Browser)
 *
 * Es gibt bewusst KEINEN jsdom-Test: jsdom implementiert `showModal()` nicht
 * (`typeof dialog.showModal === 'undefined'`). Top Layer, Fokus-Falle,
 * Escape-Taste und ::backdrop gibt es nur in einem echten Browser.
 *
 * Getestet wird aus Nutzersicht:
 *  - öffnen über einen Button im Host
 *  - role="dialog" mit Namen aus der Überschrift (aria-labelledby)
 *  - Fokus springt in den Dialog
 *  - Bestätigen / Abbrechen / Escape schließen und melden das Ergebnis
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [ConfirmDialog],
  template: `
    <button type="button" (click)="open.set(true)">Aufgabe löschen</button>
    <lab-confirm-dialog
      title="Wirklich löschen?"
      confirmLabel="Löschen"
      [(open)]="open"
      (confirmed)="result.set('bestätigt')"
      (cancelled)="result.set('abgebrochen')"
    >
      Die Aufgabe wird endgültig entfernt.
    </lab-confirm-dialog>
  `,
})
class Host {
  readonly open = signal(false);
  readonly result = signal('');
}

describe('ConfirmDialog (Browser)', () => {
  let host: Host;
  const dialog = () => page.getByRole('dialog', { name: 'Wirklich löschen?' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('ist anfangs geschlossen', async () => {
    // Ein geschlossenes <dialog> ist nicht sichtbar und nicht in der Rollen-Suche.
    await expect.element(dialog()).not.toBeInTheDocument();
  });

  it('öffnet sich als Modal mit Text und Fokus im Dialog', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Aufgabe löschen' }));

    await expect.element(dialog()).toBeVisible();
    await expect.element(dialog()).toHaveTextContent('Die Aufgabe wird endgültig entfernt.');
    // showModal() setzt den Fokus auf das erste fokussierbare Element.
    await expect.element(page.getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
    expect(dialog().element().matches(':modal')).toBe(true);
  });

  it('Bestätigen meldet confirmed und schließt', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Aufgabe löschen' }));
    await userEvent.click(page.getByRole('button', { name: 'Löschen', exact: true }));

    await expect.element(dialog()).not.toBeInTheDocument();
    expect(host.result()).toBe('bestätigt');
    expect(host.open()).toBe(false); // Two-Way-Binding zurück in den Host
  });

  it('Abbrechen meldet cancelled', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Aufgabe löschen' }));
    await userEvent.click(page.getByRole('button', { name: 'Abbrechen' }));

    await expect.element(dialog()).not.toBeInTheDocument();
    expect(host.result()).toBe('abgebrochen');
  });

  it('Escape schließt den Dialog und setzt open im Host zurück', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Aufgabe löschen' }));
    await expect.element(dialog()).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(dialog()).not.toBeInTheDocument();
    await expect.poll(() => host.open()).toBe(false);
  });

  it('kann auch programmatisch über das Signal geöffnet werden', async () => {
    host.open.set(true);
    await expect.element(dialog()).toBeVisible();
  });
});
