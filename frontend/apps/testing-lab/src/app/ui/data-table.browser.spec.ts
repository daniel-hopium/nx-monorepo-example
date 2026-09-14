/**
 * TABLE (Browser)
 *
 * Tabellen haben eigene ARIA-Rollen, die der Browser automatisch vergibt:
 *   <table> = table, <tr> = row, <th scope="col"> = columnheader, <td> = cell
 * Mit `getByRole('row').nth(i)` greift man gezielt auf eine Zeile zu.
 * Zeile 0 ist die Kopfzeile, die Daten beginnen bei 1.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Column, DataTable } from './data-table';

type Product = { artikel: string; preis: number };

@Component({
  imports: [DataTable],
  template: `
    <lab-data-table caption="Produkte" [columns]="columns" [rows]="rows" (rowClick)="selected.set($event.artikel)" />
    <p data-testid="selected">{{ selected() }}</p>
  `,
})
class Host {
  readonly columns: Column<Product>[] = [
    { key: 'artikel', label: 'Artikel', sortable: true },
    { key: 'preis', label: 'Preis', sortable: true },
  ];
  readonly rows: Product[] = [
    { artikel: 'Maus', preis: 25 },
    { artikel: 'Monitor', preis: 199 },
    { artikel: 'Kabel', preis: 5 },
  ];
  readonly selected = signal('');
}

describe('DataTable (Browser)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('die Tabelle ist über ihre Caption auffindbar', async () => {
    await expect.element(page.getByRole('table', { name: 'Produkte' })).toBeVisible();
    await expect.element(page.getByRole('columnheader', { name: /Preis/ })).toBeVisible();
  });

  it('Klick auf "Preis" sortiert, die erste Datenzeile ändert sich', async () => {
    const firstDataRow = page.getByRole('row').nth(1);
    await expect.element(firstDataRow).toHaveTextContent('Maus');

    await userEvent.click(page.getByRole('button', { name: /Preis/ }));

    await expect.element(firstDataRow).toHaveTextContent('Kabel');
    await expect
      .element(page.getByRole('columnheader', { name: /Preis/ }))
      .toHaveAttribute('aria-sort', 'ascending');
  });

  it('Sortierung per Tastatur: Tab auf den Kopf, Enter', async () => {
    await userEvent.click(page.getByRole('button', { name: /Artikel/ })); // Fokus + 1. Sortierung (auf)
    await userEvent.keyboard('{Enter}'); // 2. Sortierung (ab)

    await expect.element(page.getByRole('row').nth(1)).toHaveTextContent('Monitor');
  });

  it('Klick auf eine Zeile meldet den Datensatz', async () => {
    await userEvent.click(page.getByRole('cell', { name: 'Monitor' }));
    await expect.element(page.getByTestId('selected')).toHaveTextContent('Monitor');
  });
});
