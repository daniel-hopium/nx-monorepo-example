import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { mockBackendInterceptor } from './data-access/mock-backend.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    // Fake-Backend für /api/contacts, nur im laufenden Betrieb (siehe Interceptor).
    provideHttpClient(withInterceptors([mockBackendInterceptor])),
  ],
};
