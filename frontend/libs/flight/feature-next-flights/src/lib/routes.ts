import { Routes } from '@angular/router';
import { NextFlightsView } from './next-flights/next-flights-view';

export const FLIGHT_FEATURE_NEXT_FLIGHTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: NextFlightsView,
  },
];
