import { Route } from '@angular/router';

/**
 * Die App kennt nur die Einstiegspunkte. Die Reihenfolge ist wichtig:
 * feste Pfade (erstellen) stehen vor Pfaden mit Parametern (:id), sonst
 * würde "erstellen" als Id interpretiert. "initiativen/archiv" ist ein
 * Kind der Übersicht und wird deshalb vor ":id" gefunden.
 */
export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'initiativen' },
  {
    path: 'initiativen/erstellen',
    loadChildren: () => import('@monorepo/initiative-feature-create'),
  },
  {
    path: 'initiativen',
    loadChildren: () => import('@monorepo/initiative-feature-overview'),
  },
  {
    // Bearbeiten nutzt dasselbe Feature wie Erstellen, nur mit geladener Id.
    path: 'initiativen/:id/bearbeiten',
    loadChildren: () => import('@monorepo/initiative-feature-create'),
  },
  {
    path: 'initiativen/:id',
    loadChildren: () => import('@monorepo/initiative-feature-detail'),
  },
  // Platzhalter für die restlichen Hauptbereiche.
  { path: 'auswertung', redirectTo: 'initiativen' },
  { path: 'reporting', redirectTo: 'initiativen' },
  { path: '**', redirectTo: 'initiativen' },
];
