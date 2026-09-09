import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Gruppenstrategie } from '@monorepo/initiative-domain';
import { TextBox } from '@monorepo/shared-ui-elements';

@Component({
  selector: 'lib-gruppenstrategie-form',
  imports: [TextBox],
  template: `
    <ds-text-box label="Strategisches Ziel" [field]="section().strategischesZiel" />
    <ds-text-box label="KPI" [field]="section().kpi" />
    <ds-text-box label="Beitrag zur Gruppenstrategie" [multiline]="true" [field]="section().beitrag" />
  `,
  host: { style: 'display: contents' },
})
export class GruppenstrategieForm {
  readonly section = input.required<FieldTree<Gruppenstrategie>>();
}
