import { ErrorHandler, inject, Injectable } from '@angular/core';
import { NotificationService } from '../../data-access/notification-service';
import { toAppError } from './app-error';
import { Logger } from './logger';

/**
 * Letztes Sicherheitsnetz für UNERWARTETE Fehler.
 *
 * Hier landet alles, was nirgends abgefangen wurde:
 *  - Exceptions in Event-Handlern, Lifecycle-Hooks, Effects, Templates
 *  - unbehandelte Promise-Rejections und `window.onerror`
 *    (dafür sorgt `provideBrowserGlobalErrorListeners()` in app.config.ts)
 *
 * Aufgabe: loggen und dem Nutzer EINE freundliche Meldung zeigen, statt dass
 * die App still kaputt ist. Erwartete Fehler (Validierung, 403 beim Löschen)
 * sollen hier gar nicht ankommen, die behandelt der Aufrufer selbst.
 *
 * Das Ersetzen erfolgt über DI: `{ provide: ErrorHandler, useClass: GlobalErrorHandler }`.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(Logger);
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    const appError = toAppError(error);

    // Den ORIGINALFEHLER mitloggen: nur er hat den Stacktrace, der beim Debuggen hilft.
    this.logger.error(`Unbehandelter Fehler: ${describe(error)}`, {
      kind: appError.kind,
      original: error,
    });

    try {
      this.notifications.notify(appError.userMessage, 'error');
    } catch (notifyError) {
      // Der ErrorHandler darf NIE selbst werfen, sonst droht eine Endlosschleife.
      this.logger.error('Fehlermeldung konnte nicht angezeigt werden', { notifyError });
    }
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
