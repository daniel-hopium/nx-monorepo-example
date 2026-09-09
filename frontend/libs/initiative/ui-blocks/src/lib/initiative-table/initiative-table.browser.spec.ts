import { describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Initiative } from '@monorepo/initiative-domain';
import { InitiativeTable, SortChange } from './initiative-table';

const rows: Initiative[] = [
  {
    id: 1,
    name: 'Mobilität',
    freigabe: 'Freigabe offen',
    manager: 'Conny Bauer',
    gesamtstatus: 'Grün',
    phase: 'Geplant',
    reportingBis: null,
    archiviert: false,
  },
  {
    id: 2,
    name: 'Projekt Z',
    freigabe: 'Entwurf',
    manager: 'Richard Wagner',
    gesamtstatus: 'Grün',
    phase: 'Umsetzung',
    reportingBis: '2025-06-30',
    archiviert: false,
  },
];

@Component({
  imports: [InitiativeTable],
  template: `
    <lib-initiative-table [rows]="rows" sortBy="name" sortDir="asc" (sortChange)="last.set($event)" />
  `,
})
class Host {
  readonly rows = rows;
  readonly last = signal<SortChange | null>(null);
}

describe('InitiativeTable (Browser)', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('rendert Zeilen mit Badges und Reporting-Datum', async () => {
    const { el } = await setup();
    const trs = el.querySelectorAll('tbody tr');
    expect(trs.length).toBe(2);
    expect(trs[0].textContent).toContain('Mobilität');
    expect(trs[0].querySelector('.badge.warning')?.textContent?.trim()).toBe('Freigabe offen');
    expect(trs[1].querySelector('.badge.info')?.textContent?.trim()).toBe('Entwurf');
    expect(trs[1].textContent).toContain('zu reporten bis 30.6.2025');
    expect(trs[0].textContent).not.toContain('zu reporten');
  });

  it('meldet beim zweiten Klick auf "Initiative" absteigende Sortierung', async () => {
    const { fixture, el } = await setup();
    const header = Array.from(el.querySelectorAll('th button')).find((b) =>
      b.textContent?.includes('Initiative')
    ) as HTMLButtonElement;

    header.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.last()).toEqual({ sortBy: 'name', sortDir: 'desc' });
  });
});
