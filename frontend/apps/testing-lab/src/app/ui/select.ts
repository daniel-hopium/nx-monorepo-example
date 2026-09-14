import { Component, input, model } from '@angular/core';

export type SelectOption = { value: string; label: string };

let nextId = 0;

/**
 * Wiederverwendbares Select mit Label und Two-Way-Binding.
 *
 * `value` ist ein `model()`. Der Aufrufer schreibt `[(value)]="filter"` und
 * Angular verbindet zwei Richtungen:
 *   Parent -> Select: `[value]`        (Signal im Parent ändert sich -> Auswahl springt)
 *   Select -> Parent: `(valueChange)`  (Nutzer wählt -> Signal im Parent ändert sich)
 * Der Test prüft BEIDE Richtungen getrennt, das ist der Kern eines
 * Two-Way-Binding-Tests.
 */
@Component({
  selector: 'lab-select',
  template: `
    <div class="field">
      <label [for]="id">{{ label() }}</label>
      <select [id]="id" [value]="value()" (change)="value.set($any($event.target).value)">
        @if (placeholder()) {
          <option value="">{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </div>
  `,
  styles: `
    .field { display: inline-flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #57606a; }
    select { font: inherit; font-size: 0.85rem; padding: 0.4rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; background: #fff; color: #24292f; }
  `,
})
export class Select {
  /** Eindeutige Id pro Instanz, damit <label for> das richtige <select> trifft. */
  protected readonly id = `lab-select-${nextId++}`;

  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input('');
  readonly value = model('');
}
