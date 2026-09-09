import { describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccordionSection } from './accordion-section';

@Component({
  imports: [AccordionSection],
  template: `
    <ds-accordion-section title="Stammdaten" counter="0/10" [(expanded)]="open">
      <p class="inner">Inhalt</p>
    </ds-accordion-section>
  `,
})
class Host {
  readonly open = signal(false);
}

describe('AccordionSection (Browser)', () => {
  it('klappt per Klick auf und meldet den Zustand nach außen', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('.header') as HTMLButtonElement;

    expect(el.querySelector('.inner')).toBeNull();
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('.counter')?.textContent).toBe('0/10');

    header.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(el.querySelector('.inner')?.textContent).toBe('Inhalt');
    expect(header.getAttribute('aria-expanded')).toBe('true');
    // Chevron dreht sich per CSS-Klasse "open": nur im Browser sichtbar.
    expect(getComputedStyle(el.querySelector('.chevron') as HTMLElement).transform).not.toBe('none');
  });
});
