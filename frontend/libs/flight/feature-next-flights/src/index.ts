import { FLIGHT_FEATURE_NEXT_FLIGHTS_ROUTES } from './lib/routes';

export { FLIGHT_FEATURE_NEXT_FLIGHTS_ROUTES };
// Default-Export, damit `loadChildren: () => import('@monorepo/...')` ohne `.then()` geht.
export default FLIGHT_FEATURE_NEXT_FLIGHTS_ROUTES;
