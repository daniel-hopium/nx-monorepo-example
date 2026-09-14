import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Button als ATTRIBUT-Komponente: `<button labButton variant="danger">Löschen</button>`.
 *
 * Warum kein `<lab-button>`? Ein eigenes Element wäre für den Browser kein
 * Button: keine Tastaturbedienung (Enter/Space), kein `disabled`, keine
 * Button-Rolle für Screenreader, kein Absenden von Formularen. Mit dem
 * Attribut-Selector bleibt das native <button> erhalten und wir ergänzen nur
 * Aussehen und Ladezustand.
 *
 * Testbar: Variante (CSS-Klasse), Ladezustand (disabled + aria-busy),
 * Content Projection (Text kommt vom Aufrufer), Klick/Tastatur.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Attribut-Selector ist hier Absicht (siehe oben)
  selector: 'button[labButton]',
  template: `
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  host: {
    '[class]': "'btn ' + variant()",
    // Während des Ladens nicht klickbar; aria-busy sagt Screenreadern, dass etwas passiert.
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.4rem; font: inherit; font-size: 0.85rem; padding: 0.45rem 1rem; border-radius: 999px; border: 1px solid transparent; cursor: pointer; }
    :host(.primary)   { background: #1f3a93; color: #fff; }
    :host(.secondary) { background: #fff; color: #24292f; border-color: #d0d7de; }
    :host(.danger)    { background: #fff; color: #b42318; border-color: #f04438; }
    :host(:disabled)  { opacity: 0.5; cursor: default; }
    :host(:focus-visible) { outline: 2px solid #1f3a93; outline-offset: 2px; }
    .spinner { width: 0.8rem; height: 0.8rem; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly loading = input(false);
  readonly disabled = input(false);
}
