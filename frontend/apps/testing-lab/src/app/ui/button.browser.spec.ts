/**
 * BUTTON (Browser)
 *
 * Was jsdom nicht kann, der Browser aber schon:
 *  - echter Fokus per Tab-Taste (`toHaveFocus`)
 *  - Enter und Leertaste lösen bei einem nativen <button> einen Klick aus
 *  - disabled-Buttons werden beim Tabben übersprungen
 * Genau das beweist, warum der Attribut-Selector (`button[labButton]`) richtig ist.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <button labButton variant="secondary" (click)="log.set([...log(), 'erster'])">Erster</button>
    <button labButton [disabled]="true">Gesperrt</button>
    <button labButton (click)="log.set([...log(), 'zweiter'])">Zweiter</button>
  `,
})
class Host {
  readonly log = signal<string[]>([]);
}

describe('Button (Browser)', () => {
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('ist über die Button-Rolle mit seinem Text auffindbar', async () => {
    await expect.element(page.getByRole('button', { name: 'Erster' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Gesperrt' })).toBeDisabled();
  });

  it('Enter und Leertaste lösen einen Klick aus', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Erster' })); // 1. per Maus
    await userEvent.keyboard('{Enter}'); // 2. Fokus liegt noch auf dem Button
    await userEvent.keyboard(' '); // 3. Leertaste

    expect(host.log()).toEqual(['erster', 'erster', 'erster']);
  });

  it('Tab überspringt den deaktivierten Button', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Erster' }));
    await userEvent.keyboard('{Tab}');

    await expect.element(page.getByRole('button', { name: 'Zweiter' })).toHaveFocus();
  });
});
