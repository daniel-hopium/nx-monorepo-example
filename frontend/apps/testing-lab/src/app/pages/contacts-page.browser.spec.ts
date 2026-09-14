/**
 * INTEGRATIONSTEST: Smart Component + ECHTER Signal Store, nur die API gemockt
 *
 * Die drei Kontakte-Tests ergänzen sich:
 *   contact-api.spec.ts       API allein        (HTTP abgefangen)
 *   contact-store.spec.ts     Store allein      (API gemockt)
 *   contacts-page.spec.ts     Komponente allein (Store gefakt)
 *   DIESE Datei               Komponente + Store zusammen (API gemockt), im Browser
 *
 * Hier fällt auf, wenn die Teile einzeln stimmen, aber nicht zusammenpassen,
 * z. B. wenn die Komponente eine Store-Methode mit falschem Argument ruft.
 *
 * Kein overrideComponent nötig: Die Komponente erzeugt ihren echten Store,
 * und der Store injiziert `ContactApi`. Die kommt aus dem TestBed und ist der Mock.
 * Echte Zeit statt Fake Timers: `expect.element` wartet die 300 ms Debounce von selbst ab.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Contact, NewContact } from '../data-access/contact';
import { ContactApi } from '../data-access/contact-api';
import { ContactsPage } from './contacts-page';

const seed: Contact[] = [
  { id: 1, name: 'Linus Torvalds', email: 'linus@example.com', company: 'Linux Foundation', favorite: false },
  { id: 2, name: 'Ada Lovelace', email: 'ada@example.com', company: 'Analytical Engines', favorite: true },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', company: 'US Navy', favorite: false },
];

describe('ContactsPage + ContactStore (Browser, Integration)', () => {
  // Mock mit echter kleiner Logik (filtern), damit sich die Suche realistisch anfühlt.
  const api = {
    getContacts: vi.fn((q = '') => of(seed.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())))),
    createContact: vi.fn((dto: NewContact) => of<Contact>({ ...dto, id: 99, favorite: false })),
    deleteContact: vi.fn<(id: number) => ReturnType<ContactApi['deleteContact']>>(() => of(undefined)),
    setFavorite: vi.fn((id: number, favorite: boolean) => of({ ...seed[0], id, favorite })),
  };

  const items = () => page.getByRole('listitem');

  beforeEach(async () => {
    vi.clearAllMocks(); // Aufrufzähler zurücksetzen, Implementierungen bleiben
    await TestBed.configureTestingModule({
      imports: [ContactsPage],
      providers: [{ provide: ContactApi, useValue: api }],
    }).compileComponents();
    await TestBed.createComponent(ContactsPage).whenStable();
  });

  it('lädt beim Start und zeigt Favoriten zuerst', async () => {
    await expect.element(page.getByTestId('stats')).toHaveTextContent('3 Kontakte, 1 Favoriten');
    await expect.element(items().nth(0)).toHaveTextContent('Ada Lovelace');
    expect(api.getContacts).toHaveBeenCalledWith('');
  });

  it('Suche tippt, wartet die Debounce-Zeit ab und zeigt das Ergebnis', async () => {
    await userEvent.fill(page.getByLabelText('Suchen'), 'grace');

    await expect.element(page.getByText('Grace Hopper')).toBeVisible();
    await expect.element(page.getByText('Linus Torvalds')).not.toBeInTheDocument();
    // fill() setzt den Wert in einem Schritt: ein Request, nicht einer pro Buchstabe.
    expect(api.getContacts).toHaveBeenLastCalledWith('grace');
  });

  it('Kontakt anlegen: API mit Formularwerten, Kontakt erscheint, Formular leer', async () => {
    await userEvent.fill(page.getByRole('textbox', { name: 'Name' }), 'Margaret Hamilton');
    await userEvent.fill(page.getByRole('textbox', { name: 'E-Mail' }), 'margaret@example.com');
    await userEvent.fill(page.getByRole('textbox', { name: 'Firma' }), 'NASA');
    await userEvent.click(page.getByRole('button', { name: 'Anlegen' }));

    await expect.element(page.getByText('Margaret Hamilton')).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: 'Name' })).toHaveValue('');
    expect(api.createContact).toHaveBeenCalledWith({
      name: 'Margaret Hamilton',
      email: 'margaret@example.com',
      company: 'NASA',
    });
  });

  it('Löschen schlägt fehl: Kontakt kommt zurück, Fehler als Alert', async () => {
    api.deleteContact.mockReturnValueOnce(throwError(() => new Error('403')));

    await userEvent.click(page.getByRole('button', { name: 'Grace Hopper löschen' }));

    await expect.element(page.getByRole('alert')).toHaveTextContent('Kontakt konnte nicht gelöscht werden');
    await expect.element(page.getByText('Grace Hopper')).toBeVisible(); // Rollback im echten Store

    await userEvent.click(page.getByRole('button', { name: 'Hinweis schließen' }));
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('Favorit per Tastatur: aria-pressed wechselt und die Liste sortiert neu', async () => {
    const star = page.getByRole('button', { name: 'Linus Torvalds als Favorit markieren' });
    await expect.element(star).toHaveAttribute('aria-pressed', 'false');

    star.element().focus();
    await userEvent.keyboard('{Enter}');

    await expect.element(star).toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByTestId('stats')).toHaveTextContent('2 Favoriten');
    expect(api.setFavorite).toHaveBeenCalledWith(1, true);
    // Ada und Linus sind jetzt Favoriten, alphabetisch: Ada, Linus, dann Grace
    await expect.element(items().nth(1)).toHaveTextContent('Linus Torvalds');
  });
});
