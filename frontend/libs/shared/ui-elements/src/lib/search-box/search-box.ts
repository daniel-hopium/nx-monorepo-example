import { Component, input, model } from '@angular/core';

/**
 * Suchfeld mit Lupe. `value` ist ein `model()`, damit der Aufrufer
 * `[(value)]` binden kann. Die Suche läuft bei jeder Eingabe (kein
 * Enter nötig), das Debouncing übernimmt der Aufrufer bei Bedarf.
 */
@Component({
  selector: 'ds-search-box',
  template: `
    <div class="search">
      <span class="icon" aria-hidden="true">&#x1F50D;&#xFE0E;</span>
      <input
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
      />
    </div>
  `,
  styles: `
    .search { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid #d0d7de; border-radius: 999px; padding: 0.3rem 0.8rem; background: #fff; min-width: 240px; }
    .icon { color: #8c959f; font-size: 0.8rem; }
    input { border: 0; outline: 0; font: inherit; font-size: 0.85rem; width: 100%; background: transparent; }
  `,
})
export class SearchBox {
  readonly placeholder = input('Suchen');
  readonly value = model('');
}
