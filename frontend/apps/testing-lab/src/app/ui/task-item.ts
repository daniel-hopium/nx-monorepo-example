import { Component, inject, input, output } from '@angular/core';
import { Clock } from '../data-access/clock';
import { isOverdue, Task } from '../data-access/task';
import { RelativeTimePipe } from '../util/relative-time-pipe';
import { PriorityBadge } from './priority-badge';

/**
 * Präsentationskomponente für eine Aufgabe.
 * Sie kennt keinen Service, der etwas ändert: Klicks werden als Outputs
 * nach oben gemeldet. So testet man sie isoliert: Input rein, Event raus.
 */
@Component({
  selector: 'lab-task-item',
  imports: [PriorityBadge, RelativeTimePipe],
  template: `
    <li class="item" [class.done]="task().done" [class.overdue]="overdue()">
      <label class="check">
        <input type="checkbox" [checked]="task().done" (change)="toggled.emit(task().id)" />
        <span class="title">{{ task().title }}</span>
      </label>
      <lab-priority-badge [priority]="task().priority" />
      <span class="due">{{ task().dueDate | relativeTime }}</span>
      <button type="button" class="remove" (click)="removed.emit(task().id)" [attr.aria-label]="'Löschen: ' + task().title">
        ✕
      </button>
    </li>
  `,
  styles: `
    .item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.25rem; border-bottom: 1px solid #eef0f2; list-style: none; }
    .check { display: flex; align-items: center; gap: 0.5rem; flex: 1; cursor: pointer; }
    .done .title { text-decoration: line-through; color: #8c959f; }
    .due { font-size: 0.8rem; color: #57606a; min-width: 6rem; }
    .overdue .due { color: #b42318; font-weight: 600; }
    .remove { border: 0; background: transparent; cursor: pointer; color: #8c959f; }
    .remove:hover { color: #b42318; }
  `,
})
export class TaskItem {
  private readonly clock = inject(Clock);

  readonly task = input.required<Task>();
  readonly toggled = output<string>();
  readonly removed = output<string>();

  protected overdue(): boolean {
    return isOverdue(this.task(), this.clock.now());
  }
}
