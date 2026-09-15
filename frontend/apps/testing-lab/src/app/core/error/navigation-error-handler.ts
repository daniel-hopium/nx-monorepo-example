import { inject } from '@angular/core';
import { NavigationError, RedirectCommand, Router } from '@angular/router';
import { toAppError } from './app-error';
import { Logger } from './logger';

/**
 * Fehler beim Navigieren abfangen: z. B. ein Resolver, dessen Request scheitert,
 * ein Guard, der wirft, oder ein Lazy-Chunk, der nach einem Deployment nicht
 * mehr existiert ("ChunkLoadError").
 *
 * Ohne diesen Handler bleibt der Nutzer auf der alten Seite hängen und nichts
 * passiert. Mit ihm landet er auf einer Fehlerseite, die sagt, was los ist.
 *
 * Eingebunden über `provideRouter(routes, withNavigationErrorHandler(navigationErrorHandler))`.
 * Die Funktion läuft im Injection Context, deshalb funktioniert `inject()`.
 */
export function navigationErrorHandler(event: NavigationError): RedirectCommand {
  const router = inject(Router);
  const appError = toAppError(event.error);

  inject(Logger).error(`Navigation zu ${event.url} fehlgeschlagen`, {
    kind: appError.kind,
    original: event.error,
  });

  // browserUrl: Angezeigt wird /fehler, in der Adresszeile steht aber die URL,
  // die der Nutzer wollte. "Neu laden" versucht es dann erneut.
  // (skipLocationChange würde dagegen die VORHERIGE Seite in der Adresszeile lassen.)
  return new RedirectCommand(router.createUrlTree(['/fehler'], { queryParams: { grund: appError.kind } }), {
    browserUrl: event.url,
  });
}
