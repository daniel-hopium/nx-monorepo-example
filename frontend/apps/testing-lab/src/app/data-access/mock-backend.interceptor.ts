import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, Observable, of, throwError } from 'rxjs';
import { Contact } from './contact';

/**
 * Fake-Backend für den Browser-Betrieb der Lern-App (NICHT für Tests).
 *
 * Die testing-lab-App hat kein echtes Backend. Dieser Interceptor fängt alle
 * Requests auf /api/contacts ab und beantwortet sie aus einem Array im Speicher,
 * mit künstlicher Verzögerung, damit Ladezustände sichtbar werden.
 * Alle anderen Requests (z. B. /tasks.json) laufen normal weiter.
 *
 * Die Tests nutzen diesen Interceptor nicht: dort übernimmt der
 * HttpTestingController bzw. eine gemockte ContactApi die Rolle des Servers.
 * Tipp zum Ausprobieren: einen Namen mit "fehler" anlegen erzeugt einen 500er.
 */
let contacts: Contact[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', company: 'Analytical Engines', favorite: true },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com', company: 'US Navy', favorite: false },
  { id: 3, name: 'Linus Torvalds', email: 'linus@example.com', company: 'Linux Foundation', favorite: false },
  { id: 4, name: 'Margaret Hamilton', email: 'margaret@example.com', company: 'NASA', favorite: true },
];

const LATENCY_MS = 400;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const match = req.url.match(/^\/api\/contacts(?:\/(\d+))?$/);
  if (!match) return next(req);

  const id = match[1] ? Number(match[1]) : null;
  const respond = <T>(body: T, status = 200): Observable<HttpResponse<T>> =>
    of(new HttpResponse({ status, body })).pipe(delay(LATENCY_MS));
  const fail = (status: number, message: string) =>
    throwError(() => new HttpErrorResponse({ status, statusText: message, url: req.url })).pipe(delay(LATENCY_MS));

  if (req.method === 'GET' && id === null) {
    const q = (req.params.get('q') ?? '').toLowerCase();
    const result = contacts.filter((c) =>
      [c.name, c.email, c.company].some((field) => field.toLowerCase().includes(q))
    );
    return respond(result);
  }

  if (req.method === 'POST' && id === null) {
    const body = req.body as Omit<Contact, 'id' | 'favorite'>;
    if (body.name.toLowerCase().includes('fehler')) return fail(500, 'Simulierter Serverfehler');
    const created: Contact = { ...body, id: Math.max(0, ...contacts.map((c) => c.id)) + 1, favorite: false };
    contacts = [...contacts, created];
    return respond(created, 201);
  }

  if (req.method === 'DELETE' && id !== null) {
    contacts = contacts.filter((c) => c.id !== id);
    return respond(null, 204);
  }

  if (req.method === 'PATCH' && id !== null) {
    const existing = contacts.find((c) => c.id === id);
    if (!existing) return fail(404, 'Not Found');
    const updated = { ...existing, ...(req.body as Partial<Contact>) };
    contacts = contacts.map((c) => (c.id === id ? updated : c));
    return respond(updated);
  }

  return fail(405, 'Method Not Allowed');
};
