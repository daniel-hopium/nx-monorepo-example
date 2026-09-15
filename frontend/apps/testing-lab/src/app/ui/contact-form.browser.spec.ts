/**
 * FORMULAR MIT SERVERFEHLERN TESTEN (Browser-Modus)
 *
 * Das Formular bekommt die Speicherfunktion als Input (`save`). Im Test ist das
 * ein vi.fn(), das ein Result liefert. So stellt der Test jeden Serverfall her,
 * ohne Store und ohne HTTP:
 *   ok(...)                                  -> Erfolg
 *   fail(new AppError('validation', {...}))  -> 422 mit Feldfehlern
 *   fail(new AppError('server'))             -> Fehler ohne Feldbezug
 *
 * Geprüft wird aus Nutzersicht: Wo steht die Meldung? Ist das Feld für
 * Screenreader als ungültig markiert und mit der Meldung verknüpft?
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppError, USER_MESSAGES } from '../core/error/app-error';
import { fail, ok, Result } from '../core/error/result';
import { Contact, NewContact } from '../data-access/contact';
import { ContactForm } from './contact-form';

const grace: NewContact = { name: 'Grace Hopper', email: 'grace@example.com', company: 'US Navy' };

describe('ContactForm (Browser)', () => {
  let fixture: ComponentFixture<ContactForm>;
  let save: ReturnType<typeof vi.fn<(contact: NewContact) => Promise<Result<Contact>>>>;

  const name = () => page.getByRole('textbox', { name: 'Name' });
  const email = () => page.getByRole('textbox', { name: 'E-Mail' });
  const submit = () => page.getByRole('button', { name: 'Anlegen' });

  async function fillAndSubmit(contact: NewContact = grace) {
    await userEvent.fill(name(), contact.name);
    await userEvent.fill(email(), contact.email);
    await userEvent.fill(page.getByRole('textbox', { name: 'Firma' }), contact.company);
    await userEvent.click(submit());
  }

  beforeEach(async () => {
    save = vi.fn((contact: NewContact) => Promise.resolve(ok<Contact>({ ...contact, id: 1, favorite: false })));
    fixture = TestBed.createComponent(ContactForm);
    fixture.componentRef.setInput('save', save);
    await fixture.whenStable();
  });

  it('Client-Validierung: leeres Absenden zeigt Pflichtfelder und ruft save NICHT', async () => {
    await userEvent.click(submit());

    await expect.element(page.getByText('Name ist Pflicht')).toBeVisible();
    await expect.element(name()).toHaveAttribute('aria-invalid', 'true');
    expect(save).not.toHaveBeenCalled();
  });

  it('422 mit Feldfehler: Meldung direkt am Feld, als Beschreibung verknüpft', async () => {
    save.mockResolvedValue(
      fail(new AppError('validation', { fieldErrors: { email: 'Diese E-Mail ist bereits vergeben.' } }))
    );

    await fillAndSubmit();

    await expect.element(email()).toHaveAttribute('aria-invalid', 'true');
    // toHaveAccessibleDescription prüft die echte Verknüpfung über aria-describedby.
    await expect.element(email()).toHaveAccessibleDescription('Diese E-Mail ist bereits vergeben.');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument(); // kein Formularfehler
    await expect.element(email()).toHaveValue(grace.email); // Eingaben bleiben erhalten
  });

  it('Fehler ohne Feldbezug (500): Meldung als Alert am Formular', async () => {
    save.mockResolvedValue(fail(new AppError('server')));

    await fillAndSubmit();

    await expect.element(page.getByRole('alert')).toHaveTextContent(USER_MESSAGES.server);
    await expect.element(name()).toHaveValue(grace.name);
  });

  it('während des Speicherns: Button gesperrt mit aria-busy (Schutz vor Doppelklick)', async () => {
    let resolve!: (result: Result<Contact>) => void;
    save.mockReturnValue(new Promise((r) => (resolve = r)));

    await fillAndSubmit();

    await expect.element(submit()).toHaveAttribute('aria-busy', 'true');
    await expect.element(submit()).toBeDisabled();

    resolve(ok({ ...grace, id: 1, favorite: false }));
    await expect.element(submit()).not.toHaveAttribute('aria-busy');
  });

  it('Erfolg: created wird gemeldet und das Formular geleert, ohne Pflichtfeld-Meldungen', async () => {
    const created = vi.fn();
    fixture.componentInstance.created.subscribe(created);

    await fillAndSubmit();

    await expect.element(name()).toHaveValue('');
    await expect.element(page.getByText('Name ist Pflicht')).not.toBeInTheDocument();
    expect(save).toHaveBeenCalledWith(grace);
    expect(created).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
