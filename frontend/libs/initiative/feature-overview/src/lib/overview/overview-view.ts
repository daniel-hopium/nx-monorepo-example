import { Component, computed, inject, input, signal } from '@angular/core';
import {
  FREIGABEN,
  InitiativeQueryDto,
  InitiativeService,
  initialInitiativeQueryDto,
  PHASEN,
} from '@monorepo/initiative-domain';
import { InitiativeTable, SortChange } from '@monorepo/initiative-ui-blocks';
import { Pagination, SearchBox } from '@monorepo/shared-ui-elements';

/**
 * Smart Component der Übersicht.
 * Der komplette Abfragezustand (Suche, Filter, Sortierung, Seite) liegt in
 * einem einzigen Signal `query`. Daraus leitet `httpResource` die Requests
 * ab: jede Änderung lädt automatisch neu, ohne manuelles subscribe().
 */
@Component({
  imports: [InitiativeTable, Pagination, SearchBox],
  templateUrl: './overview-view.html',
  styleUrl: './overview-view.css',
})
export class OverviewView {
  private readonly initiativeService = inject(InitiativeService);

  /** Kommt aus `data: { archiviert: true }` der Route (withComponentInputBinding). */
  readonly archiviert = input(false);

  protected readonly query = signal<InitiativeQueryDto>(initialInitiativeQueryDto);
  protected readonly filterOpen = signal(false);
  protected readonly phasen = PHASEN;
  protected readonly freigaben = FREIGABEN;

  // Archiv-Flag aus der Route in die Abfrage mischen.
  private readonly effectiveQuery = computed<InitiativeQueryDto>(() => ({
    ...this.query(),
    archiviert: this.archiviert(),
  }));

  protected readonly page = this.initiativeService.createInitiativesResource(
    this.effectiveQuery
  );

  protected readonly title = computed(() =>
    this.archiviert() ? 'Archiv' : 'Übersicht'
  );

  protected readonly activeFilters = computed(
    () => [this.query().phase, this.query().freigabe].filter(Boolean).length
  );

  /** Jede Änderung setzt die Seite zurück, sonst landet man auf einer leeren Seite. */
  protected patch(changes: Partial<InitiativeQueryDto>) {
    this.query.update((q) => ({ ...q, page: 1, ...changes }));
  }

  protected onSearch(search: string) {
    this.patch({ search });
  }

  protected onSort({ sortBy, sortDir }: SortChange) {
    this.patch({ sortBy, sortDir });
  }

  protected onPage(page: number) {
    this.query.update((q) => ({ ...q, page }));
  }

  protected onPhase(event: Event) {
    this.patch({ phase: (event.target as HTMLSelectElement).value });
  }

  protected onFreigabe(event: Event) {
    this.patch({ freigabe: (event.target as HTMLSelectElement).value });
  }

  protected resetFilters() {
    this.patch({ phase: '', freigabe: '' });
  }
}
