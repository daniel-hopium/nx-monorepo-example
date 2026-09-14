/**
 * Integrationstest im Browser: Seite + Formular + Liste + echter TaskService.
 *
 * Nur die Ränder werden gemockt:
 *  - HTTP über HttpTestingController (wir spielen Server)
 *  - Clock über useValue
 * Alles dazwischen (Service-Logik, Signale, Kind-Komponenten) läuft echt.
 * Das ist der teuerste, aber realistischste Test in diesem Projekt.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Clock } from '../data-access/clock';
import { Task } from '../data-access/task';
import { TaskListPage } from './task-list-page';

const seed: Task[] = [
  { id: 't-1', title: 'Alte Aufgabe', priority: 'hoch', done: false, dueDate: '2026-09-01' },
  { id: 't-2', title: 'Fertige Aufgabe', priority: 'niedrig', done: true, dueDate: null },
];

describe('TaskListPage (Browser, Integration)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Clock, useValue: { now: () => new Date('2026-09-14') } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskListPage);
    await fixture.whenStable(); // Konstruktor hat load() gestartet

    // Server spielen: den offenen GET beantworten.
    TestBed.inject(HttpTestingController).expectOne('/tasks.json').flush(seed);
  });

  it('zeigt die geladenen Aufgaben und den Zähler', async () => {
    await expect.element(page.getByText('Alte Aufgabe')).toBeVisible();
    await expect.element(page.getByText('Fertige Aufgabe')).toBeVisible();
    await expect.element(page.getByText('2 von 2')).toBeVisible();
  });

  it('neue Aufgabe über das Formular landet in der Liste und ein Toast-Text im Service', async () => {
    await userEvent.fill(page.getByPlaceholder('Was ist zu tun?'), 'Ganz neu');
    await userEvent.click(page.getByRole('button', { name: 'Hinzufügen' }));

    await expect.element(page.getByText('Ganz neu')).toBeVisible();
    await expect.element(page.getByText('3 von 3')).toBeVisible();
  });

  it('Filter "Erledigt" blendet offene aus', async () => {
    await userEvent.selectOptions(page.getByLabelText('Filter'), 'erledigt');

    await expect.element(page.getByText('Fertige Aufgabe')).toBeVisible();
    await expect.element(page.getByText('Alte Aufgabe')).not.toBeInTheDocument();
    await expect.element(page.getByText('1 von 2')).toBeVisible();
  });

  it('Abhaken und Löschen wirken auf den echten Service', async () => {
    await userEvent.click(page.getByRole('checkbox', { name: 'Alte Aufgabe' }));
    await expect.element(page.getByRole('checkbox', { name: 'Alte Aufgabe' })).toBeChecked();

    await userEvent.click(page.getByRole('button', { name: 'Löschen: Fertige Aufgabe' }));
    await expect.element(page.getByText('Fertige Aufgabe')).not.toBeInTheDocument();
    await expect.element(page.getByText('1 von 1')).toBeVisible();
  });
});
