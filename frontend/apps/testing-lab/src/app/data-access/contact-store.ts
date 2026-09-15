import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { AppError, toAppError } from '../core/error/app-error';
import { fail, ok, Result } from '../core/error/result';
import { Contact, NewContact } from './contact';
import { ContactApi } from './contact-api';
import { NotificationService } from './notification-service';

/**
 * VARIANTE A: "klassisch" mit NgRx Signal Store + RxJS (rxMethod).
 * Gegenstück: contact-resource-store.ts (Resource API). Vergleich in ERROR-HANDLING.md.
 *
 * Aufbau eines Signal Stores:
 *   withState     -> Zustand; jedes Feld wird zu einem Signal (store.contacts())
 *   withComputed  -> abgeleitete Werte
 *   withMethods   -> alles, was den Zustand ändert; nur hier wird patchState gerufen
 *   withHooks     -> onInit lädt die Daten beim Erzeugen
 *
 * FEHLERSTRATEGIE (die gleiche wie in Variante B, nur anders umgesetzt):
 *
 *   LESEN (Liste laden)
 *   - Fehler wird als ZUSTAND gespeichert (loadError) und inline mit
 *     "Erneut versuchen" angezeigt. Kein Toast: der Fehler betrifft genau diesen Bereich.
 *   - Bereits geladene Daten bleiben sichtbar (stale-while-error). Eine leere
 *     Liste nach einem Fehler würde wie "keine Kontakte" aussehen, das wäre falsch.
 *   - Retries (offline, 5xx) hat der HTTP-Interceptor schon erledigt. Kommt hier
 *     ein Fehler an, ist er endgültig.
 *
 *   SCHREIBEN (anlegen, löschen, favorisieren)
 *   - Rückgabe als Result statt Exception: der Aufrufer MUSS den Fehlerfall behandeln.
 *   - Anlegen: Fehler gehen zurück ans Formular (Feldfehler bei 422).
 *   - Löschen/Favorit: optimistisch, bei Fehler Rollback + Toast. Der Nutzer hat
 *     die Aktion ausgelöst und muss erfahren, dass sie nicht geklappt hat, auch
 *     wenn er schon woanders hinschaut. Deshalb hier ein Toast statt inline.
 */
type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

type ContactState = {
  contacts: Contact[];
  query: string;
  loadStatus: LoadStatus;
  loadError: AppError | null;
};

export const initialContactState: ContactState = {
  contacts: [],
  query: '',
  loadStatus: 'idle',
  loadError: null,
};

/** Wartezeit nach dem letzten Tastendruck, bevor gesucht wird. Exportiert für Tests. */
export const SEARCH_DEBOUNCE_MS = 300;

export const ContactStore = signalStore(
  withState(initialContactState),

  withComputed(({ contacts, loadStatus }) => ({
    isLoading: computed(() => loadStatus() === 'loading'),
    /** Erst "leer" sagen, wenn wirklich erfolgreich geladen wurde. */
    isEmpty: computed(() => loadStatus() === 'loaded' && contacts().length === 0),
    total: computed(() => contacts().length),
    favoriteCount: computed(() => contacts().filter((c) => c.favorite).length),
    sortedContacts: computed(() => sortContacts(contacts())),
  })),

  withMethods((store, api = inject(ContactApi), notifications = inject(NotificationService)) => {
    /**
     * Lädt Kontakte. `switchMap` bricht einen laufenden Request ab, wenn eine
     * neue Suche kommt, damit eine späte alte Antwort keine neuere überschreibt.
     */
    const load = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loadStatus: 'loading' })),
        switchMap((query) =>
          api.getContacts(query).pipe(
            tap((contacts) => patchState(store, { contacts, loadStatus: 'loaded', loadError: null })),
            // Fehler INNERHALB von switchMap abfangen, sonst stirbt der Strom
            // und spätere Suchen tun nichts mehr. `contacts` bleibt unangetastet.
            catchError((error: unknown) => {
              patchState(store, { loadStatus: 'error', loadError: toAppError(error) });
              return EMPTY;
            })
          )
        )
      )
    );

    const search = rxMethod<string>(
      pipe(
        tap((query) => patchState(store, { query })),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => load(query))
      )
    );

    /**
     * Gemeinsames Muster für optimistische Befehle:
     * sofort anwenden -> Server fragen -> bei Fehler zurückrollen und melden.
     */
    async function optimistic(
      apply: (contacts: Contact[]) => Contact[],
      request: () => Promise<unknown>,
      failureMessage: string
    ): Promise<Result<void>> {
      const previous = store.contacts();
      patchState(store, { contacts: apply(previous) });
      try {
        await request();
        return ok(undefined);
      } catch (error) {
        const appError = toAppError(error);
        patchState(store, { contacts: previous });
        notifications.notify(`${failureMessage} ${appError.userMessage}`, 'error');
        return fail(appError);
      }
    }

    return {
      load,
      search,

      /** "Erneut versuchen" aus der Fehleranzeige: gleiche Suche nochmal. */
      retry(): void {
        load(store.query());
      },

      async add(contact: NewContact): Promise<Result<Contact>> {
        try {
          const created = await firstValueFrom(api.createContact(contact));
          patchState(store, { contacts: [...store.contacts(), created] });
          return ok(created);
        } catch (error) {
          // Kein Toast: das Formular zeigt den Fehler am richtigen Feld.
          return fail(toAppError(error));
        }
      },

      remove(id: number): Promise<Result<void>> {
        const name = store.contacts().find((c) => c.id === id)?.name ?? 'Kontakt';
        return optimistic(
          (contacts) => contacts.filter((c) => c.id !== id),
          () => firstValueFrom(api.deleteContact(id)),
          `"${name}" wurde nicht gelöscht.`
        );
      },

      toggleFavorite(id: number): Promise<Result<void>> {
        const target = store.contacts().find((c) => c.id === id);
        if (!target) return Promise.resolve(ok(undefined));
        return optimistic(
          (contacts) => contacts.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
          () => firstValueFrom(api.setFavorite(id, !target.favorite)),
          'Favorit wurde nicht gespeichert.'
        );
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.load(store.query());
    },
  })
);

/** Favoriten zuerst, dann alphabetisch. Von beiden Stores genutzt. */
export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) =>
    a.favorite === b.favorite ? a.name.localeCompare(b.name, 'de') : a.favorite ? -1 : 1
  );
}
