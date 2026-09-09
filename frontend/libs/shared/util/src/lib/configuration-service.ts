import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Configuration = {
  baseUrl: string;
};

const initialConfiguration: Configuration = {
  baseUrl: '',
};

/**
 * Lädt die Laufzeit-Konfiguration (z. B. die Backend-URL) aus
 * `public/configuration.json`. Vorteil gegenüber `environment.ts`:
 * Die Datei kann nach dem Build ausgetauscht werden, ohne neu zu bauen.
 */
@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  configuration: Configuration = initialConfiguration;

  private readonly http = inject(HttpClient);

  async loadConfiguration(): Promise<void> {
    this.configuration = await firstValueFrom(
      this.http.get<Configuration>('/configuration.json')
    );
  }
}
