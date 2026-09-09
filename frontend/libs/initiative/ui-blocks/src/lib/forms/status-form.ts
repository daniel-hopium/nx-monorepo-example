import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import {
  FREIGABEN,
  GESAMTSTATUS,
  PHASEN,
  StatusDerInitiative,
} from '@monorepo/initiative-domain';
import { Dropdown, TextBox } from '@monorepo/shared-ui-elements';

@Component({
  selector: 'lib-status-form',
  imports: [TextBox, Dropdown],
  template: `
    <ds-dropdown label="Phase" [field]="section().phase" [choices]="phasen" />
    <ds-dropdown label="Gesamtstatus" [field]="section().gesamtstatus" [choices]="gesamtstatus" />
    <ds-dropdown label="Freigabe" [field]="section().freigabe" [choices]="freigaben" />
    <ds-text-box label="Zu reporten bis" type="date" [field]="section().reportingBis" />
    <ds-text-box label="Status-Kommentar" [multiline]="true" [field]="section().statusKommentar" />
  `,
  host: { style: 'display: contents' },
})
export class StatusForm {
  readonly section = input.required<FieldTree<StatusDerInitiative>>();
  protected readonly phasen = PHASEN;
  protected readonly gesamtstatus = GESAMTSTATUS;
  protected readonly freigaben = FREIGABEN;
}
