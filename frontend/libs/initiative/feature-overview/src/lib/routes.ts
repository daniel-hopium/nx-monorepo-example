import { Routes } from '@angular/router';
import { OverviewView } from './overview/overview-view';

export const INITIATIVE_FEATURE_OVERVIEW_ROUTES: Routes = [
  // Übersicht (aktive Initiativen)
  { path: '', pathMatch: 'full', component: OverviewView },
  // Gleiche View, anderer Datenausschnitt: `archiviert` kommt aus den Routendaten.
  { path: 'archiv', component: OverviewView, data: { archiviert: true } },
];
