/**
 * BUTTON (jsdom)
 *
 * Attribut-Komponenten und Content Projection testet man am besten über eine
 * Host-Komponente: `<button labButton>Text</button>` lässt sich mit
 * `TestBed.createComponent(Button)` gar nicht bauen, weil der Text von außen kommt.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button, ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `
    <button labButton [variant]="variant()" [loading]="loading()" [disabled]="disabled()" (click)="clicks.set(clicks() + 1)">
      Speichern
    </button>
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly clicks = signal(0);
}

describe('Button', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    button = fixture.nativeElement.querySelector('button');
  });

  it('projiziert den Text des Aufrufers', () => {
    expect(button.textContent?.trim()).toBe('Speichern');
  });

  it.each(['primary', 'secondary', 'danger'] as const)('Variante "%s" wird zur CSS-Klasse', async (variant) => {
    host.variant.set(variant);
    await fixture.whenStable();
    expect(button.classList).toContain(variant);
  });

  it('Klick löst das native click-Event beim Aufrufer aus', () => {
    button.click();
    expect(host.clicks()).toBe(1);
  });

  it('im Ladezustand: deaktiviert, aria-busy und Spinner', async () => {
    host.loading.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner')).not.toBeNull();
  });

  it('ein deaktivierter Button meldet keine Klicks', async () => {
    host.disabled.set(true);
    await fixture.whenStable();

    button.click(); // Browser (und jsdom) verwerfen Klicks auf disabled-Buttons

    expect(host.clicks()).toBe(0);
  });

  it('ohne Ladezustand gibt es kein aria-busy-Attribut', () => {
    // `null` im Host-Binding entfernt das Attribut ganz, statt "false" zu schreiben.
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });
});
