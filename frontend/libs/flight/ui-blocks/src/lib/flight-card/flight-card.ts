import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FlightInfoDto } from '@monorepo/flight-domain';

/**
 * Präsentations-Komponente ("dumb component"): bekommt Daten nur über Inputs,
 * hält keinen Zustand und macht keine HTTP-Aufrufe. Dadurch ist sie
 * wiederverwendbar und leicht testbar.
 */
@Component({
  selector: 'lib-flight-card',
  imports: [DatePipe],
  templateUrl: './flight-card.html',
  styleUrl: './flight-card.css',
})
export class FlightCard {
  readonly flight = input.required<FlightInfoDto>();
}
