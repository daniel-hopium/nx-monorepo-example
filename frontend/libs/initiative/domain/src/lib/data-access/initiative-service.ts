import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigurationService } from '@monorepo/shared-util';
import { CreateInitiativeDto, Initiative } from '../domain/initiative';
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

  loadInitiativeById(id: number): Promise<Initiative> {
    return firstValueFrom(
      this.http.get<Initiative>(`${this.baseUrl}/initiatives/${id}`)
    );
  }

  /** Bildet das Formular (5 Abschnitte) auf die flache Backend-Struktur ab. */
  createInitiative(dto: CreateInitiativeDto): Promise<Initiative> {
    const body = {
      name: dto.stammdaten.name,
      manager: dto.stammdaten.manager,
      freigabe: dto.status.freigabe || 'Entwurf',
      gesamtstatus: dto.status.gesamtstatus || 'Grün',
      phase: dto.status.phase || 'Geplant',
      reportingBis: dto.status.reportingBis || null,
      details: {
        ...dto.stammdaten,
        ...dto.budget,
        ...dto.gruppenstrategie,
        ...dto.weitere,
        statusKommentar: dto.status.statusKommentar,
      },
    };
    return firstValueFrom(
      this.http.post<Initiative>(`${this.baseUrl}/initiatives`, body)
    );
  }
}
