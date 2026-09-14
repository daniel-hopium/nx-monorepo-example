import { Route } from '@angular/router';
import { ComponentsPage } from './pages/components-page';
import { StatsPage } from './pages/stats-page';
import { TaskListPage } from './pages/task-list-page';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'aufgaben' },
  { path: 'aufgaben', component: TaskListPage },
  { path: 'statistik', component: StatsPage },
  { path: 'komponenten', component: ComponentsPage },
  { path: '**', redirectTo: 'aufgaben' },
];
