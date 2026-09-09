import { required, schema } from '@angular/forms/signals';

/**
 * Domänenmodell "Initiative".
 * Union-Typen statt Enums: sie serialisieren als reine Strings, genau so,
 * wie das Backend sie liefert, und brauchen keine Umwandlung.
 */
export type Freigabe = 'Veröffentlicht' | 'Freigabe offen' | 'Entwurf';
export type Gesamtstatus = 'Grün' | 'Gelb' | 'Rot';
export type Phase = 'Geplant' | 'Umsetzung' | 'On Hold' | 'Abgeschlossen';

export const PHASEN: Phase[] = ['Geplant', 'Umsetzung', 'On Hold', 'Abgeschlossen'];
export const GESAMTSTATUS: Gesamtstatus[] = ['Grün', 'Gelb', 'Rot'];
export const FREIGABEN: Freigabe[] = ['Entwurf', 'Freigabe offen', 'Veröffentlicht'];

/** Zeile der Übersicht (Read Model). */
export type Initiative = {
  id: number;
  name: string;
  freigabe: Freigabe;
  manager: string;
  gesamtstatus: Gesamtstatus;
  phase: Phase;
  reportingBis: string | null;
  archiviert: boolean;
};

/** Vollständiger Datensatz für die Detailseite: Zeile + Metadaten + alle Felder. */
export type InitiativeDetail = Initiative & {
  erstelltVon: string;
  erstelltAm: string;
  aktualisiertAm: string;
  details: Partial<CreateInitiativeDto>;
};

/* ---------- Formular "Initiative erstellen", in fünf Abschnitte gegliedert ---------- */

export type Stammdaten = {
  name: string;
  kurztitel: string;
  initiativenId: string;
  konzernunternehmen: string;
  typ: string;
  interneKooperation: string;
  manager: string;
  auftraggeber: string;
  startdatum: string;
  enddatum: string;
};

export type StatusDerInitiative = {
  phase: Phase | '';
  gesamtstatus: Gesamtstatus | '';
  freigabe: Freigabe | '';
  statusKommentar: string;
  reportingBis: string;
};

export type Budget = {
  gesamtbudget: number | null;
  budgetJahr: number | null;
  verbraucht: number | null;
  finanzierungsquelle: string;
};

export type Gruppenstrategie = {
  strategischesZiel: string;
  beitrag: string;
  kpi: string;
};

export type Weitere = {
  risiken: string;
  abhaengigkeiten: string;
  notizen: string;
};

export type CreateInitiativeDto = {
  stammdaten: Stammdaten;
  status: StatusDerInitiative;
  budget: Budget;
  gruppenstrategie: Gruppenstrategie;
  weitere: Weitere;
};

export type SectionKey = keyof CreateInitiativeDto;

export const initialCreateInitiativeDto: CreateInitiativeDto = {
  stammdaten: {
    name: '',
    kurztitel: '',
    initiativenId: '',
    konzernunternehmen: '',
    typ: '',
    interneKooperation: '',
    manager: '',
    auftraggeber: '',
    startdatum: '',
    enddatum: '',
  },
  status: {
    phase: '',
    gesamtstatus: '',
    freigabe: '',
    statusKommentar: '',
    reportingBis: '',
  },
  budget: {
    gesamtbudget: null,
    budgetJahr: null,
    verbraucht: null,
    finanzierungsquelle: '',
  },
  gruppenstrategie: {
    strategischesZiel: '',
    beitrag: '',
    kpi: '',
  },
  weitere: {
    risiken: '',
    abhaengigkeiten: '',
    notizen: '',
  },
};

/** Anzeigetexte der Abschnitte und Felder, einmal zentral für Formular, Zusammenfassung und Detailseite. */
export const SECTION_TITLES: Record<SectionKey, string> = {
  stammdaten: 'Stammdaten',
  status: 'Status der Initiative',
  budget: 'Budget',
  gruppenstrategie: 'Gruppenstrategie',
  weitere: 'Weitere / Diverse',
};

export const FIELD_LABELS: Record<string, string> = {
  name: 'Name der Initiative',
  kurztitel: 'Kurztitel',
  initiativenId: 'Initiativen-ID',
  konzernunternehmen: 'Konzernunternehmen im Lead',
  typ: 'Typ der Initiative',
  interneKooperation: 'Interne Kooperation (optional)',
  manager: 'Initiativen-Manager*in',
  auftraggeber: 'Auftraggeber*in intern/extern',
  startdatum: 'Startdatum',
  enddatum: 'Enddatum',
  phase: 'Phase',
  gesamtstatus: 'Gesamtstatus',
  freigabe: 'Freigabe',
  statusKommentar: 'Status-Kommentar',
  reportingBis: 'Zu reporten bis',
  gesamtbudget: 'Gesamtbudget (EUR)',
  budgetJahr: 'Budget laufendes Jahr (EUR)',
  verbraucht: 'Bisher verbraucht (EUR)',
  finanzierungsquelle: 'Finanzierungsquelle',
  strategischesZiel: 'Strategisches Ziel',
  beitrag: 'Beitrag zur Gruppenstrategie',
  kpi: 'KPI',
  risiken: 'Risiken',
  abhaengigkeiten: 'Abhängigkeiten',
  notizen: 'Notizen',
};

/** Validierungsregeln (Signal Forms). Nur der Name ist Pflicht. */
export const CREATE_INITIATIVE_SCHEMA = schema<CreateInitiativeDto>((dto) => {
  required(dto.stammdaten.name, { message: 'Name ist ein Pflichtfeld' });
});

/** Zählt ausgefüllte Felder eines Abschnitts, z. B. für "3/10" im Akkordeon. */
export function countFilled(section: Record<string, unknown>): number {
  return Object.values(section).filter(
    (v) => v !== '' && v !== null && v !== undefined
  ).length;
}

/**
 * Baut aus einem Detail-Datensatz wieder das Formular-Modell. Fehlende
 * Felder werden mit Initialwerten aufgefüllt, damit das Formular vollständig ist.
 */
export function toCreateInitiativeDto(detail: InitiativeDetail): CreateInitiativeDto {
  const base = structuredClone(initialCreateInitiativeDto);
  for (const key of Object.keys(base) as SectionKey[]) {
    Object.assign(base[key], detail.details[key] ?? {});
  }
  base.stammdaten.name = base.stammdaten.name || detail.name;
  base.stammdaten.manager = base.stammdaten.manager || detail.manager;
  return base;
}
