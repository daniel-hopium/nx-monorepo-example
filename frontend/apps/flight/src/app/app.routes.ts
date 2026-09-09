import { Route } from '@angular/router';

/**
 * Die App kennt nur die Einstiegspunkte der Features.
 * Jedes Feature bringt seine eigenen Routen mit und wird lazy geladen
 * (eigener Bundle-Chunk, erst beim ersten Aufruf heruntergeladen).
 */
export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'next-flights',
  },
  {
    path: 'next-flights',
    loadChildren: () => import('@monorepo/flight-feature-next-flights'),
  },
];
