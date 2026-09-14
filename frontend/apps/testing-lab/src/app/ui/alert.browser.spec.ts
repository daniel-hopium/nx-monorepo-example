/**
 * ALERT (Browser)
 *
 * `page.getByRole('alert')` findet Fehlermeldungen so, wie ein Screenreader sie
 * findet. Fehlt die Rolle, schlägt der Test fehl: ein Barrierefreiheits-Test
 * ganz nebenbei.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert } from './alert';

@Component({
  imports: [Alert],
  template: `
    <lab-alert kind="error" title="Speichern fehlgeschlagen" [dismissible]="true">Server nicht erreichbar.</lab-alert>
    <lab-alert kind="success">Gespeichert.</lab-alert>
  `,
})
class Host {}

describe('Alert (Browser)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    await TestBed.createComponent(Host).whenStable();
  });

  it('Fehler ist als role=alert, Erfolg als role=status auffindbar', async () => {
    await expect.element(page.getByRole('alert')).toHaveTextContent('Server nicht erreichbar.');
    await expect.element(page.getByRole('status')).toHaveTextContent('Gespeichert.');
  });

  it('das Icon ist für Screenreader versteckt', async () => {
    // aria-hidden: das "✕"-Icon soll nicht als "Mal-Zeichen" vorgelesen werden.
    const icon = page.getByRole('alert').element().querySelector('.icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('Klick auf "Hinweis schließen" entfernt den Alert aus dem DOM', async () => {
    await userEvent.click(page.getByRole('button', { name: 'Hinweis schließen' }));

    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
    await expect.element(page.getByRole('status')).toBeVisible(); // der andere bleibt
  });
});
