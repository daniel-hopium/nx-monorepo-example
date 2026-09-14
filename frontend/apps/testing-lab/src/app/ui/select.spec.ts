/**
 * SELECT (jsdom)
 *
 * Two-Way-Binding testen heißt: beide Richtungen einzeln prüfen.
 *   1. Parent ändert das Signal     -> das <select> zeigt den neuen Wert
 *   2. Nutzer wählt im <select>     -> das Signal im Parent hat den neuen Wert
 *
 * In jsdom simuliert man die Auswahl so, wie der Browser sie meldet:
 * `select.value = 'x'` setzen und danach das `change`-Event feuern.
 * Nur `value` setzen reicht NICHT, Angular hört auf das Event.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Select, SelectOption } from './select';

@Component({
  imports: [Select],
  template: `<lab-select label="Status" placeholder="Alle" [options]="options" [(value)]="status" />`,
})
class Host {
  readonly options: SelectOption[] = [
    { value: 'offen', label: 'Offen' },
    { value: 'erledigt', label: 'Erledigt' },
  ];
  readonly status = signal('');
}

describe('Select', () => {
  let fixture: ComponentFixture<Host>;
  let select: HTMLSelectElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    select = fixture.nativeElement.querySelector('select');
  });

  it('rendert Platzhalter plus Optionen', () => {
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(['Alle', 'Offen', 'Erledigt']);
  });

  it('das Label ist per for/id mit dem Select verbunden', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(select.id);
    expect(label.textContent).toBe('Status');
  });

  it('Richtung Parent -> Select', async () => {
    fixture.componentInstance.status.set('erledigt');
    await fixture.whenStable();
    expect(select.value).toBe('erledigt');
  });

  it('Richtung Select -> Parent', async () => {
    select.value = 'offen';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.status()).toBe('offen');
  });
});
