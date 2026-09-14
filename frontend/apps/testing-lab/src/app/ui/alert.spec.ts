/**
 * ALERT (jsdom)
 *
 * Schwerpunkt: ARIA-Rollen und ein Output ohne Wert (`output<void>()`).
 */
import { describe, expect, it, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert, AlertKind } from './alert';

@Component({
  imports: [Alert],
  template: `
    <lab-alert [kind]="kind()" [title]="title()" [dismissible]="dismissible()" (closed)="onClosed()">
      Bitte Eingaben prüfen.
    </lab-alert>
  `,
})
class Host {
  readonly kind = signal<AlertKind>('info');
  readonly title = signal('');
  readonly dismissible = signal(false);
  onClosed = vi.fn(); // Spion direkt als Methode des Hosts
}

async function render(setup: (host: Host) => void = () => undefined) {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance); // Signale vor dem ersten Rendern setzen
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el, alert: () => el.querySelector('.alert') };
}

describe('Alert', () => {
  it.each([
    ['error', 'alert'],
    ['warning', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('Art "%s" bekommt role="%s"', async (kind, role) => {
    const { alert } = await render((h) => h.kind.set(kind));
    expect(alert()?.getAttribute('role')).toBe(role);
    expect(alert()?.classList).toContain(kind);
  });

  it('zeigt projizierten Text und optionalen Titel', async () => {
    const { el } = await render((h) => h.title.set('Achtung'));
    expect(el.querySelector('.title')?.textContent).toBe('Achtung');
    expect(el.querySelector('.text')?.textContent?.trim()).toBe('Bitte Eingaben prüfen.');
  });

  it('ohne Titel wird kein <strong> gerendert', async () => {
    const { el } = await render();
    expect(el.querySelector('.title')).toBeNull();
  });

  it('Schließen-Button gibt es nur, wenn dismissible', async () => {
    const { el } = await render();
    expect(el.querySelector('.close')).toBeNull();
  });

  it('Schließen blendet aus und meldet closed', async () => {
    const { fixture, host, alert, el } = await render((h) => h.dismissible.set(true));

    (el.querySelector('.close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(alert()).toBeNull();
    expect(host.onClosed).toHaveBeenCalledOnce();
  });
});
