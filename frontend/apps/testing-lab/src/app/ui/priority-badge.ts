import { Component, computed, input } from '@angular/core';
import { Priority } from '../data-access/task';

/**
 * Kleinste Komponente der App: ein Input rein, ein Badge raus.
 * Ideal für den ersten Komponententest: Input setzen, DOM prüfen.
 */
@Component({
  selector: 'lab-priority-badge',
  template: `<span class="badge" [class]="'badge ' + priority()">{{ label() }}</span>`,
  styles: `
    .badge { display: inline-block; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: 0.75rem; border: 1px solid transparent; }
    .hoch    { color: #b42318; border-color: #f04438; background: #fef3f2; }
    .mittel  { color: #b54708; border-color: #f79009; background: #fffaeb; }
    .niedrig { color: #027a48; border-color: #12b76a; background: #ecfdf3; }
  `,
})
export class PriorityBadge {
  readonly priority = input.required<Priority>();

  protected readonly label = computed(() => {
    const p = this.priority();
    return p.charAt(0).toUpperCase() + p.slice(1);
  });
}
