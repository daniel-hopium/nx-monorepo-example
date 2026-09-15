/**
 * INTEGRATIONSTEST, VARIANTE B: die GANZE Kette im Browser
 *
 *   Seite -> ContactResourceStore -> httpResource -> HttpClient
 *        -> httpErrorInterceptor (Retry, AppError) -> mockBackendInterceptor
 *
 * Hier wird NICHTS gemockt außer dem Server. Das Mock-Backend der App erzeugt
 * die Fehler über "magische" Eingaben (Suche "fehler" -> 500, Grace löschen -> 403,
 * E-Mail vergeben@example.com -> 422). Genau so kann man es auch in der App ausprobieren.
 *
 * Damit der Test schnell bleibt, wird die Config per DI verkleinert:
 *   HTTP_ERROR_CONFIG            1 Retry ohne Wartezeit
 *   CONTACT_SEARCH_DEBOUNCE_MS   0
 * Das Backend antwortet trotzdem mit 400 ms Latenz, deshalb längere Timeouts
 * bei expect.element (Standard ist 1 s).
 *
 * Achtung: Das Mock-Backend hält seine Daten modulweit. Die Tests ändern daher
 * nur Dinge, die ohnehin scheitern (403, 422), damit sie sich nicht beeinflussen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { USER_MESSAGES } from '../core/error/app-error';
import { HTTP_ERROR_CONFIG, httpErrorInterceptor } from '../core/error/http-error.interceptor';
import { Logger } from '../core/error/logger';
import { CONTACT_SEARCH_DEBOUNCE_MS } from '../data-access/contact-resource-store';
import { mockBackendInterceptor } from '../data-access/mock-backend.interceptor';
import { Toasts } from '../ui/toasts';
import { ContactsResourcePage } from './contacts-resource-page';

@Component({
  imports: [ContactsResourcePage, Toasts],
  template: `<lab-contacts-resource-page /><lab-toasts />`,
})
class Host {}

const slow = { timeout: 4000 };

describe('ContactsResourcePage (Browser, ganze Kette mit Mock-Backend)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor, mockBackendInterceptor])),
        { provide: HTTP_ERROR_CONFIG, useValue: { retries: 1, retryBaseDelayMs: 0, timeoutMs: 5000 } },
        { provide: CONTACT_SEARCH_DEBOUNCE_MS, useValue: 0 },
        // Logs stummschalten: die erwarteten Fehler würden sonst die Testausgabe fluten.
        { provide: Logger, useValue: { error: () => undefined, warn: () => undefined } },
      ],
    }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('nach dem ersten Laden: Kontakte sichtbar, kein Lade- oder Fehlerhinweis', async () => {
    // whenStable() im beforeEach wartet bereits auf den ersten Request (httpResource
    // meldet ihn als "pending task"). Den Ladehinweis selbst prüft contacts-page.spec.ts.
    await expect.element(page.getByText('ada@example.com')).toBeVisible(slow);
    await expect.element(page.getByText('Lade Kontakte')).not.toBeInTheDocument();
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('Serverfehler bei der Suche: nach Retry kompakte Meldung, alte Liste bleibt', async () => {
    await expect.element(page.getByText('ada@example.com')).toBeVisible(slow);

    await userEvent.fill(page.getByLabelText('Suchen'), 'fehler');

    await expect.element(page.getByRole('alert')).toHaveTextContent(USER_MESSAGES.server, slow);
    await expect.element(page.getByText('ada@example.com')).toBeVisible();
    await expect.element(page.getByText('Keine Kontakte gefunden')).not.toBeInTheDocument();

    // Suche korrigieren: die Resource lädt automatisch neu, der Fehler verschwindet.
    await userEvent.fill(page.getByLabelText('Suchen'), 'ada');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument(slow);
    await expect.element(page.getByText('grace@example.com')).not.toBeInTheDocument();
  });

  it('"Erneut versuchen" nach Offline-Fehler löst einen neuen Request aus', async () => {
    await userEvent.fill(page.getByLabelText('Suchen'), 'offline');
    const retry = page.getByRole('button', { name: 'Erneut versuchen' });
    await expect.element(retry).toBeVisible(slow);

    await userEvent.click(retry);

    // reload() mit denselben Parametern: der Button zeigt das Laden an, danach wieder den Fehler.
    await expect.element(retry).toHaveAttribute('aria-busy', 'true');
    await expect.element(page.getByRole('alert')).toHaveTextContent(USER_MESSAGES.offline, slow);
  });

  it('Löschen ohne Berechtigung: optimistisch weg, nach 403 zurück und Toast', async () => {
    await expect.element(page.getByText('grace@example.com')).toBeVisible(slow);

    await userEvent.click(page.getByRole('button', { name: 'Grace Hopper löschen' }));

    await expect.element(page.getByText('grace@example.com')).not.toBeInTheDocument();
    await expect.element(page.getByText(USER_MESSAGES.forbidden, { exact: false })).toBeVisible(slow);
    await expect.element(page.getByText('grace@example.com')).toBeVisible();
  });

  it('Anlegen mit vergebener E-Mail: Feldfehler vom Server am Feld', async () => {
    await userEvent.fill(page.getByRole('textbox', { name: 'Name' }), 'Doppelt');
    await userEvent.fill(page.getByRole('textbox', { name: 'E-Mail' }), 'vergeben@example.com');
    await userEvent.click(page.getByRole('button', { name: 'Anlegen' }));

    await expect
      .element(page.getByRole('textbox', { name: 'E-Mail' }))
      .toHaveAccessibleDescription('Diese E-Mail ist bereits vergeben.', slow);
  });
});
