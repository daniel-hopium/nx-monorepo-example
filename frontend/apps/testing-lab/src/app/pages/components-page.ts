import { Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../data-access/notification-service';
import { TaskService } from '../data-access/task-service';
import { Task } from '../data-access/task';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { Column, DataTable } from '../ui/data-table';
import { Select } from '../ui/select';
import { Tab, Tabs } from '../ui/tabs';

/**
 * Showcase aller Komponentenarten der Lern-App auf einer Seite.
 * Jede Komponente hat eigene Tests unter src/app/ui (*.spec.ts und
 * *.browser.spec.ts); diese Seite dient nur zum Anschauen und Ausprobieren.
 */
@Component({
  imports: [Alert, Button, ConfirmDialog, DataTable, Select, Tabs, Tab],
  template: `
    <section class="card">
      <h1>Komponenten</h1>

      <h2>Buttons</h2>
      <div class="row">
        <button labButton (click)="simulateSave()" [loading]="saving()">Speichern</button>
        <button labButton variant="secondary">Sekundär</button>
        <button labButton variant="danger" (click)="dialogOpen.set(true)">Löschen…</button>
        <button labButton variant="secondary" [disabled]="true">Deaktiviert</button>
      </div>

      <h2>Alerts</h2>
      <lab-alert kind="info" title="Hinweis">Die Daten werden alle 5 Minuten aktualisiert.</lab-alert>
      <lab-alert kind="success">Aufgabe gespeichert.</lab-alert>
      <lab-alert kind="warning" [dismissible]="true">Zwei Aufgaben sind überfällig.</lab-alert>
      <lab-alert kind="error" title="Fehler" [dismissible]="true">Server nicht erreichbar.</lab-alert>

      <h2>Toasts</h2>
      <div class="row">
        <button labButton variant="secondary" (click)="notifications.notify('Info-Toast')">Info-Toast</button>
        <button labButton variant="secondary" (click)="notifications.notify('Etwas ist schiefgelaufen', 'error')">
          Fehler-Toast
        </button>
      </div>

      <h2>Select und Tabelle</h2>
      <lab-select label="Priorität" placeholder="Alle" [options]="priorityOptions" [(value)]="priority" />
      <lab-data-table
        caption="Aufgaben"
        [columns]="columns"
        [rows]="rows()"
        emptyText="Keine Aufgaben mit dieser Priorität"
        (rowClick)="notifications.notify('Zeile: ' + $event.title)"
      />

      <h2>Tabs</h2>
      <lab-tabs ariaLabel="Beispiel-Reiter">
        <lab-tab label="Übersicht">Der erste Reiter ist anfangs aktiv.</lab-tab>
        <lab-tab label="Details">Pfeiltasten wechseln zwischen den Reitern.</lab-tab>
        <lab-tab label="Verlauf">Home und End springen an die Ränder.</lab-tab>
      </lab-tabs>
    </section>

    <lab-confirm-dialog
      title="Wirklich löschen?"
      confirmLabel="Löschen"
      [(open)]="dialogOpen"
      (confirmed)="notifications.notify('Gelöscht')"
    >
      Diese Aktion kann nicht rückgängig gemacht werden.
    </lab-confirm-dialog>
  `,
  styles: `
    .card { background: #fff; border-radius: 6px; padding: 1.25rem 1.5rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 1rem; font-size: 1.4rem; }
    h2 { font-size: 1rem; margin: 1.75rem 0 0.75rem; color: #57606a; border-bottom: 1px solid #eef0f2; padding-bottom: 0.3rem; }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    lab-data-table { display: block; margin-top: 0.75rem; }
  `,
})
export class ComponentsPage {
  protected readonly notifications = inject(NotificationService);
  private readonly taskService = inject(TaskService);

  protected readonly saving = signal(false);
  protected readonly dialogOpen = signal(false);
  protected readonly priority = signal('');

  protected readonly priorityOptions = [
    { value: 'hoch', label: 'Hoch' },
    { value: 'mittel', label: 'Mittel' },
    { value: 'niedrig', label: 'Niedrig' },
  ];

  protected readonly columns: Column<Task>[] = [
    { key: 'title', label: 'Titel', sortable: true },
    { key: 'priority', label: 'Priorität', sortable: true },
    { key: 'dueDate', label: 'Termin', sortable: true },
    { key: 'done', label: 'Erledigt' },
  ];

  protected readonly rows = computed(() => {
    const priority = this.priority();
    const tasks = this.taskService.tasks();
    return priority ? tasks.filter((t) => t.priority === priority) : tasks;
  });

  constructor() {
    if (this.taskService.tasks().length === 0) this.taskService.load();
  }

  protected simulateSave() {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.notifications.notify('Gespeichert');
    }, 1200);
  }
}
