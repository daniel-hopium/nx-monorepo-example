import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Weitere } from '@monorepo/initiative-domain';
import { TextBox } from '@monorepo/shared-ui-elements';

@Component({
  selector: 'lib-weitere-form',
  imports: [TextBox],
  template: `
    <ds-text-box label="Risiken" [multiline]="true" [field]="section().risiken" />
    <ds-text-box label="Abhängigkeiten" [multiline]="true" [field]="section().abhaengigkeiten" />
    <ds-text-box label="Notizen" [multiline]="true" [field]="section().notizen" />
  `,
  host: { style: 'display: contents' },
})
export class WeitereForm {
  readonly section = input.required<FieldTree<Weitere>>();
}
