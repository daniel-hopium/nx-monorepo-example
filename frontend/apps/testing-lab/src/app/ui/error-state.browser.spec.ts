/**
 * FEHLERANZEIGE TESTEN (Browser-Modus, inkl. Barrierefreiheit)
 *
 * Fehleranzeigen werden oft nur "angeschaut". Dabei gibt es klare Regeln, die
 * sich testen lassen:
 *   - Screenreader müssen den Fehler mitbekommen   -> role="alert"
 *   - Nutzer sehen die verständliche Meldung       -> userMessage, nie die technische
 *   - "Erneut versuchen" nur, wenn es etwas bringt  -> error.retryable
 *   - der Button ist per Tastatur erreichbar und auslösbar
 *
 * Inputs setzt `fixture.componentRef.setInput(...)`: so wie ein Eltern-Template.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppError, USER_MESSAGES } from '../core/error/app-error';
import { ErrorState } from './error-state';

describe('ErrorState (Browser)', () => {
  let fixture: ComponentFixture<ErrorState>;

  async function renderWith(error: AppError, inputs: Record<string, unknown> = {}) {
    fixture.componentRef.setInput('error', error);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorState);
  });

  it('ist ein Alert mit Titel und Nutzer-Meldung, ohne technische Details', async () => {
    await renderWith(new AppError('server', { status: 500 }), { title: 'Liste nicht geladen' });

    const alert = page.getByRole('alert');
    await expect.element(alert).toHaveTextContent('Liste nicht geladen');
    await expect.element(alert).toHaveTextContent(USER_MESSAGES.server);
    await expect.element(alert).not.toHaveTextContent('HTTP 500');
  });

  it('"Erneut versuchen" per Tastatur: Tab fokussiert, Enter löst retry aus', async () => {
    await renderWith(new AppError('offline'));
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    await userEvent.tab();
    const button = page.getByRole('button', { name: 'Erneut versuchen' });
    await expect.element(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(retry).toHaveBeenCalledOnce();
  });

  it.each(['forbidden', 'not-found', 'validation'] as const)('kein Retry-Button bei "%s"', async (kind) => {
    await renderWith(new AppError(kind));

    await expect.element(page.getByRole('alert')).toBeVisible();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  it('allowRetry=false blendet den Button auch bei wiederholbaren Fehlern aus', async () => {
    await renderWith(new AppError('server'), { allowRetry: false });
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  it('retrying: Button ist gesperrt und meldet aria-busy', async () => {
    await renderWith(new AppError('timeout'), { retrying: true });

    const button = page.getByRole('button', { name: 'Erneut versuchen' });
    await expect.element(button).toBeDisabled();
    await expect.element(button).toHaveAttribute('aria-busy', 'true');
  });
});
