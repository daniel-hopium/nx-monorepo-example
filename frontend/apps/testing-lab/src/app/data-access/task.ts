/**
 * Domänenmodell "Aufgabe" plus reine Funktionen darauf.
 *
 * Reine Funktionen (pure functions) haben keinen Zustand und keine
 * Seiteneffekte: gleicher Input, gleicher Output. Sie sind die einfachsten
 * Dinge zum Testen, weil man weder Angular noch Mocks braucht.
 */
export type Priority = 'hoch' | 'mittel' | 'niedrig';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
  /** ISO-Datum (YYYY-MM-DD) oder null, wenn kein Termin gesetzt ist. */
  dueDate: string | null;
};

export type TaskFilter = 'alle' | 'offen' | 'erledigt';

export const PRIORITIES: Priority[] = ['hoch', 'mittel', 'niedrig'];

/** Rangfolge für die Sortierung: hoch zuerst. */
const PRIORITY_RANK: Record<Priority, number> = { hoch: 0, mittel: 1, niedrig: 2 };

/**
 * Sortiert Aufgaben: offene vor erledigten, dann nach Priorität, dann nach Titel.
 * Gibt ein neues Array zurück, das Original bleibt unverändert (Immutability).
 */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (rank !== 0) return rank;
    return a.title.localeCompare(b.title, 'de');
  });
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'offen':
      return tasks.filter((t) => !t.done);
    case 'erledigt':
      return tasks.filter((t) => t.done);
    case 'alle':
      return [...tasks];
  }
}

/**
 * Eine Aufgabe ist überfällig, wenn sie offen ist und ihr Termin vor `today` liegt.
 * `today` wird hereingereicht statt `new Date()` zu rufen: so bleibt die
 * Funktion rein und der Test kann ein festes Datum vorgeben.
 */
export function isOverdue(task: Task, today: Date): boolean {
  if (task.done || !task.dueDate) return false;
  return new Date(task.dueDate).getTime() < startOfDay(today).getTime();
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Wirft bei ungültigem Titel; Tests prüfen das mit `toThrow`. */
export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length < 3) {
    throw new Error('Titel muss mindestens 3 Zeichen haben');
  }
  return trimmed;
}
