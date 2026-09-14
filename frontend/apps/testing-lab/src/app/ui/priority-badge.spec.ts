/**
 * STUFE 2: Komponententest in jsdom mit Angulars TestBed.
 *
 * Ablauf:
 *  1. TestBed.configureTestingModule({ imports: [Komponente] })
 *  2. fixture = TestBed.createComponent(Komponente)   -> Instanz + DOM-Wrapper
 *  3. fixture.componentRef.setInput('name', wert)     -> input() setzen
 *  4. await fixture.whenStable()                      -> Change Detection laufen lassen
 *  5. fixture.nativeElement.querySelector(...)        -> DOM prüfen
 *
 * Für input.required() MUSS setInput vor dem ersten Rendern passieren.
 */
import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PriorityBadge } from './priority-badge';

describe('PriorityBadge', () => {
  async function render(priority: 'hoch' | 'mittel' | 'niedrig') {
    await TestBed.configureTestingModule({ imports: [PriorityBadge] }).compileComponents();
    const fixture = TestBed.createComponent(PriorityBadge);
    fixture.componentRef.setInput('priority', priority);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('.badge') as HTMLSpanElement;
  }

  it('zeigt das Label mit großem Anfangsbuchstaben', async () => {
    const badge = await render('hoch');
    expect(badge.textContent?.trim()).toBe('Hoch');
  });

  it('setzt die Priorität als CSS-Klasse', async () => {
    const badge = await render('niedrig');
    expect(badge.classList.contains('niedrig')).toBe(true);
    expect(badge.classList.contains('hoch')).toBe(false);
  });
});
