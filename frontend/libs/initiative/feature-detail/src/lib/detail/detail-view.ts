import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  FIELD_LABELS,
  Freigabe,
  InitiativeDetail,
  InitiativeService,
  SECTION_TITLES,
  SectionKey,
} from '@monorepo/initiative-domain';
import { BadgeVariant, StatusBadge } from '@monorepo/shared-ui-elements';

type Row = { label: string; value: string };
type Section = { key: SectionKey; title: string; rows: Row[] };

/**
 * Detailseite einer Initiative (Ziel des Klicks in der Übersicht).
 * Die Id kommt als input() aus der Route, `httpResource` lädt den
 * Datensatz und lädt neu, sobald sich die Id ändert. Aktionen (Löschen,
 * Absenden) gehen über den Domain-Service; danach wird die Resource
 * per reload() aktualisiert statt lokal zu raten.
 */
@Component({
  imports: [DatePipe, StatusBadge],
  templateUrl: './detail-view.html',
  styleUrl: './detail-view.css',
})
export class DetailView {
  private readonly initiativeService = inject(InitiativeService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  private readonly numericId = computed(() => Number(this.id()) || undefined);

  protected readonly initiative = this.initiativeService.createInitiativeResource(this.numericId);
  protected readonly busy = signal(false);
  protected readonly actionError = signal(false);

  /** Abschnitte mit Label/Wert-Zeilen; leere Werte werden als "keine Angabe" gezeigt. */
  protected readonly sections = computed<Section[]>(() => {
    const detail = this.initiative.value();
    if (!detail) return [];
    return (Object.keys(SECTION_TITLES) as SectionKey[]).map((key) => ({
      key,
      title: SECTION_TITLES[key],
      rows: Object.entries(detail.details[key] ?? {}).map(([field, value]) => ({
        label: FIELD_LABELS[field] ?? field,
        value: value === '' || value === null || value === undefined ? 'keine Angabe' : String(value),
      })),
    }));
  });

  protected badgeVariant(freigabe: Freigabe): BadgeVariant {
    return freigabe === 'Veröffentlicht' ? 'success' : freigabe === 'Freigabe offen' ? 'warning' : 'info';
  }

  protected canSubmit(detail: InitiativeDetail): boolean {
    return detail.freigabe === 'Entwurf';
  }

  protected edit() {
    this.router.navigate(['/initiativen', this.id(), 'bearbeiten']);
  }

  protected async submit() {
    await this.run(async () => {
      await this.initiativeService.submitInitiative(Number(this.id()));
      this.initiative.reload();
    });
  }

  protected async remove() {
    if (!confirm('Initiative wirklich löschen?')) return;
    await this.run(async () => {
      await this.initiativeService.deleteInitiative(Number(this.id()));
      await this.router.navigate(['/initiativen']);
    });
  }

  private async run(action: () => Promise<void>) {
    this.busy.set(true);
    this.actionError.set(false);
    try {
      await action();
    } catch {
      this.actionError.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
