import { Component, input, model } from '@angular/core';

/**
 * Aufklappbarer Abschnitt (Accordion). `expanded` ist ein `model()`,
 * also Two-Way-bindbar: der Aufrufer kann den Zustand lesen und setzen,
 * die Komponente selbst kann ihn per Klick umschalten.
 */
@Component({
  selector: 'ds-accordion-section',
  template: `
    <section class="section" [class.open]="expanded()">
      <button type="button" class="header" (click)="expanded.set(!expanded())" [attr.aria-expanded]="expanded()">
        <span class="title">{{ title() }}</span>
        <span class="meta">
          @if (counter()) {
            <span class="counter">{{ counter() }}</span>
          }
          <span class="chevron" aria-hidden="true">⌄</span>
        </span>
      </button>
      @if (expanded()) {
        <div class="body"><ng-content /></div>
      }
    </section>
  `,
  styles: `
    .section { border-bottom: 1px solid #e6e8eb; }
    .header { width: 100%; display: flex; justify-content: space-between; align-items: center; background: transparent; border: 0; padding: 0.7rem 0; cursor: pointer; font: inherit; color: inherit; }
    .title { font-size: 1.15rem; font-weight: 500; }
    .meta { display: flex; align-items: center; gap: 0.75rem; color: #57606a; font-size: 0.85rem; }
    .chevron { display: inline-block; transition: transform 0.15s; font-size: 1.1rem; line-height: 0; }
    .open .chevron { transform: rotate(180deg); }
    .body { padding: 0.25rem 0 1.25rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 1.5rem; }
  `,
})
export class AccordionSection {
  readonly title = input.required<string>();
  readonly counter = input<string>('');
  readonly expanded = model(false);
}
