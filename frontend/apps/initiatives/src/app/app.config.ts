import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ConfigurationService } from '@monorepo/shared-util';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: Routen-Daten (z. B. `archiviert`) landen
    // direkt in gleichnamigen input()-Signalen der Komponente.
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(),
    provideAppInitializer(() => inject(ConfigurationService).loadConfiguration()),
  ],
};
