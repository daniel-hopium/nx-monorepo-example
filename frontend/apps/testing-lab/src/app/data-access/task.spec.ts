/**
 * STUFE 1: Reine Unit-Tests ohne Angular.
 *
 * Aufbau jedes Tests (AAA-Muster):
 *   Arrange  - Testdaten vorbereiten
 *   Act      - die Funktion aufrufen
 *   Assert   - das Ergebnis mit `expect(...)` prüfen
 *
 * `describe` gruppiert Tests, `it` (Alias: `test`) ist ein einzelner Fall.
 * Der Testname sollte einen Satz ergeben: "sortTasks stellt offene Aufgaben nach vorne".
 */
import { describe, expect, it } from 'vitest';
import { filterTasks, isOverdue, sortTasks, Task, validateTitle } from './task';

/**
 * Test-Factory: baut eine gültige Aufgabe und erlaubt, einzelne Felder zu
 * überschreiben. So bleibt jeder Test kurz und zeigt nur, was für ihn wichtig ist.
 */
function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id',
    title: 'Aufgabe',
    priority: 'mittel',
    done: false,
    dueDate: null,
    ...overrides,
  };
}

describe('sortTasks', () => {
  it('stellt offene Aufgaben vor erledigte', () => {
    // Arrange
    const tasks = [task({ id: 'a', done: true }), task({ id: 'b', done: false })];
    // Act
    const result = sortTasks(tasks);
    // Assert: `map` reduziert auf das, was uns interessiert (die Reihenfolge der Ids)
    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('sortiert innerhalb der offenen nach Priorität hoch > mittel > niedrig', () => {
    const tasks = [
      task({ id: 'n', priority: 'niedrig' }),
      task({ id: 'h', priority: 'hoch' }),
      task({ id: 'm', priority: 'mittel' }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['h', 'm', 'n']);
  });

  it('sortiert bei gleicher Priorität alphabetisch nach Titel', () => {
    const tasks = [task({ id: 'z', title: 'Zebra' }), task({ id: 'a', title: 'Apfel' })];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['a', 'z']);
  });

  it('verändert das Original nicht (Immutability)', () => {
    const tasks = [task({ id: 'a', done: true }), task({ id: 'b' })];
    sortTasks(tasks);
    // `toBe` prüft Identität (===), `toEqual` strukturelle Gleichheit.
    expect(tasks[0].id).toBe('a');
  });
});

describe('filterTasks', () => {
  const tasks = [task({ id: 'offen' }), task({ id: 'fertig', done: true })];

  // `it.each` führt denselben Test mit mehreren Datensätzen aus:
  // eine Tabelle statt drei fast identischer Tests.
  it.each([
    ['alle', ['offen', 'fertig']],
    ['offen', ['offen']],
    ['erledigt', ['fertig']],
  ] as const)('Filter "%s" liefert %j', (filter, expectedIds) => {
    expect(filterTasks(tasks, filter).map((t) => t.id)).toEqual(expectedIds);
  });
});

describe('isOverdue', () => {
  // Ein festes "heute" statt new Date(): der Test ergibt an jedem Tag dasselbe.
  const today = new Date('2026-09-14T10:30:00');

  it('ist überfällig, wenn der Termin vor heute liegt', () => {
    expect(isOverdue(task({ dueDate: '2026-09-13' }), today)).toBe(true);
  });

  it('ist am Termintag selbst noch nicht überfällig', () => {
    expect(isOverdue(task({ dueDate: '2026-09-14' }), today)).toBe(false);
  });

  it('erledigte Aufgaben sind nie überfällig', () => {
    expect(isOverdue(task({ dueDate: '2000-01-01', done: true }), today)).toBe(false);
  });

  it('ohne Termin nicht überfällig', () => {
    expect(isOverdue(task({ dueDate: null }), today)).toBe(false);
  });
});

describe('validateTitle', () => {
  it('trimmt Leerzeichen', () => {
    expect(validateTitle('  Einkaufen  ')).toBe('Einkaufen');
  });

  it('wirft bei zu kurzem Titel', () => {
    // Wichtig: die Funktion in einen Wrapper packen, sonst fliegt der Fehler
    // schon beim Auswerten des Arguments und nicht innerhalb von expect.
    expect(() => validateTitle('ab')).toThrow('mindestens 3 Zeichen');
  });
});
