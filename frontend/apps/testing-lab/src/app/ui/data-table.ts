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
                <!-- aria-label: der Name sagt, WAS der Button tut. Die Richtung steht in aria-sort am <th>. -->
                <button type="button" class="sort" [attr.aria-label]="col.label + ' sortieren'" (click)="toggleSort(col.key)">
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
            @for (col of columns(); track col.key; let first = $first) {
              <td>
                @if (first && rowActionLabel(); as label) {
                  <!--
                    Echter Button für Tastatur und Screenreader. Das <tr> bleibt für
                    Mausklicks auf die ganze Zeile klickbar. stopPropagation verhindert,
                    dass ein Button-Klick zusätzlich über das <tr> ein zweites Mal meldet.
                    Der Name ("Ada öffnen") enthält den sichtbaren Text ("Ada"), damit
                    Sprachsteuerung per "Klicke Ada" funktioniert (WCAG 2.5.3).
                  -->
                  <button
                    type="button"
                    class="row-action"
                    [attr.aria-label]="label(row)"
                    (click)="$event.stopPropagation(); rowClick.emit(row)"
                  >
                    {{ row[col.key] }}
                  </button>
                } @else {
                  {{ row[col.key] }}
                }
              </td>
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
    .row-action { font: inherit; color: #1f3a93; background: transparent; border: 0; padding: 0; cursor: pointer; text-align: left; text-decoration: underline; }
    .sort:focus-visible, .row-action:focus-visible { outline: 2px solid #1f3a93; outline-offset: 2px; border-radius: 2px; }
  `,
})
export class DataTable<T extends Record<string, unknown>> {
  readonly columns = input.required<Column<T>[]>();
  readonly rows = input.required<T[]>();
  readonly caption = input('');
  readonly emptyText = input('Keine Einträge');
  readonly rowClick = output<T>();
  /**
   * Barrierefreiheit: Name der Zeilen-Aktion, z. B. `(row) => row.name + ' öffnen'`.
   * Ist er gesetzt, bekommt die erste Zelle einen fokussierbaren Button.
   * Ohne ihn ist die Zeile nur per Maus klickbar, also für Tastatur-Nutzer
   * unerreichbar. Wer `rowClick` nutzt, sollte diesen Input immer setzen.
   */
  readonly rowActionLabel = input<((row: T) => string) | undefined>(undefined);

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
