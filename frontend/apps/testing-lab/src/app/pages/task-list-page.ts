import { Component, computed, inject, signal } from '@angular/core';
import { TaskService } from '../data-access/task-service';
import { filterTasks, sortTasks, TaskFilter } from '../data-access/task';
import { NewTask, TaskForm } from '../ui/task-form';
import { TaskItem } from '../ui/task-item';

/**
 * Smart Component: verbindet Service und UI.
 * Im Test wird der TaskService komplett durch ein Objekt mit Signalen und
 * vi.fn()-Methoden ersetzt. So testet man die Seite, ohne HTTP oder echten Store.
 */
@Component({
  imports: [TaskForm, TaskItem],
  template: `
    <section class="card">
      <h1>Aufgaben</h1>
      <lab-task-form (created)="onCreated($event)" />

      <div class="toolbar">
        <label>
          Filter
          <select [value]="filter()" (change)="filter.set($any($event.target).value)">
            <option value="alle">Alle</option>
            <option value="offen">Offen</option>
            <option value="erledigt">Erledigt</option>
          </select>
        </label>
        <span class="count">{{ visible().length }} von {{ taskService.tasks().length }}</span>
      </div>

      @if (taskService.loading()) {
        <p>Lade Aufgaben…</p>
      } @else {
        <ul class="list">
          @for (task of visible(); track task.id) {
            <lab-task-item
              [task]="task"
              (toggled)="taskService.toggle($event)"
              (removed)="taskService.remove($event)"
            />
          } @empty {
            <li class="empty">Keine Aufgaben.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .card { background: #fff; border-radius: 6px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 1rem; font-size: 1.4rem; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin: 1.25rem 0 0.5rem; font-size: 0.85rem; color: #57606a; }
    select { font: inherit; margin-left: 0.4rem; padding: 0.25rem 0.4rem; }
    .list { margin: 0; padding: 0; }
    .empty { list-style: none; color: #8c959f; padding: 1rem 0; }
  `,
})
export class TaskListPage {
  protected readonly taskService = inject(TaskService);
  protected readonly filter = signal<TaskFilter>('alle');

  protected readonly visible = computed(() =>
    sortTasks(filterTasks(this.taskService.tasks(), this.filter()))
  );

  constructor() {
    this.taskService.load();
  }

  protected onCreated(task: NewTask) {
    this.taskService.add(task.title, task.priority, task.dueDate || null);
  }
}
