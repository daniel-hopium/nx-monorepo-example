import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Stammdaten } from '@monorepo/initiative-domain';
import { TextBox } from '@monorepo/shared-ui-elements';

/**
 * Formularblock "Stammdaten". Bekommt den Teilbaum des Signal-Forms
 * (`FieldTree<Stammdaten>`) und rendert seine Felder. Die Komponente
 * besitzt keinen eigenen Zustand, der lebt im Feature.
 */
@Component({
  selector: 'lib-stammdaten-form',
  imports: [TextBox],
  template: `
    <ds-text-box label="Name" [field]="section().name" />
    <ds-text-box label="Initiativen-Manager*in" [field]="section().manager" />
    <ds-text-box label="Bereich" [field]="section().bereich" />
    <ds-text-box label="Kategorie" [field]="section().kategorie" />
    <ds-text-box label="Startdatum" type="date" [field]="section().startdatum" />
    <ds-text-box label="Enddatum" type="date" [field]="section().enddatum" />
    <ds-text-box label="Sponsor" [field]="section().sponsor" />
    <ds-text-box label="Beteiligte Einheiten" [field]="section().beteiligteEinheiten" />
    <ds-text-box label="Ziel" [multiline]="true" [field]="section().ziel" />
    <ds-text-box label="Kurzbeschreibung" [multiline]="true" [field]="section().kurzbeschreibung" />
  `,
  host: { style: 'display: contents' },
})
export class StammdatenForm {
  readonly section = input.required<FieldTree<Stammdaten>>();
}
