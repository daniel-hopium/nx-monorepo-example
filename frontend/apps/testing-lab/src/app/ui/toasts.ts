import { Component, inject } from '@angular/core';
import { NotificationService } from '../data-access/notification-service';

/** Zeigt die Meldungen des NotificationService an. */
@Component({
  selector: 'lab-toasts',
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of notifications.messages(); track n.id) {
        <div class="toast" [class.error]="n.kind === 'error'">
          {{ n.text }}
          <button type="button" (click)="notifications.dismiss(n.id)" aria-label="Schließen">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast { background: #1f3a93; color: #fff; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.85rem; display: flex; gap: 0.75rem; }
    .toast.error { background: #b42318; }
    button { border: 0; background: transparent; color: inherit; cursor: pointer; }
  `,
})
export class Toasts {
  protected readonly notifications = inject(NotificationService);
}
