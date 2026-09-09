import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigurationService } from '@monorepo/shared-util';
import { CreateFlightDto, Flight } from '../domain/flight';
import { FlightCriteriaDto } from '../dtos/flight-criteria-dto';
import { FlightInfoDto } from '../dtos/flight-info-dto';

/**
 * Data-Access-Service der Domäne "Flight".
 * Kapselt alle HTTP-Zugriffe. Feature-Komponenten kennen keine URLs.
 */
@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(ConfigurationService).configuration.baseUrl;

  loadFlightInfos(criteria: FlightCriteriaDto): Promise<FlightInfoDto[]> {
    return firstValueFrom(
      this.http.get<FlightInfoDto[]>(`${this.baseUrl}/flight-infos`, {
        params: { ...criteria },
      })
    );
  }

  /**
   * Signal-basierte Variante: Ändert sich `criteria`, lädt die Resource
   * automatisch neu. Liefert `undefined` als Request, solange Felder fehlen,
   * dann wird gar nicht erst angefragt.
   */
  createFlightInfosResource(criteria: Signal<FlightCriteriaDto>) {
    return httpResource<FlightInfoDto[]>(
      () => {
        const { from, to } = criteria();
        if (!from || !to) return undefined;
        return { url: `${this.baseUrl}/flight-infos`, params: { from, to } };
      },
      { defaultValue: [] }
    );
  }

  loadNextFlights(): Promise<FlightInfoDto[]> {
    return firstValueFrom(
      this.http.get<FlightInfoDto[]>(`${this.baseUrl}/flight-infos`, {
        params: { date: new Date().toISOString() },
      })
    );
  }

  loadFlightById(id: number): Promise<Flight> {
    return firstValueFrom(this.http.get<Flight>(`${this.baseUrl}/flights/${id}`));
  }

  createFlight(flight: CreateFlightDto): Promise<Flight> {
    return firstValueFrom(
      this.http.post<Flight>(`${this.baseUrl}/flights`, flight)
    );
  }

  updateFlight(id: number, flight: CreateFlightDto): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/flights/${id}`, flight)
    );
  }

  deleteFlight(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/flights/${id}`));
  }
}
