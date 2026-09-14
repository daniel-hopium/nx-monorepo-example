import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { Contact, NewContact } from './contact';
import { ContactApi } from './contact-api';

/**
 * NgRx Signal Store für Kontakte.
 *
 * Ein Signal Store ist eine Klasse, die aus Bausteinen ("Features") zusammengesetzt wird:
 *   withState     -> Zustand; jedes Feld wird zu einem Signal (store.contacts())
 *   withComputed  -> abgeleitete Werte (computed), z. B. Anzahl Favoriten
 *   withMethods   -> alles, was den Zustand ändert; nur hier wird patchState gerufen
 *   withHooks     -> Lebenszyklus: onInit lädt die Daten beim Erzeugen
 *
 * Der Zustand ist standardmäßig GESCHÜTZT (protectedState): von außen kann niemand
 * `patchState(store, …)` aufrufen, nur die Methoden des Stores. In Tests hebt
 * `unprotected(store)` aus `@ngrx/signals/testing` das gezielt auf.
 *
 * Zwei Arten von Methoden, bewusst unterschiedlich gebaut:
 *   rxMethod  für STRÖME (Suche): Debounce, abbrechen alter Requests per switchMap
 *   async     für BEFEHLE (anlegen, löschen): ein Aufruf, ein Ergebnis
 */
type ContactState = {
  contacts: Contact[];
  query: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

export const initialContactState: ContactState = {
  contacts: [],
  query: '',
  loading: false,
  saving: false,
  error: null,
};

/** Wartezeit nach dem letzten Tastendruck, bevor gesucht wird. Exportiert für Tests. */
export const SEARCH_DEBOUNCE_MS = 300;

export const ContactStore = signalStore(
  withState(initialContactState),

  withComputed(({ contacts }) => ({
    total: computed(() => contacts().length),
    favoriteCount: computed(() => contacts().filter((c) => c.favorite).length),
    /** Favoriten zuerst, dann alphabetisch. Die API-Reihenfolge bleibt unberührt. */
    sortedContacts: computed(() =>
      [...contacts()].sort((a, b) =>
        a.favorite === b.favorite ? a.name.localeCompare(b.name, 'de') : a.favorite ? -1 : 1
      )
    ),
  })),

  withMethods((store, api = inject(ContactApi)) => {
    /**
     * Lädt Kontakte für eine Suche. `switchMap` bricht einen noch laufenden
     * Request ab, wenn eine neue Suche kommt. So kann eine langsame alte
     * Antwort nie eine neuere überschreiben (Race Condition).
     */
    const load = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((query) =>
          api.getContacts(query).pipe(
            tap((contacts) => patchState(store, { contacts, loading: false })),
            // Fehler INNERHALB von switchMap abfangen. Außerhalb würde der
            // Strom sterben und spätere Suchen würden nichts mehr tun.
            catchError(() => {
              patchState(store, { loading: false, error: 'Kontakte konnten nicht geladen werden' });
              return EMPTY;
            })
          )
        )
      )
    );

    /** Suche aus dem Eingabefeld: Query sofort merken, laden erst nach Tipp-Pause. */
    const search = rxMethod<string>(
      pipe(
        tap((query) => patchState(store, { query })),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => load(query))
      )
    );

    return {
      load,
      search,

      /** Legt einen Kontakt an. Gibt true zurück, damit die UI das Formular leeren kann. */
      async add(contact: NewContact): Promise<boolean> {
        patchState(store, { saving: true, error: null });
        try {
          const created = await firstValueFrom(api.createContact(contact));
          patchState(store, { contacts: [...store.contacts(), created] });
          return true;
        } catch {
          patchState(store, { error: 'Kontakt konnte nicht angelegt werden' });
          return false;
        } finally {
          patchState(store, { saving: false });
        }
      },

      /**
       * Optimistisches Löschen: sofort aus der Liste entfernen (UI reagiert ohne
       * Wartezeit), dann den Server fragen. Schlägt das fehl, wird der alte
       * Zustand wiederhergestellt (Rollback).
       */
      async remove(id: number): Promise<void> {
        const previous = store.contacts();
        patchState(store, { contacts: previous.filter((c) => c.id !== id), error: null });
        try {
          await firstValueFrom(api.deleteContact(id));
        } catch {
          patchState(store, { contacts: previous, error: 'Kontakt konnte nicht gelöscht werden' });
        }
      },

      /** Ebenfalls optimistisch, mit Rollback. */
      async toggleFavorite(id: number): Promise<void> {
        const previous = store.contacts();
        const target = previous.find((c) => c.id === id);
        if (!target) return;

        patchState(store, {
          contacts: previous.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
        });
        try {
          await firstValueFrom(api.setFavorite(id, !target.favorite));
        } catch {
          patchState(store, { contacts: previous, error: 'Favorit konnte nicht gespeichert werden' });
        }
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.load(store.query());
    },
  })
);

/** Typ einer Store-Instanz, praktisch für Fakes in Komponententests. */
export type ContactStoreInstance = InstanceType<typeof ContactStore>;
