/**
 * Pipe-Test mit zwei Techniken für "Zeit":
 *  A) Dependency Injection: die `Clock` wird durch ein festes Objekt ersetzt.
 *  B) Fake Timers: `vi.setSystemTime()` steuert, was `new Date()` liefert.
 *
 * Weil die Pipe `inject()` nutzt, muss sie in einem Injection-Kontext
 * erzeugt werden. `TestBed.runInInjectionContext` liefert genau den.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Clock } from '../data-access/clock';
import { RelativeTimePipe } from './relative-time-pipe';

describe('RelativeTimePipe', () => {
  describe('mit gemockter Clock (Variante A)', () => {
    let pipe: RelativeTimePipe;

    beforeEach(() => {
      TestBed.configureTestingModule({
        // useValue: statt der echten Klasse bekommt jeder, der Clock injiziert,
        // dieses Objekt. Es muss nur die Methoden haben, die benutzt werden.
        providers: [{ provide: Clock, useValue: { now: () => new Date('2026-09-14T12:00:00') } }],
      });
      pipe = TestBed.runInInjectionContext(() => new RelativeTimePipe());
    });

    it.each([
      ['2026-09-14', 'heute'],
      ['2026-09-15', 'morgen'],
      ['2026-09-13', 'gestern'],
      ['2026-09-17', 'in 3 Tagen'],
      ['2026-09-10', 'vor 4 Tagen'],
      [null, 'kein Termin'],
    ])('%s -> "%s"', (input, expected) => {
      expect(pipe.transform(input)).toBe(expected);
    });
  });

  describe('mit Fake Timers (Variante B)', () => {
    beforeEach(() => {
      // Ab hier sind Date, setTimeout, setInterval unter Kontrolle des Tests.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-24T08:00:00'));
    });

    afterEach(() => {
      // Immer aufräumen, sonst leiden andere Tests unter der falschen Uhr.
      vi.useRealTimers();
    });

    it('die echte Clock liefert das gefakte Systemdatum', () => {
      TestBed.configureTestingModule({});
      const pipe = TestBed.runInInjectionContext(() => new RelativeTimePipe());
      expect(pipe.transform('2026-12-25')).toBe('morgen');
    });
  });
});
