/**
 * Browser-Test mit Host-Komponente.
 *
 * Statt `setInput` bauen wir eine kleine Test-Komponente, die TaskItem so
 * benutzt wie die echte App: mit Template-Bindings für Input und Outputs.
 * Das testet zusätzlich, dass Selector, Input- und Output-Namen stimmen.
 *
 * Außerdem: echtes CSS. Der Browser rendert die Styles der Komponente, daher
 * können wir prüfen, dass "done" den Titel wirklich durchstreicht.
 */
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Clock } from '../data-access/clock';
import { Task } from '../data-access/task';
import { TaskItem } from './task-item';

@Component({
  imports: [TaskItem],
  template: `
    <ul>
      <lab-task-item [task]="task()" (toggled)="toggle()" (removed)="removedId.set($event)" />
    </ul>
  `,
})
class Host {
  readonly task = signal<Task>({
    id: 't-9',
    title: 'Im Browser testen',
    priority: 'mittel',
    done: false,
    dueDate: '2026-09-20',
  });
  readonly removedId = signal<string | null>(null);

  toggle() {
    this.task.update((t) => ({ ...t, done: !t.done }));
  }
}

describe('TaskItem (Browser)', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: Clock, useValue: { now: () => new Date('2026-09-14') } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture;
  }

  it('zeigt Titel, Badge und "in 6 Tagen"', async () => {
    await setup();
    await expect.element(page.getByText('Im Browser testen')).toBeVisible();
    await expect.element(page.getByText('Mittel')).toBeVisible();
    await expect.element(page.getByText('in 6 Tagen')).toBeVisible();
  });

  it('Klick auf die Checkbox streicht den Titel durch (echtes CSS)', async () => {
    const fixture = await setup();
    const checkbox = page.getByRole('checkbox', { name: 'Im Browser testen' });

    await userEvent.click(checkbox);

    expect(fixture.componentInstance.task().done).toBe(true);
    await expect.element(checkbox).toBeChecked();
    // getComputedStyle liefert das wirklich gerenderte CSS, jsdom könnte das nicht.
    const title = page.getByText('Im Browser testen').element();
    await expect.poll(() => getComputedStyle(title).textDecorationLine).toBe('line-through');
  });

  it('Löschen-Button meldet die Id', async () => {
    const fixture = await setup();
    await userEvent.click(page.getByRole('button', { name: 'Löschen: Im Browser testen' }));
    expect(fixture.componentInstance.removedId()).toBe('t-9');
  });
});
