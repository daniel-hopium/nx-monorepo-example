import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';
import {
  countFilled,
  CREATE_INITIATIVE_SCHEMA,
  InitiativeService,
  SECTION_TITLES,
  SectionKey,
  toCreateInitiativeDto,
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

/**
 * Smart Component "Initiative erstellen" (und "bearbeiten").
 * `form()` erzeugt aus dem Entwurfs-Signal einen FieldTree. Jeder Abschnitt
 * bekommt seinen Teilbaum (z. B. `f.stammdaten`) und rendert ihn im
 * Akkordeon. Die Zähler "3/10" sind computed aus dem Modell.
 * Kommt eine `id` aus der Route, wird der Datensatz in den Entwurf geladen.
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
  private readonly initiativeService = inject(InitiativeService);

  /** Aus der Route `initiativen/:id/bearbeiten` (withComponentInputBinding). */
  readonly id = input<string>();

  protected readonly f = form(this.draft.model, CREATE_INITIATIVE_SCHEMA);
  protected readonly loadError = signal(false);

  protected readonly sections = (Object.keys(SECTION_TITLES) as SectionKey[]).map(
    (key) => ({ key, title: SECTION_TITLES[key] })
  );

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

  protected readonly isEdit = computed(() => this.draft.id() !== null);

  protected readonly title = computed(
    () => this.draft.model().stammdaten.name || 'Name der Initiative'
  );

  constructor() {
    // Bearbeiten-Modus: Datensatz laden, sobald die Id bekannt ist. Beim
    // Zurückkommen aus der Zusammenfassung bleibt der Entwurf erhalten.
    effect(() => {
      const id = Number(this.id());
      if (!id || this.draft.id() === id) return;
      this.initiativeService
        .loadInitiativeById(id)
        .then((detail) => this.draft.load(id, toCreateInitiativeDto(detail)))
        .catch(() => this.loadError.set(true));
    });
  }

  protected toggle(key: SectionKey, expanded: boolean) {
    this.open.set(expanded ? key : null);
  }

  protected cancel() {
    const id = this.draft.id();
    this.draft.reset();
    this.router.navigate(id ? ['/initiativen', id] : ['/initiativen']);
  }

  protected toSummary() {
    if (!this.f().valid()) {
      // Fehler sichtbar machen und den betroffenen Abschnitt öffnen.
      this.f().markAsTouched();
      this.open.set('stammdaten');
      return;
    }
    const id = this.draft.id();
    this.router.navigate(
      id
        ? ['/initiativen', id, 'bearbeiten', 'zusammenfassung']
        : ['/initiativen/erstellen/zusammenfassung']
    );
  }
}
