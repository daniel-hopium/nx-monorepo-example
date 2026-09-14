/**
 * Routing testen mit RouterTestingHarness.
 *
 * Statt die Komponente direkt zu erzeugen, navigieren wir wie ein Nutzer
 * auf eine URL. Der Harness rendert das Ziel der Route und gibt es zurück.
 * So wird auch die Routenkonfiguration (Pfad -> Komponente) mitgetestet.
 *
 * Signale im Service-Fake: Ändert der Test `tasks.set(...)`, rendert die
 * Seite nach `fixture.whenStable()` automatisch die neuen Zahlen.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Task } from '../data-access/task';
import { TaskService } from '../data-access/task-service';
import { appRoutes } from '../app.routes';
import { StatsPage } from './stats-page';

describe('StatsPage über den Router', () => {
  const tasks = signal<Task[]>([
    { id: '1', title: 'a', priority: 'hoch', done: false, dueDate: null },
    { id: '2', title: 'b', priority: 'hoch', done: true, dueDate: null },
  ]);
  const fake = {
    tasks,
    loading: signal(false),
    openCount: computed(() => tasks().filter((t) => !t.done).length),
    overdueCount: signal(0),
    // Die Umleitung auf /aufgaben rendert die TaskListPage, die load() ruft.
    load: vi.fn().mockResolvedValue(undefined),
  };

  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes), { provide: TaskService, useValue: fake }],
    });
    harness = await RouterTestingHarness.create();
  });

  it('"/statistik" rendert die StatsPage mit den Zahlen', async () => {
    const page = await harness.navigateByUrl('/statistik', StatsPage);
    expect(page).toBeInstanceOf(StatsPage);

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('[data-testid=open]')?.textContent).toBe('1');
    expect(el.querySelector('[data-testid=total]')?.textContent).toBe('2');
  });

  it('aktualisiert sich, wenn der Service-Zustand wechselt', async () => {
    await harness.navigateByUrl('/statistik');
    tasks.update((list) => [...list, { id: '3', title: 'c', priority: 'niedrig', done: false, dueDate: null }]);
    await harness.fixture.whenStable();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('[data-testid=open]')?.textContent).toBe('2');
  });

  it('leitet unbekannte Pfade auf /aufgaben um', async () => {
    await harness.navigateByUrl('/gibt-es-nicht');
    expect(TestBed.inject(Router).url).toBe('/aufgaben');
  });
});
