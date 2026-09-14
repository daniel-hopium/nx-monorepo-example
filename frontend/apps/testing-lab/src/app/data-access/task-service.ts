import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { generateId } from '../util/id';
import { Clock } from './clock';
import { NotificationService } from './notification-service';
import { isOverdue, Priority, Task, validateTitle } from './task';

/**
 * Zustand + Datenzugriff für Aufgaben (ein kleiner "Store").
 *
 * Der Service hat drei Abhängigkeiten, die im Test jeweils anders behandelt
 * werden:
 *  - HttpClient       -> HttpTestingController fängt Requests ab und antwortet selbst
 *  - Clock            -> per useValue durch eine feste Uhr ersetzt
 *  - NotificationService -> per vi.spyOn beobachtet oder komplett gemockt
 *  - generateId (Modul-Import, keine DI) -> per vi.mock ersetzt
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly clock = inject(Clock);
  private readonly notifications = inject(NotificationService);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);

  /** Nur lesbar nach außen: Konsumenten sollen über Methoden ändern, nicht direkt. */
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly openCount = computed(() => this._tasks().filter((t) => !t.done).length);
  readonly overdueCount = computed(
    () => this._tasks().filter((t) => isOverdue(t, this.clock.now())).length
  );

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const tasks = await firstValueFrom(this.http.get<Task[]>('/tasks.json'));
      this._tasks.set(tasks);
    } catch {
      this.notifications.notify('Aufgaben konnten nicht geladen werden', 'error');
    } finally {
      this._loading.set(false);
    }
  }

  add(title: string, priority: Priority, dueDate: string | null = null): Task {
    const task: Task = {
      id: generateId(),
      title: validateTitle(title),
      priority,
      done: false,
      dueDate,
    };
    this._tasks.update((list) => [...list, task]);
    this.notifications.notify(`"${task.title}" angelegt`);
    return task;
  }

  toggle(id: string): void {
    this._tasks.update((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  remove(id: string): void {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }
}
