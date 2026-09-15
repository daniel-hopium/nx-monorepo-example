/**
 * REINE FUNKTION TESTEN: toAppError
 *
 * Kein TestBed, kein DOM: Eingabe rein, Ergebnis prüfen. Das ist die billigste
 * und schnellste Testart. Darum steckt die Fehler-Übersetzung bewusst in einer
 * reinen Funktion und nicht im Interceptor.
 *
 * `it.each` macht aus EINER Testbeschreibung viele Fälle (Tabelle). Ideal, wenn
 * dieselbe Regel für viele Eingaben gilt, hier: HTTP-Status -> Fehlerart.
 */
import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { AppError, AppErrorKind, isAppError, toAppError, USER_MESSAGES } from './app-error';

const http = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error, url: '/api/x' });

describe('toAppError', () => {
  it.each<[number, AppErrorKind, boolean]>([
    [0, 'offline', true],
    [400, 'validation', false],
    [401, 'unauthorized', false],
    [403, 'forbidden', false],
    [404, 'not-found', false],
    [409, 'conflict', false],
    [418, 'unknown', false],
    [422, 'validation', false],
    [429, 'server', true],
    [500, 'server', true],
    [503, 'server', true],
  ])('HTTP %i -> kind "%s", retryable %s', (status, kind, retryable) => {
    const error = toAppError(http(status));

    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
    expect(error.retryable).toBe(retryable);
    expect(error.userMessage).toBe(USER_MESSAGES[kind]);
  });

  it('TimeoutError aus rxjs wird zu "timeout" und darf wiederholt werden', () => {
    const error = toAppError(new TimeoutError());
    expect(error.kind).toBe('timeout');
    expect(error.retryable).toBe(true);
  });

  it('422: Servermeldung und Feldfehler werden übernommen, ungültige Einträge ignoriert', () => {
    const error = toAppError(
      http(422, { message: 'Bitte prüfen', errors: { email: 'vergeben', age: 42, name: 'fehlt' } })
    );

    expect(error.userMessage).toBe('Bitte prüfen');
    expect(error.fieldErrors).toEqual({ email: 'vergeben', name: 'fehlt' });
  });

  it('kaputter Fehler-Body (String statt Objekt) führt nicht zum Absturz', () => {
    const error = toAppError(http(422, '<html>Bad Gateway</html>'));
    expect(error.fieldErrors).toEqual({});
    expect(error.userMessage).toBe(USER_MESSAGES.validation);
  });

  it('409: die Servermeldung ist für Nutzer gedacht und wird angezeigt', () => {
    expect(toAppError(http(409, { message: 'Von Ada geändert' })).userMessage).toBe('Von Ada geändert');
  });

  it('500: eine technische Servermeldung wird NICHT angezeigt', () => {
    expect(toAppError(http(500, { message: 'NullPointerException' })).userMessage).toBe(USER_MESSAGES.server);
  });

  it.each([new Error('boom'), 'nur ein String', undefined])('beliebige Werte (%s) werden "unknown"', (value) => {
    const error = toAppError(value);
    expect(error.kind).toBe('unknown');
    expect(error.cause).toBe(value); // Original bleibt fürs Logging erhalten
  });

  it('ein AppError bleibt derselbe (idempotent, keine doppelte Verpackung)', () => {
    const original = new AppError('forbidden');
    expect(toAppError(original)).toBe(original);
    expect(isAppError(original)).toBe(true);
    expect(isAppError(new Error())).toBe(false);
  });

  it('die technische message enthält Art und Status, fürs Log', () => {
    expect(toAppError(http(503)).message).toBe('[server] HTTP 503');
  });
});
