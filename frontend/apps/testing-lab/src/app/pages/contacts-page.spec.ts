/**
 * SMART COMPONENT MIT SIGNAL STORE TESTEN (jsdom, Store gefakt)
 *
 * Frage dieses Tests: Verbindet die Komponente Store und Template RICHTIG?
 *   - Zeigt sie an, was im Store steht? (Signale -> DOM)
 *   - Ruft sie bei Nutzeraktionen die richtige Store-Methode? (DOM -> Methoden)
 * Die Logik des Stores ist hier egal, die ist in contact-store.spec.ts getestet.
 *
 * Der Store wird durch ein Fake-Objekt ersetzt: schreibbare Signale statt
 * echtem Zustand, vi.fn() statt echter Methoden. Der Test kann so jeden
 * Zustand direkt einstellen (loading, error, leere Liste …).
 *
 * DER WICHTIGSTE PUNKT: Die Komponente hat `providers: [ContactStore]`.
 * Ein Provider im TestBed würde dagegen verlieren, weil Angular zuerst im
 * Injector der Komponente sucht. Deshalb:
 *   TestBed.overrideComponent(ContactsPage, { set: { providers: [...] } })
 * ersetzt die Provider direkt an der Komponente.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contact } from '../data-access/contact';
import { ContactStore } from '../data-access/contact-store';
import { ContactsPage } from './contacts-page';

const contacts: Contact[] = [
  { id: 2, name: 'Ada', email: 'ada@example.com', company: 'AE', favorite: true },
  { id: 1, name: 'Linus', email: 'linus@example.com', company: 'LF', favorite: false },
];

/** Fake mit genau den Mitgliedern, die das Template benutzt. */
function createStoreFake() {
  return {
    sortedContacts: signal<Contact[]>(contacts),
    query: signal(''),
    loading: signal(false),
    saving: signal(false),
    error: signal<string | null>(null),
    total: signal(2),
    favoriteCount: signal(1),
    search: vi.fn(),
    add: vi.fn<(dto: unknown) => Promise<boolean>>().mockResolvedValue(true),
    remove: vi.fn(),
    toggleFavorite: vi.fn(),
    clearError: vi.fn(),
  };
}

describe('ContactsPage (jsdom, Store gefakt)', () => {
  let store: ReturnType<typeof createStoreFake>;
  let fixture: ComponentFixture<ContactsPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    store = createStoreFake();

    await TestBed.configureTestingModule({ imports: [ContactsPage] })
      .overrideComponent(ContactsPage, {
        set: { providers: [{ provide: ContactStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ContactsPage);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  // --- Helfer ---
  const names = () => Array.from(el.querySelectorAll('.contact .name')).map((n) => n.textContent);
  const button = (label: string) => el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const formInput = (label: string) =>
    Array.from(el.querySelectorAll('form label'))
      .find((l) => l.querySelector('span')?.textContent === label)
      ?.querySelector('input') as HTMLInputElement;
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input')); // FormField hört auf "input"
  };
  const render = () => fixture.whenStable();

  describe('Store -> Template', () => {
    it('zeigt die Kontakte in der Reihenfolge von sortedContacts', () => {
      expect(names()).toEqual(['Ada', 'Linus']);
    });

    it('zeigt die Zähler aus den computed-Signalen', () => {
      expect(el.querySelector('[data-testid=stats]')?.textContent).toBe('2 Kontakte, 1 Favoriten');
    });

    it('Ladezustand: Hinweis sichtbar, kein "Keine Kontakte"', async () => {
      store.sortedContacts.set([]);
      store.loading.set(true);
      await render();

      expect(el.textContent).toContain('Lade Kontakte');
      expect(el.textContent).not.toContain('Keine Kontakte gefunden');
      expect(el.querySelector('.list')?.getAttribute('aria-busy')).toBe('true');
    });

    it('leere Liste ohne Laden zeigt den Leerzustand', async () => {
      store.sortedContacts.set([]);
      await render();
      expect(el.textContent).toContain('Keine Kontakte gefunden');
    });

    it('ein Fehler im Store erscheint als Alert', async () => {
      store.error.set('Kontakte konnten nicht geladen werden');
      await render();

      const alert = el.querySelector('[role=alert]');
      expect(alert?.textContent).toContain('Kontakte konnten nicht geladen werden');
    });

    it('Favoriten-Button spiegelt den Zustand in aria-pressed', () => {
      expect(button('Ada als Favorit markieren').getAttribute('aria-pressed')).toBe('true');
      expect(button('Linus als Favorit markieren').getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('Template -> Store-Methoden', () => {
    it('Eingabe im Suchfeld ruft search mit dem Text', () => {
      type(el.querySelector('#contact-search') as HTMLInputElement, 'gra');
      expect(store.search).toHaveBeenCalledWith('gra');
    });

    it('Stern ruft toggleFavorite, Löschen ruft remove, jeweils mit der Id', () => {
      button('Linus als Favorit markieren').click();
      button('Ada löschen').click();

      expect(store.toggleFavorite).toHaveBeenCalledExactlyOnceWith(1);
      expect(store.remove).toHaveBeenCalledExactlyOnceWith(2);
    });

    it('Alert schließen ruft clearError', async () => {
      store.error.set('Kaputt');
      await render();

      button('Hinweis schließen').click();

      expect(store.clearError).toHaveBeenCalledOnce();
    });
  });

  describe('Formular', () => {
    const submitButton = () => el.querySelector('form button[type=submit]') as HTMLButtonElement;

    it('Anlegen ist gesperrt, bis Name und gültige E-Mail da sind', async () => {
      expect(submitButton().disabled).toBe(true);

      type(formInput('Name'), 'Grace');
      type(formInput('E-Mail'), 'keine-mail');
      await render();
      expect(submitButton().disabled).toBe(true); // E-Mail ungültig

      type(formInput('E-Mail'), 'grace@example.com');
      await render();
      expect(submitButton().disabled).toBe(false);
    });

    it('Absenden ruft add mit den Werten und leert das Formular bei Erfolg', async () => {
      type(formInput('Name'), 'Grace');
      type(formInput('E-Mail'), 'grace@example.com');
      type(formInput('Firma'), 'Navy');
      await render();

      el.querySelector('form')?.dispatchEvent(new Event('submit'));

      expect(store.add).toHaveBeenCalledWith({ name: 'Grace', email: 'grace@example.com', company: 'Navy' });
      // submit ist async (wartet auf add). vi.waitFor wiederholt die Prüfung,
      // bis sie klappt oder ein Timeout greift, statt sofort zu scheitern.
      await vi.waitFor(async () => {
        await render();
        expect(formInput('Name').value).toBe('');
      });
    });

    it('bei Fehlschlag bleibt die Eingabe erhalten', async () => {
      store.add.mockResolvedValue(false);
      type(formInput('Name'), 'Grace');
      type(formInput('E-Mail'), 'grace@example.com');
      await render();

      el.querySelector('form')?.dispatchEvent(new Event('submit'));
      await store.add.mock.results[0].value; // auf das Promise des Mocks warten
      await render();

      expect(formInput('Name').value).toBe('Grace');
    });

    it('der Button zeigt den Speicherzustand des Stores', async () => {
      store.saving.set(true);
      await render();
      expect(submitButton().getAttribute('aria-busy')).toBe('true');
    });
  });
});
