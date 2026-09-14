/**
 * Komponententest mit Inputs, Outputs und einer gemockten Abhängigkeit.
 *
 * Neu hier:
 *  - Outputs testen: mit `vi.fn()` einen Spion anmelden und prüfen, ob und
 *    womit er gerufen wurde.
 *  - Events auslösen: `element.click()` bzw. `dispatchEvent(new Event('change'))`
 *    stößt Angulars Event-Binding an.
 *  - `fixture.debugElement.query(By.css(...))` als Alternative zu querySelector,
 *    liefert zusätzlich Zugriff auf Komponenteninstanzen.
 */
import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Clock } from '../data-access/clock';
import { Task } from '../data-access/task';
import { TaskItem } from './task-item';

const baseTask: Task = {
  id: 't-1',
  title: 'Tests schreiben',
  priority: 'hoch',
  done: false,
  dueDate: '2026-09-10',
};

describe('TaskItem', () => {
  async function render(task: Task) {
    await TestBed.configureTestingModule({
      imports: [TaskItem],
      providers: [{ provide: Clock, useValue: { now: () => new Date('2026-09-14') } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskItem);
    fixture.componentRef.setInput('task', task);
    await fixture.whenStable();
    return fixture;
  }

  it('rendert Titel, Badge und relative Zeit', async () => {
    const fixture = await render(baseTask);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.title')?.textContent).toBe('Tests schreiben');
    expect(el.querySelector('lab-priority-badge')?.textContent?.trim()).toBe('Hoch');
    expect(el.querySelector('.due')?.textContent?.trim()).toBe('vor 4 Tagen');
  });

  it('markiert überfällige Aufgaben', async () => {
    const fixture = await render(baseTask);
    const li = fixture.debugElement.query(By.css('.item'));
    expect(li.classes['overdue']).toBe(true);
  });

  it('erledigte Aufgaben sind durchgestrichen und nicht überfällig', async () => {
    const fixture = await render({ ...baseTask, done: true });
    const li = fixture.debugElement.query(By.css('.item'));
    expect(li.classes['done']).toBe(true);
    expect(li.classes['overdue']).toBeFalsy();
  });

  it('meldet toggled mit der Id, wenn die Checkbox geändert wird', async () => {
    const fixture = await render(baseTask);
    // Spion auf dem Output: output() ist ein OutputEmitterRef mit subscribe().
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);

    const checkbox = fixture.nativeElement.querySelector('input[type=checkbox]') as HTMLInputElement;
    checkbox.dispatchEvent(new Event('change'));

    expect(toggled).toHaveBeenCalledExactlyOnceWith('t-1');
  });

  it('meldet removed beim Klick auf Löschen', async () => {
    const fixture = await render(baseTask);
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);

    (fixture.nativeElement.querySelector('.remove') as HTMLButtonElement).click();

    expect(removed).toHaveBeenCalledWith('t-1');
  });
});
