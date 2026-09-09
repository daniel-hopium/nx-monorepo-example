import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Stammdaten } from '@monorepo/initiative-domain';
import { Dropdown, TextBox } from '@monorepo/shared-ui-elements';

/**
 * Formularblock "Stammdaten". Bekommt den Teilbaum des Signal-Forms
 * (`FieldTree<Stammdaten>`) und rendert seine Felder. Die Komponente
 * besitzt keinen eigenen Zustand, der lebt im Feature.
 */
@Component({
  selector: 'lib-stammdaten-form',
  imports: [TextBox, Dropdown],
  template: `
    <ds-text-box label="Name der Initiative" [field]="section().name" />
    <ds-text-box label="Kurztitel" [field]="section().kurztitel" />
    <ds-text-box label="Initiativen-ID" [field]="section().initiativenId" />
    <ds-dropdown label="Konzernunternehmen im Lead" [field]="section().konzernunternehmen" [choices]="konzernunternehmen" />
    <ds-dropdown label="Typ der Initiative" [field]="section().typ" [choices]="typen" />
    <ds-text-box label="Interne Kooperation (optional)" [field]="section().interneKooperation" />
    <ds-text-box label="Initiativen-Manager*in" [field]="section().manager" />
    <ds-dropdown label="Auftraggeber*in intern/extern" [field]="section().auftraggeber" [choices]="auftraggeber" />
    <ds-text-box label="Startdatum" type="date" [field]="section().startdatum" />
    <ds-text-box label="Enddatum" type="date" [field]="section().enddatum" />
  `,
  host: { style: 'display: contents' },
})
export class StammdatenForm {
  readonly section = input.required<FieldTree<Stammdaten>>();
  protected readonly konzernunternehmen = ['Wiener Stadtwerke', 'Wiener Linien', 'Wien Energie', 'Wiener Netze'];
  protected readonly typen = ['Organisation', 'Projekt', 'Programm'];
  protected readonly auftraggeber = ['Konzernintern', 'Extern'];
}
