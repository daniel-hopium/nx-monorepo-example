import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, Observable, of, switchMap, throwError, timer } from 'rxjs';
import { Contact } from './contact';

/**
 * Fake-Backend für den Browser-Betrieb der Lern-App (NICHT für Tests).
 *
 * Beantwortet /api/contacts aus einem Array im Speicher, mit künstlicher
 * Verzögerung, damit Ladezustände sichtbar werden. Alle anderen Requests
 * (z. B. /tasks.json) laufen normal weiter.
 *
 * Bestimmte Eingaben erzeugen absichtlich Fehler, um das Error Handling
 * auszuprobieren (Liste auch in der UI unter "Fehlerfälle ausprobieren"):
 *   Suche "fehler"   -> 500      Suche "offline" -> Status 0     Suche "langsam" -> 12 s
 *   E-Mail "vergeben@example.com" -> 422 mit Feldfehler
 *   Name mit "fehler" -> 500     Grace Hopper löschen -> 403
 *
 * In app.config.ts steht er HINTER dem Error-Interceptor. So durchlaufen die
 * simulierten Fehler dieselbe Retry- und Normalisierungslogik wie echte.
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
  const respond = <T>(body: T, status = 200, latency = LATENCY_MS): Observable<HttpResponse<T>> =>
    of(new HttpResponse({ status, body })).pipe(delay(latency));
  // NICHT throwError(...).pipe(delay(ms)): delay verzögert nur Werte, Fehler kämen sofort durch.
  // Erst warten, dann fehlschlagen.
  const fail = (status: number, body: unknown = null) =>
    timer(LATENCY_MS).pipe(switchMap(() => throwError(() => new HttpErrorResponse({ status, error: body, url: req.url }))));

  if (req.method === 'GET' && id === null) {
    const q = (req.params.get('q') ?? '').toLowerCase();
    if (q.includes('fehler')) return fail(500);
    if (q.includes('offline')) return fail(0);
    const result = contacts.filter((c) =>
      [c.name, c.email, c.company].some((field) => field.toLowerCase().includes(q))
    );
    return respond(result, 200, q.includes('langsam') ? 12_000 : LATENCY_MS);
  }

  if (req.method === 'POST' && id === null) {
    const body = req.body as Omit<Contact, 'id' | 'favorite'>;
    if (body.email.toLowerCase() === 'vergeben@example.com') {
      return fail(422, { message: 'Bitte die Eingaben prüfen.', errors: { email: 'Diese E-Mail ist bereits vergeben.' } });
    }
    if (body.name.toLowerCase().includes('fehler')) return fail(500);
    const created: Contact = { ...body, id: Math.max(0, ...contacts.map((c) => c.id)) + 1, favorite: false };
    contacts = [...contacts, created];
    return respond(created, 201);
  }

  if (req.method === 'DELETE' && id !== null) {
    if (contacts.find((c) => c.id === id)?.name === 'Grace Hopper') return fail(403);
    contacts = contacts.filter((c) => c.id !== id);
    return respond(null, 204);
  }

  if (req.method === 'PATCH' && id !== null) {
    const existing = contacts.find((c) => c.id === id);
    if (!existing) return fail(404);
    const updated = { ...existing, ...(req.body as Partial<Contact>) };
    contacts = contacts.map((c) => (c.id === id ? updated : c));
    return respond(updated);
  }

  return fail(405);
};
