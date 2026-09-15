import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withNavigationErrorHandler } from '@angular/router';
import { appRoutes } from './app.routes';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { httpErrorInterceptor } from './core/error/http-error.interceptor';
import { navigationErrorHandler } from './core/error/navigation-error-handler';
import { mockBackendInterceptor } from './data-access/mock-backend.interceptor';

/**
 * Globale Fehlerbehandlung, drei Ebenen:
 *
 *  1. HTTP        httpErrorInterceptor: Timeout, Retry, AppError, Logging
 *  2. Navigation  withNavigationErrorHandler: kaputte Resolver/Guards/Lazy-Chunks -> /fehler
 *  3. Alles andere GlobalErrorHandler + provideBrowserGlobalErrorListeners:
 *                 unerwartete Exceptions und unbehandelte Promise-Rejections -> Log + Toast
 *
 * Erwartete Fehler (Validierung, 403 beim Löschen) behandelt der Aufrufer
 * selbst, sie erreichen Ebene 3 nie.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(appRoutes, withComponentInputBinding(), withNavigationErrorHandler(navigationErrorHandler)),
    // Reihenfolge zählt: der Error-Interceptor steht AUSSEN. Seine Retries
    // laufen dadurch erneut durch alles dahinter (hier: das Fake-Backend).
    provideHttpClient(withInterceptors([httpErrorInterceptor, mockBackendInterceptor])),
  ],
};
