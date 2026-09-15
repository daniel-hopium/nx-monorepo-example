import { Component, computed, input, output } from '@angular/core';
import { AppError } from '../core/error/app-error';
import { Button } from './button';

/**
 * Einheitliche Fehleranzeige für Bereiche, die Daten laden (Liste, Detail, Kachel).
 *
 * - zeigt die NUTZER-Meldung aus dem AppError, nie die technische
 * - bietet "Erneut versuchen" nur an, wenn das sinnvoll ist (error.retryable)
 * - `role="alert"`: Screenreader lesen den Fehler sofort vor
 * - `compact`: Variante für "alte Daten sind noch sichtbar, aber Aktualisieren schlug fehl"
 *
 * Präsentationskomponente: kennt weder Store noch Resource. Das Neu-Laden
 * meldet sie per Output, der Aufrufer entscheidet, was "erneut" heißt.
 */
@Component({
  selector: 'lab-error-state',
  imports: [Button],
  template: `
    <div class="error-state" [class.compact]="compact()" role="alert">
      <span class="icon" aria-hidden="true">!</span>
      <div class="body">
        <strong class="title">{{ title() }}</strong>
        <p class="message">{{ error().userMessage }}</p>
      </div>
      @if (canRetry()) {
        <button labButton variant="secondary" type="button" [loading]="retrying()" (click)="retry.emit()">
          Erneut versuchen
        </button>
      }
    </div>
  `,
  styles: `
    .error-state { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 1px solid #fda29b; background: #fef3f2; color: #b42318; border-radius: 6px; margin: 0.75rem 0; }
    .compact { padding: 0.5rem 0.75rem; }
    .icon { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: #b42318; color: #fff; font-weight: 700; flex-shrink: 0; }
    .body { flex: 1; }
    .title { display: block; }
    .message { margin: 0.15rem 0 0; font-size: 0.85rem; }
    .compact .title { display: none; }
  `,
})
export class ErrorState {
  readonly error = input.required<AppError>();
  readonly title = input('Laden fehlgeschlagen');
  readonly compact = input(false);
  /** Der Aufrufer zeigt damit, dass ein neuer Versuch läuft. */
  readonly retrying = input(false);
  /** Erlaubt, "Erneut versuchen" auch bei retryable-Fehlern auszublenden. */
  readonly allowRetry = input(true);
  readonly retry = output<void>();

  protected readonly canRetry = computed(() => this.allowRetry() && this.error().retryable);
}
