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

/* ---------- Formular "Initiative erstellen", in fünf Abschnitte gegliedert ---------- */

export type Stammdaten = {
  name: string;
  kurzbeschreibung: string;
  manager: string;
  bereich: string;
  startdatum: string;
  enddatum: string;
  sponsor: string;
  kategorie: string;
  ziel: string;
  beteiligteEinheiten: string;
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

export const initialCreateInitiativeDto: CreateInitiativeDto = {
  stammdaten: {
    name: '',
    kurzbeschreibung: '',
    manager: '',
    bereich: '',
    startdatum: '',
    enddatum: '',
    sponsor: '',
    kategorie: '',
    ziel: '',
    beteiligteEinheiten: '',
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
