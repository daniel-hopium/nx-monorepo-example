import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ConfigurationService } from '@monorepo/shared-util';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    // Läuft vor dem ersten Rendern: die Backend-URL muss bekannt sein,
    // bevor irgendein Service sie liest.
    provideAppInitializer(() => inject(ConfigurationService).loadConfiguration()),
  ],
};
