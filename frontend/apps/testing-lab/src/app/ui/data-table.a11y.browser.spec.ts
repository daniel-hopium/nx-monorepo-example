/**
 * BARRIEREFREIHEIT einer Tabelle: klickbare Zeilen per Tastatur
 *
 * Ein `(click)` auf <tr> sieht mit der Maus gut aus, ist aber eine klassische
 * a11y-Falle: eine Tabellenzeile ist KEIN Bedienelement. Sie bekommt keinen
 * Fokus, reagiert nicht auf Enter und hat keinen Namen. Tastatur- und
 * Screenreader-Nutzer kommen an die Aktion nicht heran.
 *
 * Dieser Test hat genau das zuerst aufgedeckt (er schlug fehl). Die Lösung in
 * data-table.ts: Mit dem Input `rowActionLabel` bekommt die erste Zelle
 * einen echten <button>. Echte Buttons sind fokussierbar, reagieren auf
 * Enter/Leertaste und haben einen Namen, ohne dass wir das nachbauen.
 *
 * Vorgehen, das man sich merken kann: erst den a11y-Test schreiben und rot
 * sehen, dann die Komponente fixen, bis er grün ist.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Column, DataTable } from './data-table';

type Row = { name: string; rolle: string };

@Component({
  imports: [DataTable],
  template: `
    <button type="button">Vorher</button>
    <lab-data-table
      caption="Team"
      [columns]="columns"
      [rows]="rows"
      [rowActionLabel]="openLabel"
      (rowClick)="opened.set($event.name)"
    />
    <p data-testid="opened">{{ opened() }}</p>
  `,
})
class Host {
  readonly columns: Column<Row>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'rolle', label: 'Rolle' },
  ];
  readonly rows: Row[] = [
    { name: 'Ada', rolle: 'Entwicklerin' },
    { name: 'Linus', rolle: 'Maintainer' },
  ];
  readonly opened = signal('');
  readonly openLabel = (row: Row) => `${row.name} öffnen`;
}

describe('DataTable: Barrierefreiheit', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('die Tabelle hat einen Namen aus der <caption>', async () => {
    await expect.element(page.getByRole('table')).toHaveAccessibleName('Team');
  });

  it('der Sortier-Button nennt seinen Zweck, die Richtung steht in aria-sort', async () => {
    const sortButton = page.getByRole('button', { name: /^Name/ });
    // Vorher hieß der Button nur "Name": ein Screenreader-Nutzer wüsste nicht,
    // dass er sortiert. Das Pfeil-Symbol ist aria-hidden und zählt nicht mit.
    await expect.element(sortButton).toHaveAccessibleName('Name sortieren');

    await userEvent.click(sortButton);
    await expect.element(page.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('jede Zeilen-Aktion ist per Tab erreichbar und hat einen eindeutigen Namen', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Vorher' }));

    await userEvent.keyboard('{Tab}'); // Sortier-Button
    await userEvent.keyboard('{Tab}'); // erste Zeile
    const first = page.getByRole('button', { name: 'Ada öffnen' });
    await expect.element(first).toHaveFocus();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'Linus öffnen' })).toHaveFocus();
  });

  it('Enter auf der fokussierten Zeile löst dieselbe Aktion aus wie ein Mausklick', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Vorher' }));
    await userEvent.keyboard('{Tab}{Tab}{Enter}');

    await expect.element(page.getByTestId('opened')).toHaveTextContent('Ada');
  });

  it('ohne rowActionLabel gibt es keine überflüssigen Buttons', async () => {
    // Nur Bedienelemente, die etwas tun, gehören in die Tab-Reihenfolge.
    TestBed.resetTestingModule();
    @Component({
      imports: [DataTable],
      template: `<lab-data-table [columns]="columns" [rows]="rows" />`,
    })
    class ReadOnlyHost {
      readonly columns: Column<Row>[] = [{ key: 'name', label: 'Name' }];
      readonly rows: Row[] = [{ name: 'Ada', rolle: 'x' }];
    }
    await TestBed.configureTestingModule({ imports: [ReadOnlyHost] }).compileComponents();
    await TestBed.createComponent(ReadOnlyHost).whenStable();

    await expect.element(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Ada öffnen' })).not.toBeInTheDocument();
  });
});
