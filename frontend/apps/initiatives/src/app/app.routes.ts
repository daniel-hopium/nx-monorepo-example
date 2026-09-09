import { Route } from '@angular/router';

/**
 * Die App kennt nur die Einstiegspunkte. Die Reihenfolge ist wichtig:
 * spezifischere Pfade (erstellen, archiv) müssen vor dem Catch-all der
 * Übersicht stehen, sonst greift der Router zuerst die Übersicht.
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
  // Platzhalter für die restlichen Hauptbereiche.
  { path: 'auswertung', redirectTo: 'initiativen' },
  { path: 'reporting', redirectTo: 'initiativen' },
  { path: '**', redirectTo: 'initiativen' },
];
