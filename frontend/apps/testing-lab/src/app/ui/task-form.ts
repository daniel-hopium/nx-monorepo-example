import { Component, output, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { PRIORITIES, Priority } from '../data-access/task';

export type NewTask = { title: string; priority: Priority; dueDate: string };

/**
 * Formular zum Anlegen einer Aufgabe (Signal Forms).
 *
 * Auch dieses Formular ist "dumm": es meldet per Output, was eingegeben
 * wurde, und speichert nichts selbst. Der Browser-Test tippt echte Werte,
 * klickt und prüft Validierungsmeldung und Output.
 */
@Component({
  selector: 'lab-task-form',
  imports: [FormField],
  template: `
    <form class="form" (submit)="submit($event)">
      <label>
        <span>Titel</span>
        <input [formField]="f.title" placeholder="Was ist zu tun?" />
        @if (f.title().touched() && f.title().errors().length) {
          <span class="error" role="alert">{{ f.title().errors()[0].message }}</span>
        }
      </label>
      <label>
        <span>Priorität</span>
        <select [formField]="f.priority">
          @for (p of priorities; track p) {
            <option [value]="p">{{ p }}</option>
          }
        </select>
      </label>
      <label>
        <span>Termin</span>
        <input type="date" [formField]="f.dueDate" />
      </label>
      <button type="submit" [disabled]="!f().valid()">Hinzufügen</button>
    </form>
  `,
  styles: `
    .form { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #57606a; }
    input, select { font: inherit; padding: 0.4rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; }
    button { font: inherit; padding: 0.45rem 1rem; border-radius: 999px; border: 0; background: #1f3a93; color: #fff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
    .error { color: #b42318; font-size: 0.75rem; }
  `,
})
export class TaskForm {
  readonly created = output<NewTask>();
  protected readonly priorities = PRIORITIES;

  private readonly model = signal<NewTask>({ title: '', priority: 'mittel', dueDate: '' });

  protected readonly f = form(this.model, (t) => {
    required(t.title, { message: 'Titel ist Pflicht' });
    minLength(t.title, 3, { message: 'Mindestens 3 Zeichen' });
  });

  protected submit(event: Event) {
    event.preventDefault();
    if (!this.f().valid()) return;
    this.created.emit({ ...this.model() });
    this.model.set({ title: '', priority: 'mittel', dueDate: '' });
    this.f().reset();
  }
}
