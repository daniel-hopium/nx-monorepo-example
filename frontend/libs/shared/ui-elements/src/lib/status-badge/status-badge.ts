import { Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral';

/**
 * "Pill"-Badge für Status-Werte. Die Farbe kommt über `variant`, das Label
 * über Content-Projection (<ng-content>), damit der Aufrufer frei ist,
 * ob er ein Icon voranstellt.
 */
@Component({
  selector: 'ds-status-badge',
  template: `<span class="badge" [class]="'badge ' + variant()"><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.1rem 0.55rem;
      border-radius: 999px;
      font-size: 0.75rem;
      line-height: 1.2;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .success { color: #1a7f37; border-color: #1a7f37; background: #f0fbf4; }
    .warning { color: #b35900; border-color: #d97706; background: #fff8ec; }
    .info    { color: #1f4fbf; border-color: #3b6fe0; background: #f0f4ff; }
    .neutral { color: #57606a; border-color: #d0d7de; background: #f6f8fa; }
  `,
})
export class StatusBadge {
  readonly variant = input<BadgeVariant>('neutral');
}
