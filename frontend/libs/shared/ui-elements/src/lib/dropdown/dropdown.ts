import { Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

/** Beschriftete Auswahlliste (<select>) für Signal Forms. */
@Component({
  selector: 'ds-dropdown',
  imports: [FormField],
  template: `
    <label class="field">
      <span class="label">{{ label() }}</span>
      <select [formField]="field()">
        <option value="">{{ placeholder() }}</option>
        @for (choice of choices(); track choice) {
          <option [value]="choice">{{ choice }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
    .label { color: #57606a; }
    select { font: inherit; padding: 0.45rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; background: #fff; }
    select:focus { outline: 2px solid #1f4fbf33; border-color: #1f4fbf; }
  `,
})
export class Dropdown<T extends string> {
  readonly label = input.required<string>();
  readonly field = input.required<Field<T>>();
  readonly choices = input.required<readonly string[]>();
  readonly placeholder = input('Bitte wählen');
}
