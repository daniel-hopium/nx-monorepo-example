import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';
import {
  countFilled,
  CREATE_INITIATIVE_SCHEMA,
  CreateInitiativeDto,
} from '@monorepo/initiative-domain';
import {
  BudgetForm,
  GruppenstrategieForm,
  StammdatenForm,
  StatusForm,
  WeitereForm,
} from '@monorepo/initiative-ui-blocks';
import { AccordionSection } from '@monorepo/shared-ui-elements';
import { InitiativeDraft } from '../draft';

type SectionKey = keyof CreateInitiativeDto;

/**
 * Smart Component "Initiative erstellen".
 * `form()` erzeugt aus dem Entwurfs-Signal einen FieldTree. Jeder Abschnitt
 * bekommt seinen Teilbaum (z. B. `f.stammdaten`) und rendert ihn im
 * Akkordeon. Die Zähler "3/10" sind computed aus dem Modell.
 */
@Component({
  imports: [
    AccordionSection,
    StammdatenForm,
    StatusForm,
    BudgetForm,
    GruppenstrategieForm,
    WeitereForm,
  ],
  templateUrl: './create-view.html',
  styleUrl: './create-view.css',
})
export class CreateView {
  private readonly draft = inject(InitiativeDraft);
  private readonly router = inject(Router);

  protected readonly f = form(this.draft.model, CREATE_INITIATIVE_SCHEMA);

  protected readonly sections: { key: SectionKey; title: string }[] = [
    { key: 'stammdaten', title: 'Stammdaten' },
    { key: 'status', title: 'Status der Initiative' },
    { key: 'budget', title: 'Budget' },
    { key: 'gruppenstrategie', title: 'Gruppenstrategie' },
    { key: 'weitere', title: 'Weitere / Diverse' },
  ];

  /** Genau ein Abschnitt offen (klassisches Akkordeon). */
  protected readonly open = signal<SectionKey | null>(null);

  protected readonly counters = computed(() => {
    const model = this.draft.model();
    const result = {} as Record<SectionKey, string>;
    for (const { key } of this.sections) {
      const section = model[key];
      result[key] = `${countFilled(section)}/${Object.keys(section).length}`;
    }
    return result;
  });

  protected readonly title = computed(
    () => this.draft.model().stammdaten.name || 'Name der Initiative'
  );

  protected toggle(key: SectionKey, expanded: boolean) {
    this.open.set(expanded ? key : null);
  }

  protected cancel() {
    this.draft.reset();
    this.router.navigate(['/initiativen']);
  }

  protected toSummary() {
    if (!this.f().valid()) {
      // Fehler sichtbar machen und den betroffenen Abschnitt öffnen.
      this.f().markAsTouched();
      this.open.set('stammdaten');
      return;
    }
    this.router.navigate(['/initiativen/erstellen/zusammenfassung']);
  }
}
