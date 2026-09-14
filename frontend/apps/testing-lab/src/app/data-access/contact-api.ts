import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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
