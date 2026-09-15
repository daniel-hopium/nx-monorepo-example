/**
 * SIGNAL STORE MIT RESOURCE API TESTEN, VARIANTE B
 *
 * Unterschied zum Test von Variante A: Hier wird die API NICHT gemockt.
 * `httpResource` braucht einen echten HttpClient, eine gemockte Methode würde
 * nie eine Resource liefern. Deshalb:
 *   echte ContactApi + provideHttpClientTesting -> der Test spielt den Server
 *
 * Resources arbeiten asynchron über Signale und Effects. Zwei Werkzeuge:
 *   TestBed.tick()              lässt Angular Effects und Resources abarbeiten,
 *                               danach ist der Request abgeschickt
 *   await ApplicationRef.whenStable()   wartet, bis die Antwort verarbeitet ist
 * Nicht vor dem flush auf whenStable warten: ein offener Request zählt als
 * "noch nicht stabil", der Test würde hängen.
 *
 * CONTACT_SEARCH_DEBOUNCE_MS = 0 schaltet das Entprellen ab. Der Test prüft
 * Fehlerlogik, nicht Timing (das deckt der Test von Variante A ab).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { USER_MESSAGES } from '../core/error/app-error';
import { Contact } from './contact';
import { CONTACT_SEARCH_DEBOUNCE_MS, ContactResourceStore } from './contact-resource-store';
import { NotificationService } from './notification-service';

const seed: Contact[] = [
  { id: 1, name: 'Linus', email: 'linus@example.com', company: 'LF', favorite: false },
  { id: 2, name: 'Ada', email: 'ada@example.com', company: 'AE', favorite: true },
];

const URL = '/api/contacts';

describe('ContactResourceStore (Variante B, Resource API)', () => {
  let backend: HttpTestingController;
  const notifications = { notify: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ContactResourceStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CONTACT_SEARCH_DEBOUNCE_MS, useValue: 0 },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  /** Effects laufen lassen und den offenen GET holen. */
  function expectGet(query = ''): TestRequest {
    TestBed.tick();
    return backend.expectOne((req) => req.method === 'GET' && req.url === URL && (req.params.get('q') ?? '') === query);
  }

  const stable = () => TestBed.inject(ApplicationRef).whenStable();

  /** Store erzeugen und das erste Laden erfolgreich beantworten. */
  async function createLoadedStore() {
    const store = TestBed.inject(ContactResourceStore);
    expectGet().flush(seed);
    await stable();
    return store;
  }

  describe('Lesen', () => {
    it('erstes Laden: isInitialLoading, danach resolved mit Daten', async () => {
      const store = TestBed.inject(ContactResourceStore);
      const request = expectGet();

      expect(store.isInitialLoading()).toBe(true);
      expect(store.contacts()).toEqual([]); // wirft nicht, obwohl noch kein Wert da ist

      request.flush(seed);
      await stable();

      expect(store.status()).toBe('resolved');
      expect(store.isInitialLoading()).toBe(false);
      expect(store.total()).toBe(2);
      expect(store.error()).toBeNull();
    });

    it('Fehler beim ersten Laden: error() ist ein AppError, contacts() wirft NICHT', async () => {
      const store = TestBed.inject(ContactResourceStore);
      expectGet().flush(null, { status: 500, statusText: 'Server Error' });
      await stable();

      expect(store.status()).toBe('error');
      expect(store.error()?.kind).toBe('server');
      expect(store.error()?.retryable).toBe(true);
      // resource.value() würde hier werfen. Der Store liest es nur hinter hasValue().
      expect(() => store.contacts()).not.toThrow();
      expect(store.isEmpty()).toBe(false); // Fehler ist nicht "leer"
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('stale-while-revalidate: während eine neue Suche lädt, bleiben die alten Daten sichtbar', async () => {
      const store = await createLoadedStore();

      store.search('ada');
      const request = expectGet('ada');

      expect(store.isLoading()).toBe(true);
      expect(store.isInitialLoading()).toBe(false); // wir HATTEN schon Daten
      expect(store.total()).toBe(2);

      request.flush([seed[1]]);
      await stable();
      expect(store.contacts()).toEqual([seed[1]]);
    });

    it('stale-while-error: schlägt eine Suche fehl, bleiben die letzten Daten stehen', async () => {
      const store = await createLoadedStore();

      store.search('kaputt');
      expectGet('kaputt').error(new ProgressEvent('error'), { status: 0 });
      await stable();

      expect(store.error()?.kind).toBe('offline');
      expect(store.contacts()).toEqual(seed);
    });

    it('retry: reload() mit denselben Parametern, danach ist der Fehler weg', async () => {
      const store = TestBed.inject(ContactResourceStore);
      expectGet().flush(null, { status: 503, statusText: 'Unavailable' });
      await stable();

      store.retry();
      const request = expectGet();
      expect(store.status()).toBe('reloading');

      request.flush(seed);
      await stable();
      expect(store.error()).toBeNull();
      expect(store.total()).toBe(2);
    });
  });

  describe('Schreiben', () => {
    it('add: POST, neuer Kontakt erscheint ohne Neuladen, ok-Result', async () => {
      const store = await createLoadedStore();
      const created: Contact = { id: 3, name: 'Grace', email: 'g@example.com', company: 'Navy', favorite: false };

      const pending = store.add({ name: 'Grace', email: 'g@example.com', company: 'Navy' });
      backend.expectOne({ method: 'POST', url: URL }).flush(created);

      expect(await pending).toEqual({ ok: true, value: created });
      expect(store.contacts()).toContainEqual(created);
      expect(store.status()).toBe('local'); // lokal geänderter Wert, kein neuer GET
    });

    it('add mit 422: fail-Result mit Feldfehlern, Liste unverändert', async () => {
      const store = await createLoadedStore();

      const pending = store.add({ name: 'X', email: 'vergeben@example.com', company: '' });
      backend
        .expectOne({ method: 'POST', url: URL })
        .flush({ errors: { email: 'vergeben' } }, { status: 422, statusText: 'Unprocessable' });

      const result = await pending;
      expect(result.ok ? null : result.error.fieldErrors).toEqual({ email: 'vergeben' });
      expect(store.contacts()).toEqual(seed);
    });

    it('remove optimistisch: sofort weg, bei 403 Rollback und Toast', async () => {
      const store = await createLoadedStore();

      const pending = store.remove(2);
      expect(store.contacts().map((c) => c.id)).toEqual([1]);

      backend.expectOne({ method: 'DELETE', url: `${URL}/2` }).flush(null, { status: 403, statusText: 'Forbidden' });
      const result = await pending;

      expect(result.ok).toBe(false);
      expect(store.contacts()).toEqual(seed);
      expect(notifications.notify).toHaveBeenCalledWith(`"Ada" wurde nicht gelöscht. ${USER_MESSAGES.forbidden}`, 'error');
    });

    it('toggleFavorite mit 404: KEIN Rollback, sondern reload(), weil der Server-Stand sich geändert hat', async () => {
      const store = await createLoadedStore();

      const pending = store.toggleFavorite(1);
      backend.expectOne({ method: 'PATCH', url: `${URL}/1` }).flush(null, { status: 404, statusText: 'Not Found' });
      await pending;

      // Der Kontakt existiert serverseitig nicht mehr: frische Liste holen.
      expectGet().flush([seed[1]]);
      await stable();

      expect(store.contacts()).toEqual([seed[1]]);
      expect(notifications.notify).toHaveBeenCalledWith(expect.stringContaining(USER_MESSAGES['not-found']), 'error');
    });
  });
});
