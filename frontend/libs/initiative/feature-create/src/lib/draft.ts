import { Injectable, signal } from '@angular/core';
import {
  CreateInitiativeDto,
  initialCreateInitiativeDto,
} from '@monorepo/initiative-domain';

/**
 * Hält den Formular-Entwurf zwischen "Initiative erstellen" und
 * "Zusammenfassung". Ein Signal als Single Source of Truth, das Signal-Form
 * bindet direkt daran (form(draft.model)). `id` ist gesetzt, wenn eine
 * bestehende Initiative bearbeitet wird (dann PUT statt POST).
 */
@Injectable()
export class InitiativeDraft {
  readonly model = signal<CreateInitiativeDto>(structuredClone(initialCreateInitiativeDto));
  readonly id = signal<number | null>(null);

  load(id: number, dto: CreateInitiativeDto) {
    this.id.set(id);
    this.model.set(dto);
  }

  reset() {
    this.id.set(null);
    this.model.set(structuredClone(initialCreateInitiativeDto));
  }
}
