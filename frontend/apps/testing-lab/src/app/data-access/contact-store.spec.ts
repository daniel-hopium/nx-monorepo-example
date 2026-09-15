/**
 * SIGNAL STORE TESTEN (mittlere Schicht), VARIANTE A: klassisch mit rxMethod
 *
 * Frage dieses Tests: Stimmt die LOGIK des Stores, besonders im Fehlerfall?
 *   Laden, Fehlerzustand, stale-while-error, Retry, Debounce, switchMap,
 *   Result-Rückgaben, optimistische Befehle mit Rollback und Toast.
 *
 * Der Store ruft `ContactApi`. Die API ist hier ein Mock aus `vi.fn()`, der
 * Observables zurückgibt. Es gibt also KEIN HTTP und KEINE Komponente.
 * Der NotificationService ist ebenfalls gemockt: wir prüfen nur, OB und WAS
 * gemeldet wird, nicht wie der Toast aussieht.
 *
 * Werkzeuge:
 *  - of(x)            Observable, das sofort x liefert (Erfolg)
 *  - throwError(fn)   Observable, das sofort fehlschlägt
 *  - new Subject()    Observable, das der TEST später auslöst. So kann man den
 *                     Zustand WÄHREND eines laufenden Requests prüfen.
 *  - vi.useFakeTimers + advanceTimersByTime   für debounceTime
 *  - unprotected(store)                       Zustand im Test direkt setzen (Arrange)
 *
 * Fehler, die der Mock wirft, sind ECHTE HttpErrorResponses. So testen wir,
 * dass der Store sie selbst in AppErrors übersetzt (toAppError), auch wenn
 * einmal kein Interceptor davor sitzt.
 *
 * Wichtig: `TestBed.inject(ContactStore)` löst `onInit` aus, das sofort lädt.
 * Deshalb den Mock VOR dem inject vorbereiten.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AppError, USER_MESSAGES } from '../core/error/app-error';
import { Contact, NewContact } from './contact';
import { ContactApi } from './contact-api';
import { ContactStore, SEARCH_DEBOUNCE_MS } from './contact-store';
import { NotificationService } from './notification-service';

const seed: Contact[] = [
  { id: 1, name: 'Linus', email: 'linus@example.com', company: 'LF', favorite: false },
  { id: 2, name: 'Ada', email: 'ada@example.com', company: 'AE', favorite: true },
  { id: 3, name: 'Grace', email: 'grace@example.com', company: 'Navy', favorite: false },
];

const httpError = (status: number, error: unknown = null) =>
  throwError(() => new HttpErrorResponse({ status, error }));

/**
 * Mock-Factory für die API.
 * `satisfies Record<keyof ContactApi, unknown>` lässt den Compiler prüfen, dass
 * der Mock ALLE öffentlichen Methoden der echten API hat.
 */
function createApiMock() {
  return {
    getContacts: vi.fn<(query?: string) => Observable<Contact[]>>(() => of(seed)),
    createContact: vi.fn<(dto: NewContact) => Observable<Contact>>(),
    deleteContact: vi.fn<(id: number) => Observable<void>>(() => of(undefined)),
    setFavorite: vi.fn<(id: number, favorite: boolean) => Observable<Contact>>(),
    contactsResource: vi.fn(), // nur Variante B nutzt das
  } satisfies Record<keyof ContactApi, unknown>;
}

describe('ContactStore (Variante A, rxMethod)', () => {
  let api: ReturnType<typeof createApiMock>;
  const notifications = { notify: vi.fn() };

  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        ContactStore, // nicht providedIn: 'root'
        { provide: ContactApi, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    return TestBed.inject(ContactStore);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    api = createApiMock();
  });

  describe('Laden', () => {
    it('lädt beim Erzeugen (onInit) mit leerer Suche', () => {
      const store = createStore();

      expect(api.getContacts).toHaveBeenCalledExactlyOnceWith('');
      expect(store.contacts()).toEqual(seed);
      expect(store.loadStatus()).toBe('loaded');
      expect(store.loadError()).toBeNull();
    });

    it('isLoading ist true, solange die Antwort aussteht; isEmpty erst NACH Erfolg', () => {
      const response$ = new Subject<Contact[]>();
      api.getContacts.mockReturnValue(response$);

      const store = createStore();
      expect(store.isLoading()).toBe(true);
      expect(store.isEmpty()).toBe(false); // noch nicht "leer", nur noch nicht geladen

      response$.next([]);
      expect(store.isLoading()).toBe(false);
      expect(store.isEmpty()).toBe(true);
    });

    it('Fehler beim ersten Laden: AppError im Zustand, KEIN Toast, isEmpty bleibt false', () => {
      api.getContacts.mockReturnValue(httpError(500));
      const store = createStore();

      expect(store.loadStatus()).toBe('error');
      expect(store.loadError()).toBeInstanceOf(AppError);
      expect(store.loadError()?.kind).toBe('server');
      // Ein Ladefehler ist KEINE leere Liste. Sonst stünde "Keine Kontakte gefunden" da.
      expect(store.isEmpty()).toBe(false);
      // Lesefehler werden inline angezeigt, nicht als Toast.
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('stale-while-error: schlägt eine spätere Suche fehl, bleiben die alten Daten stehen', () => {
      const store = createStore();
      api.getContacts.mockReturnValue(httpError(0));

      store.load('ada');

      expect(store.loadError()?.kind).toBe('offline');
      expect(store.contacts()).toEqual(seed);
    });

    it('retry lädt mit der aktuellen Suche neu und räumt den Fehler weg', () => {
      api.getContacts.mockReturnValueOnce(httpError(503));
      const store = createStore();
      patchState(unprotected(store), { query: 'gr' });

      store.retry();

      expect(api.getContacts).toHaveBeenLastCalledWith('gr');
      expect(store.loadError()).toBeNull();
      expect(store.loadStatus()).toBe('loaded');
    });

    it('nach einem Fehler funktioniert das nächste Laden wieder (der Strom lebt weiter)', () => {
      api.getContacts.mockReturnValueOnce(httpError(500));
      const store = createStore();

      store.load('');

      // Hätte der Store den Fehler außerhalb von switchMap abgefangen, wäre
      // rxMethod jetzt tot und dieser Aufruf würde nichts mehr tun.
      expect(store.loadError()).toBeNull();
      expect(store.contacts()).toEqual(seed);
    });

    it('switchMap: eine neue Suche verwirft die Antwort der alten', () => {
      const store = createStore();
      const slow$ = new Subject<Contact[]>();
      const fast$ = new Subject<Contact[]>();
      api.getContacts.mockReturnValueOnce(slow$).mockReturnValueOnce(fast$);

      store.load('a');
      store.load('ad');
      expect(slow$.observed).toBe(false); // alter Request wurde abbestellt

      fast$.next([seed[1]]);
      expect(store.contacts()).toEqual([seed[1]]);
    });
  });

  describe('search (Debounce mit Fake Timers)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('merkt sich die Query sofort, sucht aber erst nach der Tipp-Pause', () => {
      const store = createStore();
      api.getContacts.mockClear();

      store.search('a');
      store.search('ad');
      store.search('ada');

      expect(store.query()).toBe('ada');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      expect(api.getContacts).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(api.getContacts).toHaveBeenCalledExactlyOnceWith('ada');
    });

    it('distinctUntilChanged: tippen und zurücklöschen löst keinen neuen Request aus', () => {
      const store = createStore();
      store.search('ada');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.getContacts.mockClear();

      store.search('ad');
      store.search('ada');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(api.getContacts).not.toHaveBeenCalled();
    });
  });

  describe('computed', () => {
    it('total, favoriteCount und sortedContacts leiten sich vom Zustand ab', () => {
      const store = createStore();

      expect(store.total()).toBe(3);
      expect(store.favoriteCount()).toBe(1);
      expect(store.sortedContacts().map((c) => c.name)).toEqual(['Ada', 'Grace', 'Linus']);
    });
  });

  describe('add (Result statt Exception)', () => {
    const dto: NewContact = { name: 'Margaret', email: 'm@example.com', company: 'NASA' };
    const created: Contact = { ...dto, id: 4, favorite: false };

    it('Erfolg: ok-Result mit dem Server-Kontakt, Liste ergänzt', async () => {
      api.createContact.mockReturnValue(of(created));
      const store = createStore();

      const result = await store.add(dto);

      expect(result).toEqual({ ok: true, value: created });
      expect(store.contacts()).toContainEqual(created);
    });

    it('422: fail-Result mit Feldfehlern, Liste unverändert, KEIN Toast (das Formular zeigt es)', async () => {
      api.createContact.mockReturnValue(
        httpError(422, { message: 'Bitte prüfen', errors: { email: 'Bereits vergeben' } })
      );
      const store = createStore();

      const result = await store.add(dto);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Type Narrowing: erst nach der Prüfung kennt TypeScript `error`.
        expect(result.error.kind).toBe('validation');
        expect(result.error.fieldErrors).toEqual({ email: 'Bereits vergeben' });
      }
      expect(store.contacts()).toEqual(seed);
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });

  describe('remove (optimistisch mit Rollback)', () => {
    it('entfernt sofort, noch bevor der Server antwortet', async () => {
      const response$ = new Subject<void>();
      api.deleteContact.mockReturnValue(response$);
      const store = createStore();

      const pending = store.remove(2);
      expect(store.contacts().map((c) => c.id)).toEqual([1, 3]);

      response$.next();
      response$.complete();
      expect(await pending).toEqual({ ok: true, value: undefined });
      expect(store.contacts().map((c) => c.id)).toEqual([1, 3]);
    });

    it('403: Rollback, Toast mit Name und Grund, fail-Result', async () => {
      const response$ = new Subject<void>();
      api.deleteContact.mockReturnValue(response$);
      const store = createStore();

      const pending = store.remove(2);
      expect(store.total()).toBe(2);

      response$.error(new HttpErrorResponse({ status: 403 }));
      const result = await pending;

      expect(store.contacts()).toEqual(seed);
      expect(result.ok).toBe(false);
      expect(notifications.notify).toHaveBeenCalledExactlyOnceWith(
        `"Ada" wurde nicht gelöscht. ${USER_MESSAGES.forbidden}`,
        'error'
      );
    });
  });

  describe('toggleFavorite', () => {
    it('dreht den Favoriten um und schickt den NEUEN Wert an die API', async () => {
      api.setFavorite.mockImplementation((id, favorite) => of({ ...seed[0], id, favorite }));
      const store = createStore();

      await store.toggleFavorite(1);

      expect(api.setFavorite).toHaveBeenCalledWith(1, true);
      expect(store.contacts().find((c) => c.id === 1)?.favorite).toBe(true);
    });

    it('Rollback und Toast bei Fehler', async () => {
      api.setFavorite.mockReturnValue(httpError(500));
      const store = createStore();

      await store.toggleFavorite(2);

      expect(store.contacts().find((c) => c.id === 2)?.favorite).toBe(true);
      expect(notifications.notify).toHaveBeenCalledWith(expect.stringContaining('Favorit'), 'error');
    });

    it('unbekannte Id: kein API-Aufruf', async () => {
      const store = createStore();
      await store.toggleFavorite(999);
      expect(api.setFavorite).not.toHaveBeenCalled();
    });
  });
});
