import { Component, computed, input, output } from '@angular/core';

/**
 * Seitennavigation "1-20 von 32  « ‹ › »".
 * Rein präsentational: kennt nur Zahlen und meldet die gewünschte Seite
 * per Output nach oben. Wer die Daten lädt, entscheidet der Aufrufer.
 */
@Component({
  selector: 'ds-pagination',
  template: `
    <nav class="pagination" aria-label="Seitennavigation">
      <span class="range">{{ from() }}-{{ to() }} von {{ total() }}</span>
      <button type="button" (click)="go(1)" [disabled]="page() <= 1" aria-label="Erste Seite">«</button>
      <button type="button" (click)="go(page() - 1)" [disabled]="page() <= 1" aria-label="Vorherige Seite">‹</button>
      <button type="button" (click)="go(page() + 1)" [disabled]="page() >= pageCount()" aria-label="Nächste Seite">›</button>
      <button type="button" (click)="go(pageCount())" [disabled]="page() >= pageCount()" aria-label="Letzte Seite">»</button>
    </nav>
  `,
  styles: `
    .pagination { display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem; font-size: 0.8rem; color: #57606a; }
    .range { margin-right: 0.75rem; }
    button { border: 0; background: transparent; cursor: pointer; font-size: 1rem; padding: 0.15rem 0.4rem; color: #24292f; }
    button:disabled { color: #c0c6cd; cursor: default; }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );
  protected readonly from = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1
  );
  protected readonly to = computed(() =>
    Math.min(this.total(), this.page() * this.pageSize())
  );

  protected go(page: number) {
    if (page >= 1 && page <= this.pageCount() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
