import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskService } from '../data-access/task-service';

/**
 * Zweite Seite, damit es etwas zum Routen gibt.
 * Der Router-Test navigiert per RouterTestingHarness auf "/statistik" und
 * prüft, dass diese Komponente gerendert wird.
 */
@Component({
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Statistik</h1>
      <dl>
        <dt>Offen</dt>
        <dd data-testid="open">{{ taskService.openCount() }}</dd>
        <dt>Überfällig</dt>
        <dd data-testid="overdue">{{ taskService.overdueCount() }}</dd>
        <dt>Gesamt</dt>
        <dd data-testid="total">{{ taskService.tasks().length }}</dd>
      </dl>
      <a routerLink="/aufgaben">Zu den Aufgaben</a>
    </section>
  `,
  styles: `
    .card { background: #fff; border-radius: 6px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 1rem; font-size: 1.4rem; }
    dl { display: grid; grid-template-columns: 8rem 1fr; gap: 0.4rem; }
    dt { color: #57606a; }
    dd { margin: 0; font-weight: 600; }
  `,
})
export class StatsPage {
  protected readonly taskService = inject(TaskService);
}
