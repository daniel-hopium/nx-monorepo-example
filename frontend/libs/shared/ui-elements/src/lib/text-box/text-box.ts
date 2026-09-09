import { Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

/**
 * Beschriftetes Eingabefeld für Signal Forms.
 * Bekommt ein einzelnes `Field` (Blatt im FieldTree) und bindet es über die
 * `FormField`-Direktive an das native <input>. Die Komponente ist generisch,
 * damit string-, number- und date-Felder typsicher durchgereicht werden.
 * Fehler werden nach dem ersten Verlassen des Feldes (touched) angezeigt.
 */
let nextId = 0;

@Component({
  selector: 'ds-text-box',
  imports: [FormField],
  template: `
    <div class="field">
      <span class="label" [id]="labelId">{{ label() }}</span>
      @if (multiline()) {
        <!-- $any: textarea akzeptiert nur string-Felder, multiline wird nur dafür genutzt. -->
        <textarea rows="3" [formField]="$any(field())" [attr.aria-labelledby]="labelId"></textarea>
      } @else {
        <input [type]="type()" [formField]="field()" [attr.aria-labelledby]="labelId" />
      }
      @if (field()().touched() && field()().errors().length) {
        <span class="error">{{ field()().errors()[0].message }}</span>
      }
    </div>
  `,
  styles: `
    .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
    .label { color: #57606a; }
    input, textarea { font: inherit; padding: 0.45rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; }
    input:focus, textarea:focus { outline: 2px solid #1f4fbf33; border-color: #1f4fbf; }
    .error { color: #cf222e; font-size: 0.75rem; }
  `,
})
export class TextBox<T extends string | number | null> {
  // Eindeutige Id pro Instanz, damit aria-labelledby das richtige Label trifft.
  protected readonly labelId = `ds-text-box-${nextId++}`;
  readonly label = input.required<string>();
  readonly field = input.required<Field<T>>();
  readonly type = input<'text' | 'number' | 'date'>('text');
  readonly multiline = input(false);
}
