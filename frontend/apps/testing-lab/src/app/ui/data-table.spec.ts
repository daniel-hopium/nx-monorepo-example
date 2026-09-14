/**
 * TABLE (jsdom)
 *
 * Tabellen testet man in drei Ebenen:
 *  1. Struktur: Kopfzeilen, Zellen, Leerzustand
 *  2. Verhalten: Sortierung über Klick auf den Spaltenkopf
 *  3. Semantik: `aria-sort` am <th>, `scope="col"`
 *
 * Helfer wie `cellTexts()` machen Assertions lesbar: statt DOM-Code im Test
 * steht dort nur noch `expect(column(0)).toEqual([...])`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Column, DataTable } from './data-table';

type Person = { name: string; alter: number; ort: string };

const columns: Column<Person>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'alter', label: 'Alter', sortable: true },
  { key: 'ort', label: 'Ort' }, // nicht sortierbar
];

const rows: Person[] = [
  { name: 'Bernd', alter: 42, ort: 'Wien' },
  { name: 'anna', alter: 9, ort: 'Graz' },
  { name: 'Clara', alter: 100, ort: 'Linz' },
];

describe('DataTable', () => {
  let fixture: ComponentFixture<DataTable<Person>>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DataTable] }).compileComponents();
    // Generische Komponente direkt erzeugen; der Typparameter kommt aus ComponentFixture.
    fixture = TestBed.createComponent<DataTable<Person>>(DataTable);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('caption', 'Personen');
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  // --- Helfer ---
  const headers = () => Array.from(el.querySelectorAll('th')).map((th) => th.textContent?.trim());
  // trim(): textContent enthält Zeilenumbrüche und Leerzeichen aus dem Template
  // (z. B. rund um @if). Für den Test zählt nur der sichtbare Text.
  const column = (index: number) =>
    Array.from(el.querySelectorAll('tbody tr')).map((tr) => tr.querySelectorAll('td')[index]?.textContent?.trim());
  const header = (label: string) =>
    Array.from(el.querySelectorAll('th')).find((th) => th.textContent?.includes(label)) as HTMLTableCellElement;
  const clickHeader = async (label: string) => {
    (header(label).querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
  };

  describe('Struktur', () => {
    it('zeigt Caption und Spaltenköpfe', () => {
      expect(el.querySelector('caption')?.textContent).toBe('Personen');
      expect(headers()).toEqual(['Name ⇅', 'Alter ⇅', 'Ort']);
    });

    it('rendert eine Zeile pro Datensatz in Originalreihenfolge', () => {
      expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
      expect(column(0)).toEqual(['Bernd', 'anna', 'Clara']);
    });

    it('nur sortierbare Spalten haben einen Button', () => {
      expect(header('Name').querySelector('button')).not.toBeNull();
      expect(header('Ort').querySelector('button')).toBeNull();
    });

    it('zeigt den Leerzustand über alle Spalten', async () => {
      fixture.componentRef.setInput('rows', []);
      await fixture.whenStable();

      const cell = el.querySelector('td.empty') as HTMLTableCellElement;
      expect(cell.textContent).toBe('Keine Einträge');
      expect(cell.colSpan).toBe(3);
    });
  });

  describe('Sortierung', () => {
    it('Text: aufsteigend, ohne Groß-/Kleinschreibung zu bevorzugen', async () => {
      await clickHeader('Name');
      expect(column(0)).toEqual(['anna', 'Bernd', 'Clara']);
    });

    it('Zahlen numerisch, nicht als Text (sonst käme 100 vor 42)', async () => {
      await clickHeader('Alter');
      expect(column(1)).toEqual(['9', '42', '100']);
    });

    it('Klick-Zyklus: auf -> ab -> unsortiert, mit aria-sort', async () => {
      await clickHeader('Alter');
      expect(header('Alter').getAttribute('aria-sort')).toBe('ascending');

      await clickHeader('Alter');
      expect(header('Alter').getAttribute('aria-sort')).toBe('descending');
      expect(column(1)).toEqual(['100', '42', '9']);

      await clickHeader('Alter');
      expect(header('Alter').hasAttribute('aria-sort')).toBe(false);
      expect(column(0)).toEqual(['Bernd', 'anna', 'Clara']);
    });

    it('verändert das rows-Input nicht (sortiert eine Kopie)', async () => {
      await clickHeader('Name');
      expect(rows.map((r) => r.name)).toEqual(['Bernd', 'anna', 'Clara']);
    });

    it('der Zustand ist auch direkt über die Komponente prüfbar', () => {
      // Manchmal ist es einfacher, die öffentliche API zu testen statt Klicks.
      fixture.componentInstance.toggleSort('name');
      expect(fixture.componentInstance.sort()).toEqual({ key: 'name', dir: 'asc' });
    });
  });

  it('rowClick meldet den kompletten Datensatz', () => {
    const spy = vi.fn();
    fixture.componentInstance.rowClick.subscribe(spy);

    (el.querySelectorAll('tbody tr')[2] as HTMLTableRowElement).click();

    expect(spy).toHaveBeenCalledWith({ name: 'Clara', alter: 100, ort: 'Linz' });
  });
});
