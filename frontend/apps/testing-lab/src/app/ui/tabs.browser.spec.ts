/**
 * TABS (Browser): Tastatur-Navigation
 *
 * Laut WAI-ARIA-Muster bedienen Nutzer Tabs mit Pfeiltasten, Home und End.
 * Das braucht echten Fokus, also den Browser. Jede Assertion prüft zwei
 * Dinge: welcher Reiter ausgewählt ist UND welcher den Fokus hat.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tab, Tabs } from './tabs';

@Component({
  imports: [Tabs, Tab],
  template: `
    <button type="button">Davor</button>
    <lab-tabs ariaLabel="Einstellungen">
      <lab-tab label="Profil">Profil-Inhalt</lab-tab>
      <lab-tab label="Sicherheit">Sicherheit-Inhalt</lab-tab>
      <lab-tab label="Benachrichtigungen">Benachrichtigungen-Inhalt</lab-tab>
    </lab-tabs>
  `,
})
class Host {}

describe('Tabs (Browser)', () => {
  const tab = (name: string) => page.getByRole('tab', { name });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('Tab-Taste landet nur auf dem aktiven Reiter (roving tabindex)', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Davor' }));
    await userEvent.keyboard('{Tab}');

    await expect.element(tab('Profil')).toHaveFocus();
  });

  it('Pfeil rechts wählt den nächsten Reiter und fokussiert ihn', async () => {
    await userEvent.click(tab('Profil'));
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(tab('Sicherheit')).toHaveFocus();
    await expect.element(tab('Sicherheit')).toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByRole('tabpanel')).toHaveTextContent('Sicherheit-Inhalt');
  });

  it('Pfeil links am Anfang springt ans Ende (Wrap-around)', async () => {
    await userEvent.click(tab('Profil'));
    await userEvent.keyboard('{ArrowLeft}');

    await expect.element(tab('Benachrichtigungen')).toHaveFocus();
  });

  it('Home und End springen an die Ränder', async () => {
    await userEvent.click(tab('Sicherheit'));

    await userEvent.keyboard('{End}');
    await expect.element(tab('Benachrichtigungen')).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect.element(tab('Profil')).toHaveFocus();
    await expect.element(page.getByRole('tabpanel')).toHaveTextContent('Profil-Inhalt');
  });

  it('die Reiter-Leiste hat einen zugänglichen Namen', async () => {
    await expect.element(page.getByRole('tablist', { name: 'Einstellungen' })).toBeVisible();
  });
});
