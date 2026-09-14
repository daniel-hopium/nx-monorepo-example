/**
 * TABS (jsdom)
 *
 * `contentChildren` (die geschachtelten <lab-tab>) funktioniert nur, wenn die
 * Kinder wirklich im Template eines Hosts stehen. Deshalb auch hier eine
 * Host-Komponente. jsdom reicht für Klicks und ARIA-Attribute; echte
 * Tastatur-Navigation mit Fokus steht im Browser-Test.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tab, Tabs } from './tabs';

@Component({
  imports: [Tabs, Tab],
  template: `
    <lab-tabs [(selected)]="selected">
      <lab-tab label="Allgemein">Inhalt Allgemein</lab-tab>
      <lab-tab label="Details">Inhalt Details</lab-tab>
      <lab-tab label="Verlauf">Inhalt Verlauf</lab-tab>
    </lab-tabs>
  `,
})
class Host {
  readonly selected = signal(0);
}

describe('Tabs', () => {
  let fixture: ComponentFixture<Host>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  const tabButtons = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role=tab]'));
  const panels = () => Array.from(el.querySelectorAll('[role=tabpanel]'));

  it('rendert einen Reiter pro <lab-tab>', () => {
    expect(tabButtons().map((b) => b.textContent?.trim())).toEqual(['Allgemein', 'Details', 'Verlauf']);
  });

  it('zeigt nur das Panel des aktiven Reiters', () => {
    expect(panels()).toHaveLength(1);
    expect(panels()[0].textContent?.trim()).toBe('Inhalt Allgemein');
  });

  it('Klick wechselt Reiter, Panel und das Signal im Host', async () => {
    tabButtons()[2].click();
    await fixture.whenStable();

    expect(panels()[0].textContent?.trim()).toBe('Inhalt Verlauf');
    expect(fixture.componentInstance.selected()).toBe(2);
  });

  it('ARIA: aria-selected, roving tabindex und Verknüpfung Tab <-> Panel', () => {
    const [first, second] = tabButtons();

    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(second.getAttribute('aria-selected')).toBe('false');
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);

    const panel = panels()[0];
    expect(first.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
  });

  it('Host kann den Reiter von außen setzen', async () => {
    fixture.componentInstance.selected.set(1);
    await fixture.whenStable();
    expect(panels()[0].textContent?.trim()).toBe('Inhalt Details');
  });
});
