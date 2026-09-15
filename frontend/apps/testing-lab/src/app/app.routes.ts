import { Route } from '@angular/router';
import { ComponentsPage } from './pages/components-page';
import { ContactsPage } from './pages/contacts-page';
import { ContactsResourcePage } from './pages/contacts-resource-page';
import { ErrorPage } from './pages/error-page';
import { StatsPage } from './pages/stats-page';
import { TaskListPage } from './pages/task-list-page';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'aufgaben' },
  { path: 'aufgaben', component: TaskListPage },
  { path: 'statistik', component: StatsPage },
  { path: 'komponenten', component: ComponentsPage },
  { path: 'kontakte', component: ContactsPage },
  { path: 'kontakte-resource', component: ContactsResourcePage },
  { path: 'fehler', component: ErrorPage },
  {
    // Demo für den Navigation-Error-Handler: der Resolver wirft absichtlich.
    path: 'kaputt',
    component: ErrorPage,
    resolve: {
      data: () => {
        throw new Error('Resolver absichtlich kaputt');
      },
    },
  },
  { path: '**', redirectTo: 'aufgaben' },
];
