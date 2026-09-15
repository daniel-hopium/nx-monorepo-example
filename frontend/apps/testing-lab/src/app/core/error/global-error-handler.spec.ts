/**
 * GLOBALEN ERRORHANDLER TESTEN
 *
 * Der Handler ist eine normale Klasse mit DI. Wir prüfen:
 *   - wird geloggt (mit dem Originalfehler)?
 *   - sieht der Nutzer eine freundliche Meldung (Toast)?
 *   - wirft der Handler selbst nie, auch wenn der Toast kaputt ist?
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../data-access/notification-service';
import { USER_MESSAGES } from './app-error';
import { GlobalErrorHandler } from './global-error-handler';
import { Logger } from './logger';

describe('GlobalErrorHandler', () => {
  const logger = { error: vi.fn(), warn: vi.fn() };
  const notifications = { notify: vi.fn() };
  let handler: GlobalErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: Logger, useValue: logger },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('loggt den Originalfehler und zeigt eine allgemeine Meldung', () => {
    const error = new TypeError('Cannot read properties of undefined');

    handler.handleError(error);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('TypeError'),
      expect.objectContaining({ kind: 'unknown', original: error })
    );
    // Der Nutzer sieht NICHT "Cannot read properties…", sondern einen verständlichen Text.
    expect(notifications.notify).toHaveBeenCalledExactlyOnceWith(USER_MESSAGES.unknown, 'error');
  });

  it('bekannte Fehlerarten bekommen ihre passende Meldung', () => {
    handler.handleError(new HttpErrorResponse({ status: 0 }));
    expect(notifications.notify).toHaveBeenCalledWith(USER_MESSAGES.offline, 'error');
  });

  it('wirft nie, auch wenn die Anzeige selbst fehlschlägt', () => {
    notifications.notify.mockImplementationOnce(() => {
      throw new Error('Toast kaputt');
    });

    expect(() => handler.handleError(new Error('boom'))).not.toThrow();
    expect(logger.error).toHaveBeenCalledTimes(2); // Originalfehler + Anzeige-Fehler
  });
});
