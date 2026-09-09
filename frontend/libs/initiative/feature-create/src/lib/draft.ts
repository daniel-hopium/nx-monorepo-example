import { Injectable, signal } from '@angular/core';
import {
  CreateInitiativeDto,
  initialCreateInitiativeDto,
} from '@monorepo/initiative-domain';

/**
 * Hält den Formular-Entwurf zwischen "Initiative erstellen" und
 * "Zusammenfassung". Ein Signal als Single Source of Truth, das Signal-Form
 * bindet direkt daran (form(draft.model)).
 */
@Injectable()
export class InitiativeDraft {
  readonly model = signal<CreateInitiativeDto>(structuredClone(initialCreateInitiativeDto));

  reset() {
    this.model.set(structuredClone(initialCreateInitiativeDto));
  }
}
