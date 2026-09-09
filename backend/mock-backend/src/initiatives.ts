/**
 * Initiativen-Endpunkte des Mock-Backends.
 * Eigene Datei, damit main.ts nicht zur "God File" wird: jede Domäne
 * registriert ihre Routen selbst über einen Express-Router.
 */
import { Router } from 'express';

export type Freigabe = 'Veröffentlicht' | 'Freigabe offen' | 'Entwurf';
export type Gesamtstatus = 'Grün' | 'Gelb' | 'Rot';
export type Phase = 'Geplant' | 'Umsetzung' | 'On Hold' | 'Abgeschlossen';

export type Initiative = {
  id: number;
  name: string;
  freigabe: Freigabe;
  manager: string;
  gesamtstatus: Gesamtstatus;
  phase: Phase;
  reportingBis: string | null;
  archiviert: boolean;
  // Metadaten, die der Server pflegt (Nutzer kann sie nicht editieren).
  erstelltVon: string;
  erstelltAm: string;
  aktualisiertAm: string;
  // Alle Formularfelder, gruppiert nach Abschnitt.
  details: Record<string, Record<string, string | number | null>>;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

const NAMES = [
  'Angebotsportfolio Mobilität und Logistik', 'Mobilität', 'TW500 - BAI',
  'Reporting Mobilität (Kopie)', 'Projekt X', 'Angebotsportfolio Energie',
  'Klare Wege', 'Erneuerbarer Ausbau', 'E-Autos', 'E-Tankstellen',
  'Spezialtickets für Reisende', 'Sondertransport', 'Projekt I', 'Projekt K',
  'Projekt Z', 'Projekt M', 'Projekt N', 'Projekt O', 'Projekt P', 'Projekt Q',
  'Fernwärme Süd', 'Smart Grid Pilot', 'Wasserstoff-Busse', 'Digitale Ticketing-Plattform',
  'Netzausbau Nord', 'Photovoltaik Dächer', 'Kundenportal 2.0', 'Depot Simmering',
  'Barrierefreie Haltestellen', 'Ladeinfrastruktur Flotte', 'Datenplattform', 'Projekt Y',
];

const PHASES: Phase[] = ['Geplant', 'Umsetzung', 'On Hold', 'Umsetzung', 'Geplant'];
const KONZERNUNTERNEHMEN = ['Wiener Stadtwerke', 'Wiener Linien', 'Wien Energie', 'Wiener Netze'];
const TYPEN = ['Organisation', 'Projekt', 'Programm'];

const today = () => new Date().toISOString().slice(0, 10);

export const initiativeList: Initiative[] = NAMES.map((name, idx) => {
  const id = idx + 1;
  const freigabe: Freigabe =
    id === 2 ? 'Freigabe offen' : id === 15 ? 'Entwurf' : 'Veröffentlicht';
  const manager = id === 15 ? 'Richard Wagner' : 'Conny Bauer';
  return {
    id,
    name,
    freigabe,
    manager,
    gesamtstatus: 'Grün',
    phase: PHASES[idx % PHASES.length],
    reportingBis: freigabe === 'Freigabe offen' ? null : '2025-06-30',
    archiviert: false,
    erstelltVon: 'John Doe',
    erstelltAm: '2025-04-30',
    aktualisiertAm: '2025-07-16',
    details: {
      stammdaten: {
        name,
        kurztitel: `25_WSTW_${String(id).padStart(3, '0')}`,
        initiativenId: `#WSTW${123400 + id}`,
        konzernunternehmen: KONZERNUNTERNEHMEN[idx % KONZERNUNTERNEHMEN.length],
        typ: TYPEN[idx % TYPEN.length],
        interneKooperation: '',
        manager,
        auftraggeber: 'Konzernintern',
        startdatum: '2025-05-01',
        enddatum: '2026-12-31',
      },
      status: {
        phase: PHASES[idx % PHASES.length],
        gesamtstatus: 'Grün',
        freigabe,
        statusKommentar: '',
        reportingBis: freigabe === 'Freigabe offen' ? '' : '2025-06-30',
      },
      budget: {
        gesamtbudget: 250000 + id * 1000,
        budgetJahr: 80000,
        verbraucht: 12000,
        finanzierungsquelle: 'Eigenmittel',
      },
      gruppenstrategie: { strategischesZiel: 'Klimaneutral 2040', beitrag: '', kpi: '' },
      weitere: { risiken: '', abhaengigkeiten: '', notizen: '' },
    },
  };
});

type SortKey = 'name' | 'freigabe' | 'manager' | 'gesamtstatus' | 'phase';
type WriteBody = Partial<Omit<Initiative, 'id' | 'erstelltVon' | 'erstelltAm' | 'aktualisiertAm'>>;

const findById = (id: string) => initiativeList.find((i) => i.id === parseInt(id, 10));

export const initiativesRouter = Router();

initiativesRouter.get('/', (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const search = (q['search'] ?? '').toLowerCase();
  const sortBy = (q['sortBy'] ?? 'name') as SortKey;
  const sortDir = q['sortDir'] === 'desc' ? -1 : 1;
  const page = Math.max(1, parseInt(q['page'] ?? '1', 10));
  const pageSize = Math.max(1, parseInt(q['pageSize'] ?? '20', 10));
  const archiviert = q['archiviert'] === 'true';

  let items = initiativeList.filter((i) => i.archiviert === archiviert);
  if (search) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(search) ||
        i.manager.toLowerCase().includes(search)
    );
  }
  if (q['phase']) items = items.filter((i) => i.phase === q['phase']);
  if (q['freigabe']) items = items.filter((i) => i.freigabe === q['freigabe']);

  items = [...items].sort(
    (a, b) => String(a[sortBy]).localeCompare(String(b[sortBy]), 'de') * sortDir
  );

  const start = (page - 1) * pageSize;
  const result: PageResult<Initiative> = {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
  res.json(result);
});

initiativesRouter.get('/:id', (req, res) => {
  const initiative = findById(req.params.id);
  if (initiative) {
    res.json(initiative);
  } else {
    res.status(404).json({ message: 'Initiative not found' });
  }
});

initiativesRouter.post('/', (req, res) => {
  const body = req.body as WriteBody;
  const nextId = Math.max(0, ...initiativeList.map((i) => i.id)) + 1;
  const initiative: Initiative = {
    id: nextId,
    name: body.name ?? 'Neue Initiative',
    freigabe: body.freigabe ?? 'Entwurf',
    manager: body.manager ?? '',
    gesamtstatus: body.gesamtstatus ?? 'Grün',
    phase: body.phase ?? 'Geplant',
    reportingBis: body.reportingBis ?? null,
    archiviert: false,
    erstelltVon: 'John Doe',
    erstelltAm: today(),
    aktualisiertAm: today(),
    details: body.details ?? {},
  };
  initiativeList.push(initiative);
  res.status(201).json(initiative);
});

initiativesRouter.put('/:id', (req, res) => {
  const initiative = findById(req.params.id);
  if (!initiative) {
    res.status(404).json({ message: 'Initiative not found' });
    return;
  }
  const body = req.body as WriteBody;
  Object.assign(initiative, body, { id: initiative.id, aktualisiertAm: today() });
  res.json(initiative);
});

/** "Absenden": Entwurf geht in die Freigabe. */
initiativesRouter.post('/:id/submit', (req, res) => {
  const initiative = findById(req.params.id);
  if (!initiative) {
    res.status(404).json({ message: 'Initiative not found' });
    return;
  }
  initiative.freigabe = 'Freigabe offen';
  initiative.aktualisiertAm = today();
  res.json(initiative);
});

initiativesRouter.delete('/:id', (req, res) => {
  const index = initiativeList.findIndex((i) => i.id === parseInt(req.params.id, 10));
  if (index === -1) {
    res.status(404).json({ message: 'Initiative not found' });
    return;
  }
  initiativeList.splice(index, 1);
  res.status(204).send();
});
