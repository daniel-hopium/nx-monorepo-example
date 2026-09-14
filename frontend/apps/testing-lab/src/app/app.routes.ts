import { Route } from '@angular/router';
import { ComponentsPage } from './pages/components-page';
import { ContactsPage } from './pages/contacts-page';
import { StatsPage } from './pages/stats-page';
import { TaskListPage } from './pages/task-list-page';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'aufgaben' },
  { path: 'aufgaben', component: TaskListPage },
  { path: 'statistik', component: StatsPage },
  { path: 'komponenten', component: ComponentsPage },
  { path: 'kontakte', component: ContactsPage },
  { path: '**', redirectTo: 'aufgaben' },
];
