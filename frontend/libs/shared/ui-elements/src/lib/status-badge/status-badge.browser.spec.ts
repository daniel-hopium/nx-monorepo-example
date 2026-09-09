import { describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

@Component({
  imports: [StatusBadge],
  template: `<ds-status-badge variant="warning">Freigabe offen</ds-status-badge>`,
})
class Host {}

describe('StatusBadge (Browser)', () => {
  it('rendert Label und Variante mit echten Styles', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('.badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Freigabe offen');
    expect(badge.classList.contains('warning')).toBe(true);

    // Nur im echten Browser prüfbar: Komponenten-CSS wird angewendet.
    const style = getComputedStyle(badge);
    expect(style.borderRadius).toBe('999px');
    expect(style.display).toBe('inline-flex');
  });
});
