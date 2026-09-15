/**
 * HTTP-INTERCEPTOR TESTEN
 *
 * Aufbau: echter HttpClient MIT dem Interceptor, aber ohne Netzwerk.
 *   provideHttpClient(withInterceptors([httpErrorInterceptor]))
 *   provideHttpClientTesting()   -> Requests landen im HttpTestingController
 *
 * Der Test spielt den Server: `expectOne(url)` holt den offenen Request,
 * `flush(body, { status })` beantwortet ihn, auch mit Fehlerstatus.
 *
 * Retry mit Backoff heißt WARTEN. Statt echter Sekunden nutzen wir Fake Timers:
 * `vi.advanceTimersByTime(ms)` spult die Zeit vor. So prüfen wir auch, dass
 * der zweite Retry wirklich doppelt so lange wartet wie der erste.
 *
 * Logger und Config kommen per DI rein, also ersetzen wir sie im TestBed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppError } from './app-error';
import { HTTP_ERROR_CONFIG, httpErrorInterceptor, RETRIES, TIMEOUT_MS } from './http-error.interceptor';
import { Logger } from './logger';

const URL = '/api/contacts';
const serverError = { status: 500, statusText: 'Server Error' };

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const logger = { error: vi.fn(), warn: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: Logger, useValue: logger },
        { provide: HTTP_ERROR_CONFIG, useValue: { retries: 2, retryBaseDelayMs: 100, timeoutMs: 1000 } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  /** Startet einen Request und merkt sich Ergebnis bzw. Fehler. */
  function send(method: 'GET' | 'POST' | 'DELETE', context?: HttpContext) {
    const result: { value?: unknown; error?: unknown } = {};
    http.request(method, URL, { body: method === 'POST' ? { name: 'Ada' } : null, context }).subscribe({
      next: (value) => (result.value = value),
      error: (error) => (result.error = error),
    });
    return result;
  }

  it('lässt erfolgreiche Antworten unverändert durch', () => {
    const result = send('GET');
    backend.expectOne(URL).flush([{ id: 1 }]);

    expect(result.value).toEqual([{ id: 1 }]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('GET mit 500: wiederholt mit Exponential Backoff (100 ms, dann 200 ms)', () => {
    const result = send('GET');

    backend.expectOne(URL).flush(null, serverError); // Versuch 1
    vi.advanceTimersByTime(99);
    backend.expectNone(URL); // Backoff läuft noch
    vi.advanceTimersByTime(1);
    backend.expectOne(URL).flush(null, serverError); // Versuch 2

    vi.advanceTimersByTime(199);
    backend.expectNone(URL); // jetzt doppelt so lange warten
    vi.advanceTimersByTime(1);
    backend.expectOne(URL).flush([{ id: 1 }]); // Versuch 3 klappt

    expect(result.value).toEqual([{ id: 1 }]);
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('gibt nach allen Retries auf: AppError statt HttpErrorResponse, genau EIN Log-Eintrag', () => {
    const result = send('GET');

    backend.expectOne(URL).flush(null, serverError);
    vi.advanceTimersByTime(100);
    backend.expectOne(URL).flush(null, serverError);
    vi.advanceTimersByTime(200);
    backend.expectOne(URL).flush(null, serverError);

    expect(result.error).toBeInstanceOf(AppError);
    expect((result.error as AppError).kind).toBe('server');
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('offline (Status 0) wird ebenfalls wiederholt', () => {
    const result = send('GET');
    backend.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    vi.advanceTimersByTime(100);
    backend.expectOne(URL).flush([]);

    expect(result.value).toEqual([]);
  });

  it.each([403, 404, 422])('GET mit %i wird NICHT wiederholt (Warten ändert nichts)', (status) => {
    const result = send('GET');
    backend.expectOne(URL).flush(null, { status, statusText: 'x' });

    vi.advanceTimersByTime(10_000);
    backend.expectNone(URL);
    expect((result.error as AppError).status).toBe(status);
  });

  it.each(['POST', 'DELETE'] as const)('%s wird trotz 500 NICHT wiederholt (nicht idempotent)', (method) => {
    const result = send(method);
    backend.expectOne(URL).flush(null, serverError);

    vi.advanceTimersByTime(10_000);
    backend.expectNone(URL);
    expect((result.error as AppError).kind).toBe('server');
  });

  it('HttpContext RETRIES überschreibt die Voreinstellung pro Request', () => {
    const result = send('GET', new HttpContext().set(RETRIES, 0));
    backend.expectOne(URL).flush(null, serverError);

    vi.advanceTimersByTime(10_000);
    backend.expectNone(URL);
    expect(result.error).toBeInstanceOf(AppError);
  });

  it('Timeout bricht den hängenden Request ab und meldet "timeout"', () => {
    const result = send('GET', new HttpContext().set(TIMEOUT_MS, 500).set(RETRIES, 0));
    const request = backend.expectOne(URL);

    vi.advanceTimersByTime(500);

    expect(request.cancelled).toBe(true);
    expect((result.error as AppError).kind).toBe('timeout');
  });
});
