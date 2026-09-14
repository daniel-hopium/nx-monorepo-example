/**
 * Smart Component testen: der echte TaskService wird durch ein Fake-Objekt
 * ersetzt. Das Fake hat dieselbe "Form" (Signale + Methoden), aber keine
 * Logik. So testet man nur die Seite: Werden Daten gerendert? Werden die
 * richtigen Service-Methoden gerufen?
 *
 * Vorteil gegenüber echtem Service + HttpTestingController: der Test ist
 * kürzer und bricht nicht, wenn sich die Service-Interna ändern.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Clock } from '../data-access/clock';
import { Task } from '../data-access/task';
import { TaskService } from '../data-access/task-service';
import { TaskListPage } from './task-list-page';

const tasks: Task[] = [
  { id: '1', title: 'Erledigt', priority: 'mittel', done: true, dueDate: null },
  { id: '2', title: 'Offen niedrig', priority: 'niedrig', done: false, dueDate: null },
  { id: '3', title: 'Offen hoch', priority: 'hoch', done: false, dueDate: null },
];

/** Fake mit exakt den Mitgliedern, die die Seite benutzt. */
function createTaskServiceFake() {
  return {
    tasks: signal<Task[]>(tasks),
    loading: signal(false),
    load: vi.fn().mockResolvedValue(undefined),
    add: vi.fn(),
    toggle: vi.fn(),
    remove: vi.fn(),
  };
}

describe('TaskListPage', () => {
  let fake: ReturnType<typeof createTaskServiceFake>;

  beforeEach(async () => {
    fake = createTaskServiceFake();
    await TestBed.configureTestingModule({
      imports: [TaskListPage],
      providers: [
        { provide: TaskService, useValue: fake },
        { provide: Clock, useValue: { now: () => new Date('2026-09-14') } },
      ],
    }).compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(TaskListPage);
    await fixture.whenStable();
    return fixture;
  }

  const titles = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.title')).map((n) => n.textContent);

  it('lädt beim Start die Aufgaben', async () => {
    await render();
    expect(fake.load).toHaveBeenCalledTimes(1);
  });

  it('rendert sortiert: offene nach Priorität, erledigte zuletzt', async () => {
    const fixture = await render();
    expect(titles(fixture.nativeElement)).toEqual(['Offen hoch', 'Offen niedrig', 'Erledigt']);
  });

  it('zeigt den Ladezustand statt der Liste', async () => {
    fake.loading.set(true);
    const fixture = await render();
    expect(fixture.nativeElement.textContent).toContain('Lade Aufgaben');
    expect(fixture.nativeElement.querySelector('lab-task-item')).toBeNull();
  });

  it('filtert auf "offen"', async () => {
    const fixture = await render();
    // Achtung: das Formular hat auch ein <select> (Priorität). Selektoren
    // eng genug wählen, sonst testet man das falsche Element.
    const select = fixture.nativeElement.querySelector('.toolbar select') as HTMLSelectElement;

    select.value = 'offen';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(titles(fixture.nativeElement)).toEqual(['Offen hoch', 'Offen niedrig']);
    expect(fixture.nativeElement.querySelector('.count')?.textContent).toBe('2 von 3');
  });

  it('reicht Events der Kinder an den Service weiter', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('input[type=checkbox]') as HTMLInputElement).dispatchEvent(new Event('change'));
    (el.querySelector('.remove') as HTMLButtonElement).click();

    // Erste Zeile ist "Offen hoch" (Id 3)
    expect(fake.toggle).toHaveBeenCalledWith('3');
    expect(fake.remove).toHaveBeenCalledWith('3');
  });

  it('reagiert auf Änderungen im Service-Signal', async () => {
    const fixture = await render();
    fake.tasks.set([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Keine Aufgaben.');
  });
});
