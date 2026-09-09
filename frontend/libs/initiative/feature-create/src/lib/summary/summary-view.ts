import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InitiativeService } from '@monorepo/initiative-domain';
import { InitiativeDraft } from '../draft';

type Row = { label: string; value: string };
type Group = { title: string; rows: Row[] };

/**
 * Zusammenfassung vor dem Speichern: zeigt alle ausgefüllten Felder
 * gruppiert nach Abschnitt und schickt den Entwurf ans Backend.
 */
@Component({
  template: `
    <section class="card">
      <h1>Zusammenfassung</h1>
      @for (group of groups(); track group.title) {
        <h2>{{ group.title }}</h2>
        @if (group.rows.length) {
          <dl>
            @for (row of group.rows; track row.label) {
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            }
          </dl>
        } @else {
          <p class="muted">Keine Angaben</p>
        }
      }
      @if (error()) {
        <p class="error">Speichern fehlgeschlagen. Läuft das Mock-Backend?</p>
      }
      <div class="actions">
        <button type="button" class="btn" (click)="back()">Zurück</button>
        <button type="button" class="btn primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Speichert…' : 'Initiative anlegen' }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .card { background: #fff; border-radius: 4px; padding: 1.25rem 1.5rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    h2 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; border-bottom: 1px solid #e6e8eb; padding-bottom: 0.25rem; }
    dl { display: grid; grid-template-columns: 220px 1fr; gap: 0.35rem 1rem; font-size: 0.85rem; margin: 0; }
    dt { color: #57606a; }
    dd { margin: 0; }
    .muted { color: #8c959f; font-size: 0.85rem; }
    .error { color: #cf222e; }
    .actions { display: flex; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; }
    .btn { font: inherit; font-size: 0.8rem; padding: 0.4rem 1.2rem; border-radius: 999px; cursor: pointer; border: 1px solid #d0d7de; background: #fff; }
    .btn.primary { background: #1f3a93; border-color: #1f3a93; color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: default; }
  `,
})
export class SummaryView {
  private readonly draft = inject(InitiativeDraft);
  private readonly initiativeService = inject(InitiativeService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  private readonly titles: Record<string, string> = {
    stammdaten: 'Stammdaten',
    status: 'Status der Initiative',
    budget: 'Budget',
    gruppenstrategie: 'Gruppenstrategie',
    weitere: 'Weitere / Diverse',
  };

  protected readonly groups = computed<Group[]>(() =>
    Object.entries(this.draft.model()).map(([key, section]) => ({
      title: this.titles[key] ?? key,
      rows: Object.entries(section as Record<string, unknown>)
        .filter(([, v]) => v !== '' && v !== null)
        .map(([label, v]) => ({ label: this.humanize(label), value: String(v) })),
    }))
  );

  protected back() {
    this.router.navigate(['/initiativen/erstellen']);
  }

  protected async save() {
    this.saving.set(true);
    this.error.set(false);
    try {
      await this.initiativeService.createInitiative(this.draft.model());
      this.draft.reset();
      await this.router.navigate(['/initiativen']);
    } catch {
      this.error.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  /** "beteiligteEinheiten" -> "Beteiligte Einheiten" */
  private humanize(key: string): string {
    const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
}
