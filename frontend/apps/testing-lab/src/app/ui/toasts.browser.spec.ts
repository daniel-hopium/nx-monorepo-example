/**
 * TOAST (Browser, mit echtem NotificationService)
 *
 * Im Browser lassen wir den echten Service laufen und nutzen eine kurze
 * Anzeigedauer (500 ms). `expect.element(...).not.toBeInTheDocument()`
 * wartet von selbst, bis der Toast verschwunden ist. So testet man zeit-
 * abhängiges Verhalten ohne Fake Timers und ohne feste `sleep`-Pausen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../data-access/notification-service';
import { Toasts } from './toasts';

describe('Toasts (Browser)', () => {
  let notifications: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Toasts] }).compileComponents();
    await TestBed.createComponent(Toasts).whenStable();
    notifications = TestBed.inject(NotificationService);
  });

  it('eine Meldung erscheint und wird fixiert unten rechts angezeigt', async () => {
    notifications.notify('Aufgabe angelegt', 'info', 10_000);

    const toast = page.getByText('Aufgabe angelegt');
    await expect.element(toast).toBeVisible();
    // Echtes CSS: nur im Browser gibt es ein berechnetes `position`.
    expect(getComputedStyle(toast.element().closest('.toasts') as Element).position).toBe('fixed');
  });

  it('verschwindet nach Ablauf der Anzeigedauer von selbst', async () => {
    // Früher: 50 ms. Das war FLAKY: Lief der Rechner unter Last (viele Tests
    // parallel), war der Toast schon weg, bevor toBeVisible() ihn sehen konnte.
    // Lehre: Zeitfenster in Browser-Tests großzügig wählen und die Wartezeit
    // der Assertion (timeout) explizit darüber setzen.
    notifications.notify('Gleich weg', 'info', 500);

    await expect.element(page.getByText('Gleich weg')).toBeVisible();
    await expect.element(page.getByText('Gleich weg'), { timeout: 3000 }).not.toBeInTheDocument();
  });

  it('Schließen-Button entfernt nur diesen Toast', async () => {
    notifications.notify('Erster', 'info', 10_000);
    notifications.notify('Zweiter', 'error', 10_000);

    await userEvent.click(page.getByRole('button', { name: 'Schließen' }).first());

    await expect.element(page.getByText('Erster')).not.toBeInTheDocument();
    await expect.element(page.getByText('Zweiter')).toBeVisible();
  });
});
