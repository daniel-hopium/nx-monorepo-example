import { Injectable } from '@angular/core';

/**
 * Kapselt "jetzt" hinter einem Service.
 *
 * Warum? Code, der direkt `new Date()` aufruft, liefert jeden Tag ein
 * anderes Ergebnis und ist damit nicht deterministisch testbar. Über
 * Dependency Injection kann ein Test stattdessen eine feste Uhr
 * bereitstellen: `{ provide: Clock, useValue: { now: () => new Date('2026-09-14') } }`.
 */
@Injectable({ providedIn: 'root' })
export class Clock {
  now(): Date {
    return new Date();
  }
}
