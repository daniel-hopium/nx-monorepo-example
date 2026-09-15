import { HttpContextToken, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';
import { toAppError } from './app-error';
import { Logger } from './logger';

/**
 * HTTP-Fehlerbehandlung für ALLE Requests an einer Stelle (Cross-Cutting Concern).
 *
 * Der Interceptor kümmert sich um das, was für jeden Request gleich ist:
 *   1. Timeout:   hängende Requests nach X ms abbrechen
 *   2. Retry:     vorübergehende Fehler (offline, 5xx, Timeout) automatisch wiederholen,
 *                 mit wachsender Wartezeit (Exponential Backoff),
 *                 aber NUR bei idempotenten Methoden (GET, HEAD, OPTIONS)
 *   3. Normalisieren: jeden Fehler in einen AppError übersetzen
 *   4. Loggen:    einmal, mit dem endgültigen Fehler (nicht pro Versuch)
 *
 * Was er bewusst NICHT tut: Toasts oder Dialoge zeigen. Ob ein Fehler inline,
 * als Toast oder gar nicht angezeigt wird, weiß nur der Aufrufer. Ein
 * Interceptor, der bei jedem Fehler einen Toast zeigt, erzeugt doppelte
 * Meldungen und nervt bei erwarteten Fehlern wie "E-Mail vergeben".
 *
 * Warum nur GET wiederholen? Ein POST "Kontakt anlegen", dessen Antwort
 * verloren ging, wurde vielleicht schon ausgeführt. Nochmal senden hieße:
 * zwei Kontakte. GET ändert nichts und darf beliebig oft laufen (idempotent).
 */

export type HttpErrorConfig = {
  /** Maximale Wiederholungen für idempotente Requests. */
  retries: number;
  /** Wartezeit vor dem 1. Retry; verdoppelt sich pro Versuch. */
  retryBaseDelayMs: number;
  timeoutMs: number;
};

export const HTTP_ERROR_CONFIG = new InjectionToken<HttpErrorConfig>('HTTP_ERROR_CONFIG', {
  providedIn: 'root',
  factory: () => ({ retries: 2, retryBaseDelayMs: 500, timeoutMs: 10_000 }),
});

/** Pro Request überschreibbar: `http.get(url, { context: new HttpContext().set(RETRIES, 0) })` */
export const RETRIES = new HttpContextToken<number | null>(() => null);
export const TIMEOUT_MS = new HttpContextToken<number | null>(() => null);

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(HTTP_ERROR_CONFIG);
  const logger = inject(Logger);

  const maxRetries = retriesFor(req, config);
  const timeoutMs = req.context.get(TIMEOUT_MS) ?? config.timeoutMs;

  return next(req).pipe(
    timeout(timeoutMs),
    retry({
      count: maxRetries,
      delay: (error, attempt) => {
        // Nur wiederholen, was sich durch Warten bessern kann.
        if (!toAppError(error).retryable) return throwError(() => error);
        logger.warn(`Retry ${attempt}/${maxRetries}: ${req.method} ${req.urlWithParams}`);
        return timer(config.retryBaseDelayMs * 2 ** (attempt - 1));
      },
    }),
    catchError((error: unknown) => {
      const appError = toAppError(error);
      logger.error(`${req.method} ${req.urlWithParams} fehlgeschlagen: ${appError.message}`, {
        kind: appError.kind,
        status: appError.status,
      });
      return throwError(() => appError);
    })
  );
};

function retriesFor(req: HttpRequest<unknown>, config: HttpErrorConfig): number {
  const explicit = req.context.get(RETRIES);
  if (explicit !== null) return explicit;
  return IDEMPOTENT_METHODS.has(req.method) ? config.retries : 0;
}

