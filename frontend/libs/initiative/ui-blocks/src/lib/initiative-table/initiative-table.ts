import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  Freigabe,
  Initiative,
  SortDir,
  SortKey,
} from '@monorepo/initiative-domain';
import { BadgeVariant, StatusBadge } from '@monorepo/shared-ui-elements';

export type SortChange = { sortBy: SortKey; sortDir: SortDir };

/**
 * Tabelle der Übersicht. Präsentational: bekommt Zeilen und den aktuellen
 * Sortierzustand, meldet Klicks auf Spaltenköpfe als `sortChange`.
 */
@Component({
  selector: 'lib-initiative-table',
  imports: [DatePipe, StatusBadge],
  templateUrl: './initiative-table.html',
  styleUrl: './initiative-table.css',
})
export class InitiativeTable {
  readonly rows = input.required<Initiative[]>();
  readonly sortBy = input<SortKey>('name');
  readonly sortDir = input<SortDir>('asc');
  readonly sortChange = output<SortChange>();
  readonly rowClick = output<Initiative>();

  protected readonly columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Initiative' },
    { key: 'freigabe', label: 'Freigabe' },
    { key: 'manager', label: 'Initiativen-Manager*in' },
    { key: 'gesamtstatus', label: 'Gesamtstatus' },
    { key: 'phase', label: 'Phase' },
  ];

  protected sort(key: SortKey) {
    // Gleiche Spalte erneut geklickt: Richtung umdrehen, sonst neu aufsteigend.
    const sortDir: SortDir =
      this.sortBy() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sortBy: key, sortDir });
  }

  protected freigabeVariant(freigabe: Freigabe): BadgeVariant {
    switch (freigabe) {
      case 'Veröffentlicht':
        return 'success';
      case 'Freigabe offen':
        return 'warning';
      case 'Entwurf':
        return 'info';
    }
  }

  protected statusVariant(status: Initiative['gesamtstatus']): BadgeVariant {
    return status === 'Grün' ? 'success' : status === 'Gelb' ? 'warning' : 'neutral';
  }
}
