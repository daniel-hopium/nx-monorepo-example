/**
 * TOAST (jsdom)
 *
 * Die Toasts-Komponente zeigt nur an, was der NotificationService hält.
 * Deshalb ersetzen wir den Service durch ein Fake mit einem schreibbaren
 * Signal: der Test steuert die Meldungen direkt und muss weder Timer noch
 * echte Logik abwarten.
 *
 * Warum hier KEINE Fake Timers? Angular plant Change Detection intern selbst
 * über Timer. Fake Timers können `whenStable()` dann hängen lassen. Das
 * Zeitverhalten ist schon im Service-Test abgedeckt (notification-service.spec.ts),
 * die Komponente testen wir ohne Zeit. Trennung der Verantwortung = einfache Tests.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Notification, NotificationService } from '../data-access/notification-service';
import { Toasts } from './toasts';

describe('Toasts', () => {
  const fake = {
    messages: signal<Notification[]>([]),
    dismiss: vi.fn(),
  };
  let fixture: ComponentFixture<Toasts>;
  let el: HTMLElement;

  beforeEach(async () => {
    fake.messages.set([]);
    fake.dismiss.mockReset(); // Aufrufzähler aus früheren Tests löschen

    await TestBed.configureTestingModule({
      imports: [Toasts],
      providers: [{ provide: NotificationService, useValue: fake }],
    }).compileComponents();
    fixture = TestBed.createComponent(Toasts);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  const toasts = () => Array.from(el.querySelectorAll('.toast'));

  it('ohne Meldungen wird nichts angezeigt', () => {
    expect(toasts()).toHaveLength(0);
  });

  it('zeigt jede Meldung als eigenen Toast', async () => {
    fake.messages.set([
      { id: 1, text: 'Gespeichert', kind: 'info' },
      { id: 2, text: 'Fehler beim Laden', kind: 'error' },
    ]);
    await fixture.whenStable();

    expect(toasts().map((t) => t.textContent?.replace('✕', '').trim())).toEqual([
      'Gespeichert',
      'Fehler beim Laden',
    ]);
  });

  it('Fehler-Toasts bekommen die error-Klasse', async () => {
    fake.messages.set([{ id: 7, text: 'Kaputt', kind: 'error' }]);
    await fixture.whenStable();

    expect(toasts()[0].classList).toContain('error');
  });

  it('der Container ist eine höfliche Live-Region', () => {
    // aria-live="polite": Screenreader lesen neue Toasts vor, ohne zu unterbrechen.
    expect(el.querySelector('.toasts')?.getAttribute('aria-live')).toBe('polite');
  });

  it('Schließen ruft dismiss mit der Id der Meldung', async () => {
    fake.messages.set([{ id: 42, text: 'Weg', kind: 'info' }]);
    await fixture.whenStable();

    (el.querySelector('.toast button') as HTMLButtonElement).click();

    expect(fake.dismiss).toHaveBeenCalledExactlyOnceWith(42);
  });
});
