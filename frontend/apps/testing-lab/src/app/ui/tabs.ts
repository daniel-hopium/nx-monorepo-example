import {
  Component,
  contentChildren,
  effect,
  ElementRef,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';

let nextId = 0;

/**
 * Ein einzelner Reiter. Wird in <lab-tabs> geschachtelt:
 *
 *   <lab-tabs>
 *     <lab-tab label="Allgemein">…</lab-tab>
 *     <lab-tab label="Details">…</lab-tab>
 *   </lab-tabs>
 */
@Component({
  selector: 'lab-tab',
  template: `
    @if (active()) {
      <div role="tabpanel" class="panel" [id]="panelId" [attr.aria-labelledby]="tabId">
        <ng-content />
      </div>
    }
  `,
  styles: `.panel { padding: 0.9rem 0.25rem; font-size: 0.9rem; }`,
})
export class Tab {
  readonly label = input.required<string>();
  /** Wird von <lab-tabs> gesetzt, nicht vom Nutzer. */
  readonly active = signal(false);

  readonly tabId = `lab-tab-${nextId}`;
  readonly panelId = `lab-tabpanel-${nextId++}`;
}

/**
 * Reiter-Leiste nach dem WAI-ARIA-Muster "Tabs".
 *
 * - `contentChildren(Tab)` sammelt die geschachtelten <lab-tab>.
 * - Nur der aktive Reiter ist per Tab-Taste erreichbar (tabindex 0, die
 *   anderen -1, "roving tabindex"). Pfeiltasten wechseln den Reiter,
 *   Home/End springen an den Anfang/das Ende.
 *
 * Testthemen: Klick wechselt Panel (jsdom reicht), Tastatur-Navigation und
 * Fokus (Browser-Test, weil echter Fokus nötig ist).
 */
@Component({
  selector: 'lab-tabs',
  template: `
    <div role="tablist" class="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.tabId; let i = $index) {
        <button
          #tabButton
          type="button"
          role="tab"
          class="tab"
          [id]="tab.tabId"
          [attr.aria-selected]="i === selected()"
          [attr.aria-controls]="tab.panelId"
          [tabIndex]="i === selected() ? 0 : -1"
          (click)="select(i)"
          (keydown)="onKeydown($event, i)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    <ng-content />
  `,
  styles: `
    .tablist { display: flex; gap: 0.25rem; border-bottom: 1px solid #d0d7de; }
    .tab { font: inherit; font-size: 0.85rem; border: 0; background: transparent; padding: 0.5rem 0.9rem; cursor: pointer; border-bottom: 2px solid transparent; color: #57606a; }
    .tab[aria-selected='true'] { color: #1f3a93; border-bottom-color: #1f3a93; font-weight: 600; }
  `,
})
export class Tabs {
  readonly ariaLabel = input('Reiter');
  /** Index des aktiven Reiters, Two-Way-bindbar: `[(selected)]`. */
  readonly selected = model(0);

  protected readonly tabs = contentChildren(Tab);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  constructor() {
    // Hält die `active`-Flags der Kinder synchron zum ausgewählten Index.
    effect(() => {
      const selected = this.selected();
      this.tabs().forEach((tab, i) => tab.active.set(i === selected));
    });
  }

  protected select(index: number) {
    this.selected.set(index);
  }

  protected onKeydown(event: KeyboardEvent, index: number) {
    const count = this.tabs().length;
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;

    event.preventDefault();
    this.select(target);
    this.buttons()[target]?.nativeElement.focus();
  }
}
