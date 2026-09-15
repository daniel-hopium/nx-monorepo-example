import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Injectable, Resource } from '@angular/core';
import { Observable } from 'rxjs';
import { Contact, NewContact } from './contact';

/**
 * Datenzugriff (Data Access) für Kontakte: NUR HTTP, keine Logik, kein Zustand.
 *
 * Diese Trennung ist der Schlüssel zum einfachen Testen:
 *  - Der API-Service wird mit HttpTestingController getestet: stimmen URL,
 *    Methode, Parameter und Body? (contact-api.spec.ts)
 *  - Der Store wird mit einer GEMOCKTEN API getestet: stimmt die Logik?
 *    (contact-store.spec.ts) Dort gibt es gar kein HTTP.
 *
 * Die Methoden liefern Observables (kalt): der Request startet erst beim
 * Subscribe. Der Store entscheidet, wann und wie (switchMap, firstValueFrom).
 */
@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/contacts';

  /**
   * RESOURCE-VARIANTE des Lesens (für ContactResourceStore).
   *
   * `httpResource` lädt automatisch neu, sobald sich ein gelesenes Signal ändert,
   * und bricht den alten Request dabei ab (wie switchMap, nur eingebaut).
   * Es läuft über denselben HttpClient, also auch durch den Error-Interceptor.
   *
   * `ctx.chain(query)` hängt diese Resource an die (entprellte) Such-Resource:
   * Solange die Suche noch "wartet", ist auch diese Resource im Status loading.
   * Wirft die Such-Resource einen Fehler, übernimmt diese ihn.
   *
   * Muss im Injection Context aufgerufen werden (z. B. in withProps eines Stores),
   * weil httpResource sich an dessen Lebensdauer bindet.
   */
  contactsResource(query: Resource<string>): HttpResourceRef<Contact[] | undefined> {
    return httpResource<Contact[]>((ctx) => {
      const q = ctx.chain(query);
      // Expliziter Typ: sonst inferiert TS `{ q?: undefined }` und httpResource lehnt ab.
      const params: Record<string, string> = q ? { q } : {};
      return { url: this.baseUrl, params };
    });
  }

  getContacts(query = ''): Observable<Contact[]> {
    // Leere Suche nicht als ?q= mitschicken, das hält die URL sauber.
    const params = query ? { q: query } : undefined;
    return this.http.get<Contact[]>(this.baseUrl, { params });
  }

  createContact(contact: NewContact): Observable<Contact> {
    return this.http.post<Contact>(this.baseUrl, contact);
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setFavorite(id: number, favorite: boolean): Observable<Contact> {
    return this.http.patch<Contact>(`${this.baseUrl}/${id}`, { favorite });
  }
}
