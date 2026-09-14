import { Component, effect, ElementRef, input, model, output, viewChild } from '@angular/core';
import { Button } from './button';

let nextId = 0;

/**
 * Bestätigungsdialog (Modal) auf Basis des nativen <dialog>-Elements.
 *
 * `showModal()` legt den Dialog in den "Top Layer" des Browsers: Hintergrund
 * ist gesperrt, Fokus bleibt im Dialog, Escape schließt ihn. Das alles macht
 * der Browser selbst, wir müssen es nicht nachbauen.
 *
 * WICHTIG fürs Testen: jsdom kennt `showModal()` nicht (die Methode ist
 * `undefined`). Dieser Dialog wird deshalb NUR im Browser-Modus getestet.
 * Ein gutes Beispiel dafür, wann jsdom nicht mehr reicht.
 */
@Component({
  selector: 'lab-confirm-dialog',
  imports: [Button],
  template: `
    <dialog #dialog class="dialog" [attr.aria-labelledby]="titleId" (close)="open.set(false)">
      <h2 [id]="titleId">{{ title() }}</h2>
      <p><ng-content /></p>
      <div class="actions">
        <button labButton variant="secondary" type="button" (click)="cancel()">Abbrechen</button>
        <button labButton variant="danger" type="button" (click)="confirm()">{{ confirmLabel() }}</button>
      </div>
    </dialog>
  `,
  styles: `
    .dialog { border: 0; border-radius: 8px; padding: 1.25rem 1.5rem; min-width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .dialog::backdrop { background: rgba(15, 23, 42, 0.45); }
    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    p { margin: 0 0 1.25rem; font-size: 0.9rem; color: #57606a; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
  `,
})
export class ConfirmDialog {
  protected readonly titleId = `lab-dialog-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly title = input.required<string>();
  readonly confirmLabel = input('Bestätigen');
  /** Two-Way: `[(open)]="deleteOpen"` */
  readonly open = model(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    // Signal -> DOM: öffnet/schließt den nativen Dialog, wenn sich `open` ändert.
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      if (!this.open() && dialog.open) dialog.close();
    });
  }

  protected confirm() {
    this.confirmed.emit();
    this.open.set(false);
  }

  protected cancel() {
    this.cancelled.emit();
    this.open.set(false);
  }
}
