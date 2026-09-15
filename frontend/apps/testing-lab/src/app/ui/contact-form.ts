import { Component, computed, input, output, signal } from '@angular/core';
import { email, FieldTree, form, FormField, required, submit, ValidationError } from '@angular/forms/signals';
import { Contact, NewContact } from '../data-access/contact';
import { Result } from '../core/error/result';
import { Button } from './button';

type FieldName = keyof NewContact;

let nextId = 0;

/**
 * Formular "Neuer Kontakt" mit Fehlerbehandlung auf drei Ebenen:
 *
 *  1. CLIENT-Validierung (sofort):     required, email
 *  2. SERVER-Feldfehler (nach Submit): 422 { errors: { email: '…vergeben' } }
 *                                       -> erscheint direkt am E-Mail-Feld
 *  3. SERVER-Formularfehler:            500, offline, 403 …
 *                                       -> erscheint als Meldung über dem Button
 *
 * Signal Forms `submit(form, action)` macht dabei die Arbeit:
 *  - markiert alle Felder als touched (Fehler werden sichtbar)
 *  - ruft `action` nur, wenn der Client-Teil gültig ist
 *  - setzt `submitting()` während die Aktion läuft (Button-Spinner, Doppelklick-Schutz)
 *  - hängt zurückgegebene Fehler an die Felder (mit fieldTree) bzw. an das Formular
 *
 * Die Komponente weiß nicht, WOHER gespeichert wird. Die `save`-Funktion kommt
 * als Input vom Aufrufer und liefert ein `Result`. So nutzen beide Kontakte-Seiten
 * dasselbe Formular mit unterschiedlichen Stores.
 */
@Component({
  selector: 'lab-contact-form',
  imports: [FormField, Button],
  template: `
    <form class="form" novalidate (submit)="onSubmit($event)">
      @for (field of fields; track field.name) {
        <div class="field">
          <label [for]="id(field.name)">{{ field.label }}</label>
          <input
            [id]="id(field.name)"
            [type]="field.type"
            [formField]="f[field.name]"
            [attr.aria-invalid]="errorOf(field.name) ? true : null"
            [attr.aria-describedby]="errorOf(field.name) ? id(field.name) + '-error' : null"
          />
          @if (errorOf(field.name); as message) {
            <span class="error" [id]="id(field.name) + '-error'">{{ message }}</span>
          }
        </div>
      }

      <button labButton type="submit" [loading]="f().submitting()">Anlegen</button>

      @if (formError(); as message) {
        <p class="form-error" role="alert">{{ message }}</p>
      }
    </form>
  `,
  styles: `
    .form { display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #57606a; }
    input { font: inherit; padding: 0.4rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; }
    input[aria-invalid='true'] { border-color: #f04438; }
    .error { color: #b42318; font-size: 0.75rem; max-width: 14rem; }
    button { margin-top: 1.15rem; }
    .form-error { flex-basis: 100%; margin: 0; color: #b42318; font-size: 0.85rem; }
  `,
})
export class ContactForm {
  readonly save = input.required<(contact: NewContact) => Promise<Result<Contact>>>();
  readonly created = output<Contact>();

  private readonly uid = nextId++;
  protected readonly fields: { name: FieldName; label: string; type: string }[] = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'email', label: 'E-Mail', type: 'email' },
    { name: 'company', label: 'Firma', type: 'text' },
  ];

  private readonly model = signal<NewContact>({ name: '', email: '', company: '' });

  protected readonly f = form(this.model, (c) => {
    required(c.name, { message: 'Name ist Pflicht' });
    required(c.email, { message: 'E-Mail ist Pflicht' });
    email(c.email, { message: 'Keine gültige E-Mail-Adresse' });
  });

  /** Erste Fehlermeldung eines Feldes, aber erst nachdem der Nutzer es berührt hat. */
  protected errorOf(name: FieldName): string | undefined {
    const state = this.f[name]();
    return state.touched() ? state.errors()[0]?.message : undefined;
  }

  /** Fehler, die am Formular selbst hängen (Server-Fehler ohne Feldbezug). */
  protected readonly formError = computed(() => this.f().errors()[0]?.message);

  protected id(name: FieldName): string {
    return `lab-contact-${this.uid}-${name}`;
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.f, async (form) => {
      const result = await this.save()(this.model());

      if (result.ok) {
        this.created.emit(result.value);
        this.model.set({ name: '', email: '', company: '' });
        form().reset();
        return undefined; // keine Fehler
      }

      const { error } = result;

      // 422: Feldfehler an die passenden Felder hängen.
      const fieldErrors = Object.entries(error.fieldErrors)
        // Nicht `field in form`: der FieldTree ist ein Proxy, `in` liefert dort false.
        .filter((entry): entry is [FieldName, string] => this.fields.some((f) => f.name === entry[0]))
        .map(([field, message]) => serverError(message, form[field]));

      // Kein Feldbezug (500, offline, 403 …): Fehler ans ganze Formular.
      return fieldErrors.length > 0 ? fieldErrors : serverError(error.userMessage, form);
    });
  }
}

function serverError(message: string, fieldTree: FieldTree<unknown>): ValidationError.WithOptionalFieldTree {
  return { kind: 'server', message, fieldTree };
}
