import { Component, computed, input, output, signal } from '@angular/core';

export type Column<T> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
};

export type SortState<T> = { key: keyof T & string; dir: 'asc' | 'desc' } | null;

/**
 * Generische, sortierbare Tabelle: `<lab-data-table [columns]="..." [rows]="..." />`.
 *
 * Generisch (`DataTable<T>`) heißt: dieselbe Komponente zeigt Aufgaben,
 * Nutzer oder Rechnungen; `columns` kennt nur Schlüssel von T, der Compiler
 * meldet Tippfehler in Spaltennamen.
 *
 * Testthemen:
 *  - Struktur: Kopfzeilen, Anzahl Zeilen, Leerzustand
 *  - Sortierung: Klick auf Kopf sortiert auf, zweiter Klick ab, dritter zurück
 *  - `aria-sort` am <th>: Screenreader erfahren die Sortierrichtung
 *  - Output `rowClick`
 */
@Component({
  selector: 'lab-data-table',
  template: `
    <table class="table">
      @if (caption()) {
        <caption>{{ caption() }}</caption>
      }
      <thead>
        <tr>
          @for (col of columns(); track col.key) {
            <th scope="col" [attr.aria-sort]="ariaSort(col.key)">
              @if (col.sortable) {
                <button type="button" class="sort" (click)="toggleSort(col.key)">
                  {{ col.label }}
                  <span aria-hidden="true">{{ arrow(col.key) }}</span>
                </button>
              } @else {
                {{ col.label }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of sortedRows(); track $index) {
          <tr (click)="rowClick.emit(row)">
            @for (col of columns(); track col.key) {
              <td>{{ row[col.key] }}</td>
            }
          </tr>
        } @empty {
          <tr>
            <td class="empty" [attr.colspan]="columns().length">{{ emptyText() }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    caption { text-align: left; font-weight: 600; padding-bottom: 0.5rem; }
    th { text-align: left; font-weight: 500; color: #57606a; border-bottom: 1px solid #d0d7de; padding: 0.45rem 0.4rem; }
    td { border-bottom: 1px solid #eef0f2; padding: 0.45rem 0.4rem; }
    tbody tr:hover { background: #f6f8fa; }
    .sort { font: inherit; color: inherit; border: 0; background: transparent; padding: 0; cursor: pointer; display: inline-flex; gap: 0.3rem; }
    .empty { text-align: center; color: #8c959f; padding: 1rem; }
  `,
})
export class DataTable<T extends Record<string, unknown>> {
  readonly columns = input.required<Column<T>[]>();
  readonly rows = input.required<T[]>();
  readonly caption = input('');
  readonly emptyText = input('Keine Einträge');
  readonly rowClick = output<T>();

  /** Interner Zustand, aber öffentlich lesbar, damit Tests ihn prüfen können. */
  readonly sort = signal<SortState<T>>(null);

  protected readonly sortedRows = computed(() => {
    const sort = this.sort();
    const rows = [...this.rows()];
    if (!sort) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => compare(a[sort.key], b[sort.key]) * factor);
  });

  /** Zyklus: unsortiert -> aufsteigend -> absteigend -> unsortiert. */
  toggleSort(key: keyof T & string) {
    const current = this.sort();
    if (current?.key !== key) this.sort.set({ key, dir: 'asc' });
    else if (current.dir === 'asc') this.sort.set({ key, dir: 'desc' });
    else this.sort.set(null);
  }

  protected ariaSort(key: string): 'ascending' | 'descending' | null {
    const sort = this.sort();
    if (sort?.key !== key) return null;
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  protected arrow(key: string): string {
    const sort = this.sort();
    if (sort?.key !== key) return '⇅';
    return sort.dir === 'asc' ? '▲' : '▼';
  }
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a ?? '').localeCompare(String(b ?? ''), 'de');
}
