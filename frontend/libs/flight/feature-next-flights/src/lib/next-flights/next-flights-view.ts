import { Component, inject, resource } from '@angular/core';
import { FlightService } from '@monorepo/flight-domain';
import { FlightCard } from '@monorepo/flight-ui-blocks';

/**
 * Smart Component des Features: holt Daten über den Domain-Service und
 * reicht sie an Präsentations-Komponenten (ui-blocks) weiter.
 */
@Component({
  imports: [FlightCard],
  templateUrl: './next-flights-view.html',
  styleUrl: './next-flights-view.css',
})
export class NextFlightsView {
  private readonly flightService = inject(FlightService);

  // `resource` verwaltet Laden/Fehler/Wert als Signals; kein manuelles Subscribe nötig.
  protected readonly flights = resource({
    loader: () => this.flightService.loadNextFlights(),
  });
}
