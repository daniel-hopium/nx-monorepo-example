import { Routes } from '@angular/router';
import { DetailView } from './detail/detail-view';

export const INITIATIVE_FEATURE_DETAIL_ROUTES: Routes = [
  // Die :id kommt aus der Eltern-Route (initiativen/:id) und wird per
  // withComponentInputBinding in das gleichnamige input() der View geschrieben.
  { path: '', pathMatch: 'full', component: DetailView },
];
