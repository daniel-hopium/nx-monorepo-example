/**
 * Service-Test mit Fake Timers.
 *
 * Der Service löscht Meldungen nach 3 Sekunden. Echte 3 Sekunden warten wäre
 * langsam und flaky. Mit Fake Timers "spulen" wir die Zeit vor:
 * `vi.advanceTimersByTime(3000)` führt alle Timer aus, die bis dahin fällig sind.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    // providedIn: 'root' -> TestBed.inject liefert die Instanz ohne weitere Konfiguration.
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fügt eine Meldung hinzu', () => {
    service.notify('Hallo');

    expect(service.messages()).toHaveLength(1);
    // toMatchObject: nur die genannten Felder müssen passen, `id` ist egal.
    expect(service.messages()[0]).toMatchObject({ text: 'Hallo', kind: 'info' });
  });

  it('entfernt die Meldung nach Ablauf der Zeit', () => {
    service.notify('Weg damit', 'info', 3000);
    expect(service.messages()).toHaveLength(1);

    vi.advanceTimersByTime(2999);
    expect(service.messages()).toHaveLength(1); // noch da

    vi.advanceTimersByTime(1);
    expect(service.messages()).toHaveLength(0); // jetzt weg
  });

  it('dismiss entfernt gezielt eine Meldung', () => {
    service.notify('eins');
    service.notify('zwei');
    const [first] = service.messages();

    service.dismiss(first.id);

    expect(service.messages().map((n) => n.text)).toEqual(['zwei']);
  });
});
