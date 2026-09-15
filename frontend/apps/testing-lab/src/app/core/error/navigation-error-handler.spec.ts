/**
 * NAVIGATION-ERROR-HANDLER TESTEN (mit echtem Router)
 *
 * `RouterTestingHarness` startet einen echten Router mit Test-Routen und
 * rendert die aktive Komponente. So testen wir das ganze Zusammenspiel:
 * Resolver wirft -> Handler -> RedirectCommand -> Fehlerseite.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router, withComponentInputBinding, withNavigationErrorHandler } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ErrorPage } from '../../pages/error-page';
import { USER_MESSAGES } from './app-error';
import { Logger } from './logger';
import { navigationErrorHandler } from './navigation-error-handler';

@Component({ template: 'Start' })
class Home {}

describe('navigationErrorHandler', () => {
  const logger = { error: vi.fn(), warn: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useValue: logger },
        provideRouter(
          [
            { path: '', component: Home },
            { path: 'fehler', component: ErrorPage },
            { path: 'kaputt', component: Home, resolve: { data: () => Promise.reject(new Error('Resolver kaputt')) } },
            {
              path: 'offline',
              component: Home,
              resolve: { data: () => Promise.reject(new HttpErrorResponse({ status: 0 })) },
            },
          ],
          withComponentInputBinding(),
          withNavigationErrorHandler(navigationErrorHandler)
        ),
      ],
    });
  });

  it('leitet bei einem Fehler im Resolver auf die Fehlerseite um und loggt', async () => {
    const harness = await RouterTestingHarness.create('/');

    await harness.navigateByUrl('/kaputt');

    expect(TestBed.inject(Router).url).toBe('/fehler?grund=unknown');
    expect(harness.routeNativeElement?.textContent).toContain(USER_MESSAGES.unknown);
    expect(logger.error).toHaveBeenCalledWith('Navigation zu /kaputt fehlgeschlagen', expect.anything());
  });

  it('der Grund wird als Query-Parameter an die Fehlerseite gegeben', async () => {
    const harness = await RouterTestingHarness.create('/');

    await harness.navigateByUrl('/offline');

    expect(harness.routeNativeElement?.textContent).toContain(USER_MESSAGES.offline);
  });
});
