/**
 * SIGNAL STORE TESTEN (mittlere Schicht)
 *
 * Frage dieses Tests: Stimmt die LOGIK des Stores?
 * Laden, Fehler, Debounce, Abbrechen alter Suchen, optimistisches Löschen mit Rollback.
 *
 * Der Store ruft `ContactApi`. Die API ist hier ein Mock aus `vi.fn()`, der
 * Observables zurückgibt. Es gibt also KEIN HTTP und KEINE Komponente.
 *
 * Werkzeuge, die hier vorkommen:
 *  - of(x)            Observable, das sofort x liefert (Erfolg)
 *  - throwError(fn)   Observable, das sofort fehlschlägt
 *  - new Subject()    Observable, das der TEST später auslöst. So kann man den
 *                     Zustand WÄHREND eines laufenden Requests prüfen.
 *  - vi.useFakeTimers + advanceTimersByTime   für debounceTime
 *  - unprotected(store)                       um den geschützten Zustand im Test
 *                                             direkt zu setzen (Arrange)
 *
 * Wichtig: `TestBed.inject(ContactStore)` erzeugt den Store und löst dabei
 * `onInit` aus, das sofort lädt. Deshalb den Mock VOR dem inject vorbereiten.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Contact, NewContact } from './contact';
import { ContactApi } from './contact-api';
import { ContactStore, SEARCH_DEBOUNCE_MS } from './contact-store';

const seed: Contact[] = [
  { id: 1, name: 'Linus', email: 'linus@example.com', company: 'LF', favorite: false },
  { id: 2, name: 'Ada', email: 'ada@example.com', company: 'AE', favorite: true },
  { id: 3, name: 'Grace', email: 'grace@example.com', company: 'Navy', favorite: false },
];

/**
 * Mock-Factory für die API.
 * `satisfies Record<keyof ContactApi, unknown>` lässt den Compiler prüfen, dass
 * der Mock ALLE öffentlichen Methoden der echten API hat. Kommt eine neue
 * Methode dazu, meldet TypeScript hier einen Fehler, statt dass der Test zur
 * Laufzeit mit "is not a function" scheitert.
 */
function createApiMock() {
  return {
    getContacts: vi.fn<(query?: string) => Observable<Contact[]>>(() => of(seed)),
    createContact: vi.fn<(dto: NewContact) => Observable<Contact>>(),
    deleteContact: vi.fn<(id: number) => Observable<void>>(() => of(undefined)),
    setFavorite: vi.fn<(id: number, favorite: boolean) => Observable<Contact>>(),
  } satisfies Record<keyof ContactApi, unknown>;
}

describe('ContactStore', () => {
  let api: ReturnType<typeof createApiMock>;

  /** Erzeugt den Store mit dem aktuellen Mock. Pro Test frisch (TestBed wird automatisch zurückgesetzt). */
  function createStore() {
    TestBed.configureTestingModule({
      // ContactStore ist NICHT providedIn: 'root', daher muss er hier bereitgestellt werden.
      providers: [ContactStore, { provide: ContactApi, useValue: api }],
    });
    return TestBed.inject(ContactStore);
  }

  beforeEach(() => {
    api = createApiMock();
  });

  describe('Initialisierung und Laden', () => {
    it('lädt beim Erzeugen (onInit) mit leerer Suche', () => {
      const store = createStore();

      expect(api.getContacts).toHaveBeenCalledExactlyOnceWith('');
      expect(store.contacts()).toEqual(seed);
      expect(store.loading()).toBe(false);
    });

    it('loading ist true, solange die Antwort aussteht', () => {
      const response$ = new Subject<Contact[]>();
      api.getContacts.mockReturnValue(response$);

      const store = createStore();
      expect(store.loading()).toBe(true); // Request läuft

      response$.next(seed); // "Server" antwortet
      expect(store.loading()).toBe(false);
      expect(store.total()).toBe(3);
    });

    it('bei Fehler: Meldung setzen, loading beenden, Liste nicht anfassen', () => {
      api.getContacts.mockReturnValue(throwError(() => new Error('500')));
      const store = createStore();

      expect(store.error()).toBe('Kontakte konnten nicht geladen werden');
      expect(store.loading()).toBe(false);
      expect(store.contacts()).toEqual([]);
    });

    it('nach einem Fehler funktioniert das nächste Laden wieder (der Strom lebt weiter)', () => {
      api.getContacts.mockReturnValueOnce(throwError(() => new Error('500')));
      const store = createStore();
      expect(store.error()).not.toBeNull();

      store.load('');

      // Hätte der Store den Fehler außerhalb von switchMap abgefangen, wäre
      // rxMethod jetzt tot und dieser Aufruf würde nichts mehr tun.
      expect(store.error()).toBeNull();
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
      slow$.next(seed); // kommt zu spät, niemand hört mehr zu

      expect(store.contacts()).toEqual([seed[1]]);
    });
  });

  describe('search (Debounce mit Fake Timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('merkt sich die Query sofort, sucht aber erst nach der Tipp-Pause', () => {
      const store = createStore();
      api.getContacts.mockClear(); // den Aufruf aus onInit vergessen

      store.search('a');
      store.search('ad');
      store.search('ada');

      expect(store.query()).toBe('ada'); // sofort, damit das Eingabefeld stimmt
      expect(api.getContacts).not.toHaveBeenCalled();

      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      expect(api.getContacts).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      // Nur EIN Request für drei Tastendrücke, mit dem letzten Wert.
      expect(api.getContacts).toHaveBeenCalledExactlyOnceWith('ada');
    });

    it('distinctUntilChanged: tippen und zurücklöschen löst keinen neuen Request aus', () => {
      const store = createStore();
      store.search('ada');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.getContacts.mockClear();

      store.search('ad');
      store.search('ada'); // wieder derselbe Wert wie zuletzt gesucht
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(api.getContacts).not.toHaveBeenCalled();
    });
  });

  describe('computed', () => {
    it('total, favoriteCount und sortedContacts leiten sich vom Zustand ab', () => {
      const store = createStore();

      expect(store.total()).toBe(3);
      expect(store.favoriteCount()).toBe(1);
      // Favoriten zuerst, danach alphabetisch
      expect(store.sortedContacts().map((c) => c.name)).toEqual(['Ada', 'Grace', 'Linus']);
    });

    it('reagieren auf Zustandsänderungen (Arrange mit unprotected)', () => {
      const store = createStore();

      // patchState(store, …) ist von außen verboten (protectedState).
      // unprotected() erlaubt es gezielt im Test, um einen Zustand herzustellen.
      patchState(unprotected(store), {
        contacts: seed.map((c) => ({ ...c, favorite: true })),
      });

      expect(store.favoriteCount()).toBe(3);
    });
  });

  describe('add', () => {
    const dto: NewContact = { name: 'Margaret', email: 'm@example.com', company: 'NASA' };
    const created: Contact = { ...dto, id: 4, favorite: false };

    it('hängt den vom Server gelieferten Kontakt an und gibt true zurück', async () => {
      api.createContact.mockReturnValue(of(created));
      const store = createStore();

      const ok = await store.add(dto);

      expect(ok).toBe(true);
      expect(api.createContact).toHaveBeenCalledWith(dto);
      expect(store.contacts()).toContainEqual(created); // mit Server-Id, nicht mit dem DTO
      expect(store.saving()).toBe(false);
    });

    it('saving ist während des Speicherns true', async () => {
      const response$ = new Subject<Contact>();
      api.createContact.mockReturnValue(response$);
      const store = createStore();

      const pending = store.add(dto); // NICHT awaiten, sonst wäre es schon fertig
      expect(store.saving()).toBe(true);

      response$.next(created);
      await pending;
      expect(store.saving()).toBe(false);
    });

    it('bei Fehler: false, Meldung, Liste unverändert', async () => {
      api.createContact.mockReturnValue(throwError(() => new Error('500')));
      const store = createStore();

      const ok = await store.add(dto);

      expect(ok).toBe(false);
      expect(store.error()).toBe('Kontakt konnte nicht angelegt werden');
      expect(store.contacts()).toEqual(seed);
    });
  });

  describe('remove (optimistisch mit Rollback)', () => {
    it('entfernt sofort, noch bevor der Server antwortet', async () => {
      const response$ = new Subject<void>();
      api.deleteContact.mockReturnValue(response$);
      const store = createStore();

      const pending = store.remove(2);
      expect(store.contacts().map((c) => c.id)).toEqual([1, 3]); // schon weg

      response$.next();
      await pending;
      expect(api.deleteContact).toHaveBeenCalledWith(2);
      expect(store.contacts().map((c) => c.id)).toEqual([1, 3]); // bleibt weg
    });

    it('stellt den alten Zustand wieder her, wenn der Server ablehnt', async () => {
      const response$ = new Subject<void>();
      api.deleteContact.mockReturnValue(response$);
      const store = createStore();

      const pending = store.remove(2);
      expect(store.total()).toBe(2);

      response$.error(new Error('403'));
      await pending;

      expect(store.contacts()).toEqual(seed); // Rollback
      expect(store.error()).toBe('Kontakt konnte nicht gelöscht werden');
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

    it('Rollback bei Fehler', async () => {
      api.setFavorite.mockReturnValue(throwError(() => new Error('500')));
      const store = createStore();

      await store.toggleFavorite(2);

      expect(store.contacts().find((c) => c.id === 2)?.favorite).toBe(true); // wie vorher
      expect(store.error()).toBe('Favorit konnte nicht gespeichert werden');
    });

    it('unbekannte Id: kein API-Aufruf', async () => {
      const store = createStore();
      await store.toggleFavorite(999);
      expect(api.setFavorite).not.toHaveBeenCalled();
    });
  });

  it('clearError setzt die Meldung zurück', () => {
    api.getContacts.mockReturnValue(throwError(() => new Error('500')));
    const store = createStore();

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
