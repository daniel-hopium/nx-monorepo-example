import { describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: `
    <ds-pagination [page]="page()" [pageSize]="20" [total]="32" (pageChange)="page.set($event)" />
  `,
})
class Host {
  readonly page = signal(1);
}

describe('Pagination (Browser)', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
    return { fixture, el, button };
  }

  it('zeigt den Bereich der ersten Seite', async () => {
    const { el, button } = await setup();
    expect(el.querySelector('.range')?.textContent).toBe('1-20 von 32');
    expect(button('Vorherige Seite').disabled).toBe(true);
    expect(button('Nächste Seite').disabled).toBe(false);
  });

  it('klick auf "Nächste Seite" wechselt auf Seite 2', async () => {
    const { fixture, el, button } = await setup();
    button('Nächste Seite').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.page()).toBe(2);
    expect(el.querySelector('.range')?.textContent).toBe('21-32 von 32');
    expect(button('Nächste Seite').disabled).toBe(true);
  });
});
