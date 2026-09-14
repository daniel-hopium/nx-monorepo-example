import { Component, computed, input, output, signal } from '@angular/core';

export type AlertKind = 'info' | 'success' | 'warning' | 'error';

/**
 * Hinweisbox (Alert / Banner), fest im Seitenfluss, im Gegensatz zum Toast,
 * der schwebt und von selbst verschwindet.
 *
 * Barrierefreiheit ist hier das eigentliche Testthema:
 *  - error/warning bekommen `role="alert"`: Screenreader unterbrechen und lesen sofort vor.
 *  - info/success bekommen `role="status"`: wird höflich vorgelesen, wenn Ruhe ist.
 * Ein Test mit `it.each` prüft diese Zuordnung für alle vier Arten.
 */
@Component({
  selector: 'lab-alert',
  template: `
    @if (!dismissed()) {
      <div class="alert" [class]="'alert ' + kind()" [attr.role]="role()">
        <span class="icon" aria-hidden="true">{{ icon() }}</span>
        <div class="body">
          @if (title()) {
            <strong class="title">{{ title() }}</strong>
          }
          <div class="text"><ng-content /></div>
        </div>
        @if (dismissible()) {
          <button type="button" class="close" aria-label="Hinweis schließen" (click)="dismiss()">✕</button>
        }
      </div>
    }
  `,
  styles: `
    .alert { display: flex; gap: 0.6rem; padding: 0.7rem 0.9rem; border-radius: 6px; border: 1px solid; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .info    { background: #eff8ff; border-color: #84caff; color: #175cd3; }
    .success { background: #ecfdf3; border-color: #75e0a7; color: #067647; }
    .warning { background: #fffaeb; border-color: #fec84b; color: #b54708; }
    .error   { background: #fef3f2; border-color: #fda29b; color: #b42318; }
    .body { flex: 1; }
    .title { display: block; margin-bottom: 0.15rem; }
    .close { border: 0; background: transparent; color: inherit; cursor: pointer; }
  `,
})
export class Alert {
  readonly kind = input<AlertKind>('info');
  readonly title = input('');
  readonly dismissible = input(false);
  readonly closed = output<void>();

  protected readonly dismissed = signal(false);

  protected readonly role = computed(() =>
    this.kind() === 'error' || this.kind() === 'warning' ? 'alert' : 'status'
  );

  protected readonly icon = computed(
    () => ({ info: 'ℹ', success: '✓', warning: '!', error: '✕' })[this.kind()]
  );

  protected dismiss() {
    this.dismissed.set(true);
    this.closed.emit();
  }
}
