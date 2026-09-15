import { AppError } from './app-error';

/**
 * Ergebnis eines Befehls (anlegen, löschen …) als Wert statt als Exception.
 *
 * Warum nicht einfach werfen? Ein erwarteter Fehler (E-Mail vergeben, keine
 * Berechtigung) ist kein Ausnahmefall, sondern ein normales Ergebnis, auf das
 * die UI reagieren MUSS. Mit `Result` erzwingt TypeScript die Prüfung:
 * `if (result.ok) { result.value } else { result.error }`.
 * Ein vergessenes try/catch fällt dagegen erst zur Laufzeit auf.
 *
 * Unerwartete Fehler (Bugs) werden weiterhin geworfen und landen beim
 * globalen ErrorHandler.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(error: AppError): Result<T> => ({ ok: false, error });
