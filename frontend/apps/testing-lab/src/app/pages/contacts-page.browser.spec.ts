/**
 * INTEGRATIONSTEST, VARIANTE A: Smart Component + ECHTER Store, nur die API gemockt
 *
 * Die Kontakte-Tests ergänzen sich:
 *   contact-api.spec.ts       API allein        (HTTP abgefangen)
 *   contact-store.spec.ts     Store allein      (API gemockt)
 *   contacts-page.spec.ts     Komponente allein (Store gefakt)
 *   DIESE Datei               Komponente + Store + Toasts zusammen, im Browser
 *
 * Neu für das Error Handling: Ein Löschfehler erscheint als TOAST. Den rendert
 * in der App die Shell (app.ts), nicht die Seite. Darum rendert der Test eine
 * kleine Host-Komponente mit Seite UND Toasts, so wie der Nutzer es sieht.
 *
 * Die API-Fehler sind echte HttpErrorResponses, der Store übersetzt sie selbst.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { USER_MESSAGES } from '../core/error/app-error';
import { Contact, NewContact } from '../data-access/contact';
import { ContactApi } from '../data-access/contact-api';
import { Toasts } from '../ui/toasts';
import { ContactsPage } from './contacts-page';

const seed: Contact[] = [
  { id: 1, name: 'Linus Torvalds', email: 'linus@example.com', company: 'Linux Foundation', favorite: false },
  { id: 2, name: 'Ada Lovelace', email: 'ada@example.com', company: 'Analytical Engines', favorite: true },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', company: 'US Navy', favorite: false },
];

const httpError = (status: number, error: unknown = null) =>
  throwError(() => new HttpErrorResponse({ status, error }));

@Component({
  imports: [ContactsPage, Toasts],
  template: `<lab-contacts-page /><lab-toasts />`,
})
class Host {}

describe('ContactsPage + ContactStore (Browser, Integration)', () => {
  const api = {
    getContacts: vi.fn((q = '') => of(seed.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())))),
    createContact: vi.fn((dto: NewContact) => of<Contact>({ ...dto, id: 99, favorite: false })),
    deleteContact: vi.fn<(id: number) => ReturnType<ContactApi['deleteContact']>>(() => of(undefined)),
    setFavorite: vi.fn((id: number, favorite: boolean) => of({ ...seed[0], id, favorite })),
  };

  const items = () => page.getByRole('listitem');

  async function render() {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: ContactApi, useValue: api }],
    }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lädt beim Start und zeigt Favoriten zuerst', async () => {
    await render();

    await expect.element(page.getByTestId('stats')).toHaveTextContent('3 Kontakte, 1 Favoriten');
    await expect.element(items().nth(0)).toHaveTextContent('Ada Lovelace');
  });

  it('Ladefehler ohne Daten: Fehleranzeige, "Erneut versuchen" lädt erfolgreich nach', async () => {
    api.getContacts.mockReturnValueOnce(httpError(503));
    await render();

    const alert = page.getByRole('alert');
    await expect.element(alert).toHaveTextContent(USER_MESSAGES.server);
    await expect.element(page.getByText('Keine Kontakte gefunden')).not.toBeInTheDocument();

    await userEvent.click(page.getByRole('button', { name: 'Erneut versuchen' }));

    await expect.element(alert).not.toBeInTheDocument();
    await expect.element(page.getByTestId('stats')).toHaveTextContent('3 Kontakte');
  });

  it('Suche schlägt fehl: kompakte Meldung, alte Liste bleibt sichtbar', async () => {
    await render();
    api.getContacts.mockReturnValueOnce(httpError(0));

    await userEvent.fill(page.getByLabelText('Suchen'), 'ada');

    await expect.element(page.getByRole('alert')).toHaveTextContent(USER_MESSAGES.offline);
    await expect.element(page.getByText('grace@example.com')).toBeVisible();
  });

  it('Löschen mit 403: Kontakt kommt zurück, Toast nennt Name und Grund', async () => {
    api.deleteContact.mockReturnValueOnce(httpError(403));
    await render();

    await userEvent.click(page.getByRole('button', { name: 'Grace Hopper löschen' }));

    await expect
      .element(page.getByText(`"Grace Hopper" wurde nicht gelöscht. ${USER_MESSAGES.forbidden}`))
      .toBeVisible();
    await expect.element(page.getByText('grace@example.com')).toBeVisible(); // Rollback
  });

  it('Anlegen mit 422: Feldfehler am E-Mail-Feld, Liste unverändert', async () => {
    api.createContact.mockReturnValueOnce(httpError(422, { errors: { email: 'Diese E-Mail ist bereits vergeben.' } }));
    await render();

    await userEvent.fill(page.getByRole('textbox', { name: 'Name' }), 'Doppelt');
    await userEvent.fill(page.getByRole('textbox', { name: 'E-Mail' }), 'ada@example.com');
    await userEvent.click(page.getByRole('button', { name: 'Anlegen' }));

    const email = page.getByRole('textbox', { name: 'E-Mail' });
    await expect.element(email).toHaveAccessibleDescription('Diese E-Mail ist bereits vergeben.');
    await expect.element(page.getByTestId('stats')).toHaveTextContent('3 Kontakte');
  });

  it('Favorit per Tastatur: aria-pressed wechselt und die Liste sortiert neu', async () => {
    await render();
    const star = page.getByRole('button', { name: 'Linus Torvalds als Favorit markieren' });
    await expect.element(star).toHaveAttribute('aria-pressed', 'false');

    star.element().focus();
    await userEvent.keyboard('{Enter}');

    await expect.element(star).toHaveAttribute('aria-pressed', 'true');
    expect(api.setFavorite).toHaveBeenCalledWith(1, true);
    await expect.element(items().nth(1)).toHaveTextContent('Linus Torvalds');
  });
});
