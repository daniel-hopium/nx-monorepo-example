import { inject, Pipe, PipeTransform } from '@angular/core';
import { Clock } from '../data-access/clock';

/**
 * Wandelt ein ISO-Datum in "in 3 Tagen", "heute", "vor 2 Tagen" um.
 *
 * Eine Pipe ist eine Klasse mit `transform()`. Weil sie die Uhr injiziert,
 * gibt es zwei Testarten: direkt instanziieren (`new RelativeTimePipe(clock)`
 * geht hier nicht wegen inject()) oder über TestBed.runInInjectionContext.
 * Alternativ: Fake Timers mit `vi.setSystemTime()` steuern `new Date()`.
 */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private readonly clock = inject(Clock);

  transform(isoDate: string | null | undefined): string {
    if (!isoDate) return 'kein Termin';

    const target = new Date(isoDate);
    const today = this.clock.now();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const diff = Math.round((target.getTime() - today.getTime()) / dayMs);

    if (diff === 0) return 'heute';
    if (diff === 1) return 'morgen';
    if (diff === -1) return 'gestern';
    return diff > 0 ? `in ${diff} Tagen` : `vor ${-diff} Tagen`;
  }
}
