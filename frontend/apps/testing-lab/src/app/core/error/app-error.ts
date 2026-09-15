import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

/**
 * EIN Fehlertyp für die ganze App.
 *
 * Warum? Ohne ein gemeinsames Modell muss jede Komponente selbst wissen, wie ein
 * HttpErrorResponse aussieht, was Status 0 bedeutet oder wo die Feldfehler im
 * Body stehen. Das führt zu doppeltem Code und uneinheitlichen Meldungen.
 *
 * Stattdessen: Fehler werden an EINER Stelle (dem HTTP-Interceptor bzw. dem
 * globalen ErrorHandler) in `AppError` übersetzt. Alles darüber arbeitet nur
 * noch mit `kind`, `userMessage`, `retryable` und `fieldErrors`.
 *
 * `toAppError` ist eine reine Funktion: leicht zu testen, ohne Angular.
 */
export type AppErrorKind =
  | 'offline' //     keine Verbindung, Status 0
  | 'timeout' //     Server antwortet nicht rechtzeitig
  | 'unauthorized' // 401: nicht angemeldet
  | 'forbidden' //   403: angemeldet, aber nicht berechtigt
  | 'not-found' //   404
  | 'conflict' //    409: z. B. gleichzeitig bearbeitet
  | 'validation' //  400/422: Eingaben vom Server abgelehnt
  | 'server' //      5xx und 429: Problem auf Serverseite
  | 'unknown'; //    alles andere, z. B. Programmierfehler

/** Texte für Nutzer: verständlich, ohne Technik, mit Hinweis was man tun kann. */
export const USER_MESSAGES: Record<AppErrorKind, string> = {
  offline: 'Keine Verbindung. Bitte Internetverbindung prüfen.',
  timeout: 'Der Server antwortet nicht. Bitte später erneut versuchen.',
  unauthorized: 'Bitte erneut anmelden.',
  forbidden: 'Dafür fehlt die Berechtigung.',
  'not-found': 'Der Eintrag existiert nicht mehr.',
  conflict: 'Der Eintrag wurde inzwischen geändert. Bitte neu laden.',
  validation: 'Bitte die Eingaben prüfen.',
  server: 'Auf dem Server ist ein Fehler aufgetreten. Bitte später erneut versuchen.',
  unknown: 'Ein unerwarteter Fehler ist aufgetreten.',
};

/** Nur diese Fehler lohnen einen erneuten Versuch. Ein 403 wird nicht besser, wenn man es nochmal probiert. */
const RETRYABLE_KINDS: ReadonlySet<AppErrorKind> = new Set(['offline', 'timeout', 'server']);

export class AppError extends Error {
  override readonly name = 'AppError';

  constructor(
    readonly kind: AppErrorKind,
    options: {
      status?: number;
      /** Meldung vom Server, wenn sie für Nutzer taugt (z. B. bei 409 oder 422). */
      serverMessage?: string;
      /** Feld -> Meldung, z. B. { email: 'E-Mail ist bereits vergeben' } */
      fieldErrors?: Record<string, string>;
      cause?: unknown;
    } = {}
  ) {
    // Die technische message landet im Log, nicht in der UI.
    super(`[${kind}]${options.status ? ` HTTP ${options.status}` : ''} ${options.serverMessage ?? ''}`.trim(), {
      cause: options.cause,
    });
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.userMessage = options.serverMessage ?? USER_MESSAGES[kind];
  }

  readonly status: number | undefined;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly userMessage: string;

  get retryable(): boolean {
    return RETRYABLE_KINDS.has(this.kind);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Erwartete Form eines Fehler-Bodys vom Backend (z. B. RFC 7807 "Problem Details", vereinfacht). */
type ErrorBody = { message?: unknown; errors?: unknown };

/**
 * Übersetzt JEDEN Fehler in einen AppError. Wirft selbst nie.
 * `unknown` als Parametertyp: in JavaScript kann alles geworfen werden, auch Strings.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof TimeoutError) {
    return new AppError('timeout', { cause: error });
  }

  if (error instanceof HttpErrorResponse) {
    const body = (typeof error.error === 'object' && error.error !== null ? error.error : {}) as ErrorBody;
    const serverMessage = typeof body.message === 'string' ? body.message : undefined;
    const status = error.status;
    const base = { status, cause: error };

    if (status === 0) return new AppError('offline', base);
    if (status === 401) return new AppError('unauthorized', base);
    if (status === 403) return new AppError('forbidden', base);
    if (status === 404) return new AppError('not-found', base);
    if (status === 409) return new AppError('conflict', { ...base, serverMessage });
    if (status === 400 || status === 422) {
      return new AppError('validation', { ...base, serverMessage, fieldErrors: parseFieldErrors(body.errors) });
    }
    if (status === 429 || status >= 500) return new AppError('server', base);
    return new AppError('unknown', base);
  }

  return new AppError('unknown', { cause: error });
}

/** Nimmt nur { feld: 'Meldung' }-Paare mit Strings an; alles andere wird ignoriert statt zu crashen. */
function parseFieldErrors(errors: unknown): Record<string, string> {
  if (typeof errors !== 'object' || errors === null) return {};
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}
