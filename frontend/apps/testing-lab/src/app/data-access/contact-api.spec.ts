/**
 * API-SERVICE TESTEN (unterste Schicht)
 *
 * Frage dieses Tests: Schickt der Service die RICHTIGEN Requests?
 * Also URL, HTTP-Methode, Query-Parameter und Body. Logik gibt es hier keine.
 *
 * `provideHttpClientTesting()` ersetzt das Netzwerk. Jeder Request bleibt
 * offen hängen, bis der Test ihn mit `expectOne(...)` holt und mit `flush(...)`
 * beantwortet. Der Test spielt also den Server.
 *
 * Wichtig: Observables vom HttpClient sind KALT. Ohne subscribe (oder
 * firstValueFrom) wird gar kein Request geschickt, und expectOne schlägt fehl.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Contact } from './contact';
import { ContactApi } from './contact-api';

const ada: Contact = { id: 1, name: 'Ada', email: 'ada@example.com', company: 'AE', favorite: false };

describe('ContactApi', () => {
  let api: ContactApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ContactApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Schlägt fehl, wenn ein Test einen Request ausgelöst, aber nicht geprüft hat.
    http.verify();
  });

  describe('getContacts', () => {
    it('GET /api/contacts ohne Query-Parameter bei leerer Suche', async () => {
      const result = firstValueFrom(api.getContacts());

      // expectOne mit Funktion: prüft URL und dass KEIN ?q= dranhängt.
      const req = http.expectOne((r) => r.url === '/api/contacts');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('q')).toBe(false);

      req.flush([ada]);
      expect(await result).toEqual([ada]);
    });

    it('hängt die Suche als ?q= an', () => {
      api.getContacts('ada lo').subscribe();

      // urlWithParams enthält die kodierten Parameter, so wie sie über die Leitung gehen.
      const req = http.expectOne('/api/contacts?q=ada%20lo');
      expect(req.request.params.get('q')).toBe('ada lo');
      req.flush([]);
    });

    it('reicht HTTP-Fehler als Fehler im Observable weiter', async () => {
      const result = firstValueFrom(api.getContacts());

      http.expectOne('/api/contacts').flush('Boom', { status: 500, statusText: 'Server Error' });

      // `rejects` wartet auf das abgelehnte Promise und prüft den Fehler.
      await expect(result).rejects.toMatchObject({ status: 500 });
    });
  });

  it('createContact: POST mit dem neuen Kontakt als Body', async () => {
    const dto = { name: 'Grace', email: 'grace@example.com', company: 'Navy' };
    const result = firstValueFrom(api.createContact(dto));

    const req = http.expectOne({ method: 'POST', url: '/api/contacts' });
    expect(req.request.body).toEqual(dto);

    req.flush({ ...dto, id: 2, favorite: false }, { status: 201, statusText: 'Created' });
    expect(await result).toMatchObject({ id: 2, name: 'Grace' });
  });

  it('deleteContact: DELETE auf die Id', () => {
    api.deleteContact(7).subscribe();
    http.expectOne({ method: 'DELETE', url: '/api/contacts/7' }).flush(null, { status: 204, statusText: 'No Content' });
  });

  it('setFavorite: PATCH mit nur dem geänderten Feld', () => {
    api.setFavorite(3, true).subscribe();

    const req = http.expectOne({ method: 'PATCH', url: '/api/contacts/3' });
    expect(req.request.body).toEqual({ favorite: true });
    req.flush({ ...ada, id: 3, favorite: true });
  });

  it('ohne subscribe wird kein Request geschickt (kaltes Observable)', () => {
    api.getContacts('niemand'); // kein subscribe
    http.expectNone('/api/contacts?q=niemand');
  });
});
