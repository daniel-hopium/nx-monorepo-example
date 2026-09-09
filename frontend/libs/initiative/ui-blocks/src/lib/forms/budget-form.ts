import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { Budget } from '@monorepo/initiative-domain';
import { TextBox } from '@monorepo/shared-ui-elements';

@Component({
  selector: 'lib-budget-form',
  imports: [TextBox],
  template: `
    <ds-text-box label="Gesamtbudget (EUR)" type="number" [field]="section().gesamtbudget" />
    <ds-text-box label="Budget laufendes Jahr (EUR)" type="number" [field]="section().budgetJahr" />
    <ds-text-box label="Bisher verbraucht (EUR)" type="number" [field]="section().verbraucht" />
    <ds-text-box label="Finanzierungsquelle" [field]="section().finanzierungsquelle" />
  `,
  host: { style: 'display: contents' },
})
export class BudgetForm {
  readonly section = input.required<FieldTree<Budget>>();
}
