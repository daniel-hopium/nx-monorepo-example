import { Initiative } from '../domain/initiative';

export type SortKey = keyof Pick<
  Initiative,
  'name' | 'freigabe' | 'manager' | 'gesamtstatus' | 'phase'
>;
export type SortDir = 'asc' | 'desc';

/** Abfrageparameter der Übersicht: Suche, Sortierung, Filter, Seite. */
export type InitiativeQueryDto = {
  search: string;
  sortBy: SortKey;
  sortDir: SortDir;
  phase: string;
  freigabe: string;
  page: number;
  pageSize: number;
  archiviert: boolean;
};

export const initialInitiativeQueryDto: InitiativeQueryDto = {
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
  phase: '',
  freigabe: '',
  page: 1,
  pageSize: 20,
  archiviert: false,
};
