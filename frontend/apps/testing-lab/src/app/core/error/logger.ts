import { Injectable } from '@angular/core';

/**
 * Zentrale Stelle für Fehlerprotokollierung.
 *
 * In einer echten App schickt diese Klasse Fehler an ein Monitoring-System
 * (z. B. Sentry, Datadog, Application Insights). Wichtig ist nur: niemand ruft
 * `console.error` direkt auf. So lässt sich das Ziel an EINER Stelle tauschen,
 * und Tests können den Logger mocken, statt die Konsole vollzuschreiben.
 */
@Injectable({ providedIn: 'root' })
export class Logger {
  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[App] ${message}`, context ?? '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[App] ${message}`, context ?? '');
  }
}
