/**
 * Service-Test mit den drei wichtigsten Mock-Techniken:
 *
 *  1. vi.mock('./modul')     ersetzt ein ganzes ES-Modul (hier: die Zufalls-Id).
 *                            Wird vom Bundler an den Dateianfang gehoben (hoisted),
 *                            deshalb darf die Factory keine Variablen von außen nutzen.
 *  2. { provide, useValue }  ersetzt eine DI-Abhängigkeit durch ein Objekt.
 *  3. vi.spyOn(obj, 'fn')    beobachtet eine echte Methode: sie läuft weiter,
 *                            aber wir können prüfen, ob und womit sie gerufen wurde.
 *
 * HTTP wird nicht gemockt, sondern abgefangen: `provideHttpClientTesting()`
 * ersetzt das Backend durch den HttpTestingController. Der Test spielt Server.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Clock } from './clock';
import { NotificationService } from './notification-service';
import { Task } from './task';
import { TaskService } from './task-service';

// (1) Modul-Mock: generateId liefert jetzt immer 'fixed-id'.
vi.mock('../util/id', () => ({
  generateId: () => 'fixed-id',
}));

const fixtures: Task[] = [
  { id: 't-1', title: 'Alt', priority: 'hoch', done: false, dueDate: '2026-09-01' },
  { id: 't-2', title: 'Neu', priority: 'niedrig', done: false, dueDate: '2026-12-01' },
  { id: 't-3', title: 'Fertig', priority: 'mittel', done: true, dueDate: null },
];

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), // muss NACH provideHttpClient stehen
        // (2) feste Uhr: "heute" ist der 14.9.2026
        { provide: Clock, useValue: { now: () => new Date('2026-09-14T09:00:00') } },
      ],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(NotificationService);
  });

  describe('load()', () => {
    it('lädt Aufgaben per GET /tasks.json', async () => {
      // Act: load() startet den Request, aber wartet auf die Antwort.
      const loading = service.load();
      expect(service.loading()).toBe(true);

      // Der Controller erwartet genau einen offenen Request auf diese URL...
      const req = http.expectOne('/tasks.json');
      expect(req.request.method).toBe('GET');
      // ...und wir beantworten ihn selbst.
      req.flush(fixtures);
      await loading;

      expect(service.tasks()).toEqual(fixtures);
      expect(service.loading()).toBe(false);
      http.verify(); // keine unerwarteten Requests offen
    });

    it('meldet einen Fehler über den NotificationService', async () => {
      // (3) Spion auf der echten Methode
      const notify = vi.spyOn(notifications, 'notify');

      const loading = service.load();
      http.expectOne('/tasks.json').flush('kaputt', { status: 500, statusText: 'Server Error' });
      await loading;

      expect(service.tasks()).toEqual([]);
      expect(notify).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledWith('Aufgaben konnten nicht geladen werden', 'error');
    });
  });

  describe('add()', () => {
    it('legt eine Aufgabe mit deterministischer Id an', () => {
      const notify = vi.spyOn(notifications, 'notify');

      const created = service.add('  Testen lernen ', 'hoch', '2026-10-01');

      expect(created).toEqual({
        id: 'fixed-id', // kommt aus dem Modul-Mock
        title: 'Testen lernen', // getrimmt durch validateTitle
        priority: 'hoch',
        done: false,
        dueDate: '2026-10-01',
      });
      expect(service.tasks()).toContainEqual(created);
      expect(notify).toHaveBeenCalledWith('"Testen lernen" angelegt');
    });

    it('lehnt ungültige Titel ab und ändert nichts', () => {
      expect(() => service.add('ab', 'mittel')).toThrow();
      expect(service.tasks()).toEqual([]);
    });
  });

  describe('Zustandsänderungen', () => {
    beforeEach(async () => {
      const loading = service.load();
      http.expectOne('/tasks.json').flush(fixtures);
      await loading;
    });

    it('toggle() dreht done um', () => {
      service.toggle('t-1');
      expect(service.tasks().find((t) => t.id === 't-1')?.done).toBe(true);

      service.toggle('t-1');
      expect(service.tasks().find((t) => t.id === 't-1')?.done).toBe(false);
    });

    it('remove() entfernt die Aufgabe', () => {
      service.remove('t-2');
      expect(service.tasks().map((t) => t.id)).toEqual(['t-1', 't-3']);
    });

    it('computed-Zähler folgen dem Zustand', () => {
      expect(service.openCount()).toBe(2);
      expect(service.overdueCount()).toBe(1); // t-1 (1.9.) ist vor dem 14.9.

      service.toggle('t-1');
      expect(service.openCount()).toBe(1);
      expect(service.overdueCount()).toBe(0);
    });
  });
});
