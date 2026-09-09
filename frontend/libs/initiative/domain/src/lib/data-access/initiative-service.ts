import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigurationService } from '@monorepo/shared-util';
import {
  CreateInitiativeDto,
  Initiative,
  InitiativeDetail,
} from '../domain/initiative';
import { InitiativeQueryDto } from '../dtos/initiative-query-dto';
import { emptyPage, PageResult } from '../dtos/page-result';

@Injectable({ providedIn: 'root' })
export class InitiativeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(ConfigurationService).configuration.baseUrl;

  /**
   * Reaktive Liste: jede Änderung am Query-Signal (Suche, Sortierung, Seite)
   * löst automatisch einen neuen Request aus. Leere Filter werden nicht
   * mitgeschickt, damit die URL sauber bleibt.
   */
  createInitiativesResource(query: Signal<InitiativeQueryDto>) {
    return httpResource<PageResult<Initiative>>(
      () => {
        const q = query();
        const params: Record<string, string | number | boolean> = {
          sortBy: q.sortBy,
          sortDir: q.sortDir,
          page: q.page,
          pageSize: q.pageSize,
          archiviert: q.archiviert,
        };
        if (q.search) params['search'] = q.search;
        if (q.phase) params['phase'] = q.phase;
        if (q.freigabe) params['freigabe'] = q.freigabe;
        return { url: `${this.baseUrl}/initiatives`, params };
      },
      { defaultValue: emptyPage<Initiative>() }
    );
  }

  /** Detail-Resource: lädt neu, sobald sich die Id ändert. */
  createInitiativeResource(id: Signal<number | undefined>) {
    return httpResource<InitiativeDetail>(() =>
      id() ? `${this.baseUrl}/initiatives/${id()}` : undefined
    );
  }

  loadInitiativeById(id: number): Promise<InitiativeDetail> {
    return firstValueFrom(
      this.http.get<InitiativeDetail>(`${this.baseUrl}/initiatives/${id}`)
    );
  }

  createInitiative(dto: CreateInitiativeDto): Promise<InitiativeDetail> {
    return firstValueFrom(
      this.http.post<InitiativeDetail>(`${this.baseUrl}/initiatives`, this.toBody(dto))
    );
  }

  updateInitiative(id: number, dto: CreateInitiativeDto): Promise<InitiativeDetail> {
    return firstValueFrom(
      this.http.put<InitiativeDetail>(`${this.baseUrl}/initiatives/${id}`, this.toBody(dto))
    );
  }

  submitInitiative(id: number): Promise<InitiativeDetail> {
    return firstValueFrom(
      this.http.post<InitiativeDetail>(`${this.baseUrl}/initiatives/${id}/submit`, {})
    );
  }

  deleteInitiative(id: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/initiatives/${id}`)
    );
  }

  /**
   * Bildet das Formular (5 Abschnitte) auf die Backend-Struktur ab: die
   * Listenfelder liegen flach oben, alle Felder zusätzlich unter `details`.
   */
  private toBody(dto: CreateInitiativeDto) {
    return {
      name: dto.stammdaten.name,
      manager: dto.stammdaten.manager,
      freigabe: dto.status.freigabe || 'Entwurf',
      gesamtstatus: dto.status.gesamtstatus || 'Grün',
      phase: dto.status.phase || 'Geplant',
      reportingBis: dto.status.reportingBis || null,
      details: dto,
    };
  }
}
