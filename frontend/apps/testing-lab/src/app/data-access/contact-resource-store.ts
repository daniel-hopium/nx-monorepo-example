import { computed, debounced, effect, inject, InjectionToken, signal } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { toAppError } from '../core/error/app-error';
import { fail, ok, Result } from '../core/error/result';
import { Contact, NewContact } from './contact';
import { ContactApi } from './contact-api';
import { sortContacts } from './contact-store';
import { NotificationService } from './notification-service';

/**
 * VARIANTE B: Signal Store mit der Resource API (httpResource + debounced).
 * Gegenstück: contact-store.ts (rxMethod). Vergleich in ERROR-HANDLING.md.
 *
 * Unterschied zu Variante A beim LESEN:
 *   Variante A speichert loadStatus und loadError selbst im State und pflegt sie
 *   in tap/catchError. Hier liefert die Resource das alles fertig als Signale:
 *     status()     'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'
 *     error()      der Fehler (dank Interceptor bereits ein AppError)
 *     isLoading()  true bei loading UND reloading
 *     reload()     "Erneut versuchen" ohne eigene Retry-Logik
 *   Kein RxJS, kein catchError, kein "Strom darf nicht sterben".
 *
 * ZWEI STOLPERFALLEN, die man kennen MUSS:
 *   1. `resource.value()` WIRFT, wenn die Resource im Status 'error' ist.
 *      Ein Template, das einfach value() liest, stürzt dann ab.
 *   2. Ändern sich die Parameter (neue Suche), ist value() während des Ladens
 *      `undefined`. Die Liste würde bei jedem Tastendruck verschwinden.
 *   Lösung: value() nur hinter `hasValue()` lesen und den letzten echten Wert
 *   separat festhalten (stale-while-error / stale-while-revalidate, wie Variante A).
 *
 *   Warum ein effect und kein computed/linkedSignal? Signale sind LAZY: ein
 *   linkedSignal sieht einen Zwischenstand nur, wenn ihn jemand liest. Liest
 *   niemand die Liste zwischen "geladen" und "neue Suche lädt", kennt es den
 *   alten Wert nie. Im Template fällt das nicht auf (es liest ständig), im
 *   Store-Test schon. Der effect beobachtet die Resource dagegen immer.
 *   Aus demselben Grund nutzen wir nicht `withPreviousValueOnLoading()` aus
 *   @ngrx/signals/resource (22.0.1): dessen Proxy liest das echte Signal beim
 *   Laden gar nicht, ein computed ohne Abhängigkeit rechnet danach nie neu.
 *
 * SCHREIBEN bleibt imperativ (Promise + Result), genau wie in Variante A.
 * Resources sind für das Lesen gedacht, nicht für POST/DELETE.
 * Neu ist nur das Aktualisieren der Liste: `resource.update(...)` setzt einen
 * lokalen Wert (Status 'local'), `resource.set(previous)` rollt zurück und
 * `resource.reload()` holt den Serverstand, wenn der lokale Stand nicht mehr stimmt.
 */

/** Per DI überschreibbar, damit Tests ohne Wartezeit laufen können. */
export const CONTACT_SEARCH_DEBOUNCE_MS = new InjectionToken<number>('CONTACT_SEARCH_DEBOUNCE_MS', {
  providedIn: 'root',
  factory: () => 300,
});

export const ContactResourceStore = signalStore(
  withState({ query: '' }),

  withProps(({ query }) => {
    const api = inject(ContactApi);
    const debounceMs = inject(CONTACT_SEARCH_DEBOUNCE_MS);

    // Leere Suche (Start, Feld geleert) sofort laden; beim Tippen erst nach der Pause.
    const debouncedQuery = debounced(query, (value) =>
      value === '' || debounceMs === 0 ? undefined : new Promise<void>((resolve) => setTimeout(resolve, debounceMs))
    );

    // `_` am Anfang: privat im Store, von außen (auch im Template) nicht erreichbar.
    const _contacts = api.contactsResource(debouncedQuery);

    // Letzter ECHTER Wert. Wird nur für die Anzeige gebraucht, solange die
    // Resource selbst keinen Wert hat (Fehler, Laden mit neuen Parametern).
    const _lastContacts = signal<Contact[] | undefined>(undefined);
    effect(() => {
      if (_contacts.hasValue()) _lastContacts.set(_contacts.value());
    });
    return { _contacts, _lastContacts };
  }),

  withComputed(({ _contacts, _lastContacts }) => ({
    /**
     * Aktueller Wert, sonst der zuletzt bekannte. Wirft nie.
     * hasValue() zuerst: dann sieht der Aufrufer set()/update() sofort, ohne auf den effect zu warten.
     */
    contacts: computed(() => (_contacts.hasValue() ? _contacts.value() : (_lastContacts() ?? []))),
    status: _contacts.status,
    isLoading: _contacts.isLoading,
    /** Erstes Laden (noch nie Daten gehabt) vs. Aktualisieren (alte Daten sichtbar). */
    isInitialLoading: computed(() => _contacts.isLoading() && !_contacts.hasValue() && _lastContacts() === undefined),
    error: computed(() => {
      const error = _contacts.error();
      return error ? toAppError(error) : null;
    }),
  })),

  withComputed(({ contacts, status }) => ({
    isEmpty: computed(() => status() === 'resolved' && contacts().length === 0),
    total: computed(() => contacts().length),
    favoriteCount: computed(() => contacts().filter((c) => c.favorite).length),
    sortedContacts: computed(() => sortContacts(contacts())),
  })),

  withMethods((store) => {
    const api = inject(ContactApi);
    const notifications = inject(NotificationService);
    const resource = store._contacts;

    async function optimistic(
      apply: (contacts: Contact[]) => Contact[],
      request: () => Promise<unknown>,
      failureMessage: string
    ): Promise<Result<void>> {
      // Nie resource.value() direkt: im Fehlerstatus würde das werfen.
      const previous = store.contacts();
      resource.set(apply(previous));
      try {
        await request();
        return ok(undefined);
      } catch (error) {
        const appError = toAppError(error);
        if (appError.kind === 'not-found' || appError.kind === 'conflict') {
          // Server-Stand hat sich geändert: der alte lokale Stand wäre auch falsch.
          resource.reload();
        } else {
          resource.set(previous);
        }
        notifications.notify(`${failureMessage} ${appError.userMessage}`, 'error');
        return fail(appError);
      }
    }

    return {
      search(query: string): void {
        patchState(store, { query });
      },

      /** "Erneut versuchen": die Resource lädt mit denselben Parametern neu. */
      retry(): void {
        resource.reload();
      },

      async add(contact: NewContact): Promise<Result<Contact>> {
        try {
          const created = await firstValueFrom(api.createContact(contact));
          resource.set([...store.contacts(), created]);
          return ok(created);
        } catch (error) {
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
  })
);
