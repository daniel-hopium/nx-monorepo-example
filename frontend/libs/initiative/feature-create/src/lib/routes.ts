import { Routes } from '@angular/router';
import { CreateView } from './create/create-view';
import { SummaryView } from './summary/summary-view';
import { InitiativeDraft } from './draft';

export const INITIATIVE_FEATURE_CREATE_ROUTES: Routes = [
  {
    path: '',
    // Der Entwurf lebt nur innerhalb dieses Features: Provider auf der
    // Eltern-Route statt providedIn: 'root'. Beide Kind-Views teilen sich
    // dieselbe Instanz, beim Verlassen des Features wird sie verworfen.
    providers: [InitiativeDraft],
    children: [
      { path: '', pathMatch: 'full', component: CreateView },
      { path: 'zusammenfassung', component: SummaryView },
    ],
  },
];
