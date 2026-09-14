import { Injectable, signal } from '@angular/core';

export type Notification = { id: number; text: string; kind: 'info' | 'error' };

/**
 * Kleiner Toast-Service: hält eine Liste von Meldungen, die nach einer
 * Weile wieder verschwinden.
 *
 * Testbar sind hier zwei Dinge: der Zustand (Signal `messages`) und das
 * Timing (setTimeout). Timer testet man nicht mit echtem Warten, sondern mit
 * Fake Timers: `vi.useFakeTimers()` und `vi.advanceTimersByTime(ms)`.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  readonly messages = signal<Notification[]>([]);

  notify(text: string, kind: Notification['kind'] = 'info', ttlMs = 3000): void {
    const notification: Notification = { id: this.nextId++, text, kind };
    this.messages.update((list) => [...list, notification]);
    setTimeout(() => this.dismiss(notification.id), ttlMs);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((n) => n.id !== id));
  }
}
