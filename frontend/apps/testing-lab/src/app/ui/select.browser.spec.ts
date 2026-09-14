/**
 * SELECT (Browser)
 *
 * `userEvent.selectOptions(locator, wert)` wählt wie ein Nutzer aus und
 * feuert alle passenden Events. Das Select findet man über sein Label
 * (`getByLabelText`): klappt das nicht, ist das Label kaputt verknüpft.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Select } from './select';

@Component({
  imports: [Select],
  template: `
    <lab-select label="Priorität" [options]="options" [(value)]="priority" />
    <p data-testid="output">Gewählt: {{ priority() }}</p>
  `,
})
class Host {
  readonly options = [
    { value: 'hoch', label: 'Hoch' },
    { value: 'mittel', label: 'Mittel' },
    { value: 'niedrig', label: 'Niedrig' },
  ];
  readonly priority = signal('mittel');
}

describe('Select (Browser)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('startet mit dem Wert aus dem Parent', async () => {
    await expect.element(page.getByLabelText('Priorität')).toHaveValue('mittel');
  });

  it('Auswahl per userEvent aktualisiert den Parent', async () => {
    await userEvent.selectOptions(page.getByLabelText('Priorität'), 'hoch');

    await expect.element(page.getByTestId('output')).toHaveTextContent('Gewählt: hoch');
  });

  it('Auswahl über den sichtbaren Text der Option', async () => {
    // selectOptions akzeptiert auch das Label der Option statt des Werts.
    await userEvent.selectOptions(page.getByLabelText('Priorität'), 'Niedrig');

    await expect.element(page.getByTestId('output')).toHaveTextContent('Gewählt: niedrig');
  });
});
