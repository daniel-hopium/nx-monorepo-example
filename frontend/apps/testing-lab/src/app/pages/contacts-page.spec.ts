/**
 * SMART COMPONENT MIT SIGNAL STORE TESTEN (jsdom, Store gefakt)
 *
 * Frage dieses Tests: Verbindet die Komponente Store und Template RICHTIG?
 *   - Zeigt sie für jeden Zustand die richtige Anzeige? (Signale -> DOM)
 *   - Ruft sie bei Nutzeraktionen die richtige Store-Methode? (DOM -> Methoden)
 * Die Logik des Stores ist hier egal, die ist in contact-store.spec.ts getestet.
 *
 * Gerade beim Error Handling lohnt dieser Test: die vier Zustände
 * (erstes Laden, Fehler ohne Daten, Fehler mit alten Daten, leer) lassen sich
 * mit einem Fake-Store in einer Zeile einstellen. Mit echtem Store und HTTP
 * wäre jeder davon mühsam herzustellen.
 *
 * DER WICHTIGSTE PUNKT: Die Komponente hat `providers: [ContactStore]`.
 * Ein Provider im TestBed würde verlieren, weil Angular zuerst im Injector der
 * Komponente sucht. Deshalb:
 *   TestBed.overrideComponent(ContactsPage, { set: { providers: [...] } })
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppError, USER_MESSAGES } from '../core/error/app-error';
import { ok } from '../core/error/result';
import { Contact, NewContact } from '../data-access/contact';
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
    isLoading: signal(false),
    isEmpty: signal(false),
    loadError: signal<AppError | null>(null),
    total: signal(2),
    favoriteCount: signal(1),
    search: vi.fn(),
    retry: vi.fn(),
    add: vi.fn((dto: NewContact) => Promise.resolve(ok<Contact>({ ...dto, id: 9, favorite: false }))),
    remove: vi.fn(),
    toggleFavorite: vi.fn(),
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
  const names = () => Array.from(el.querySelectorAll('.contact .name')).map((n) => n.textContent?.trim());
  const button = (label: string) => el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const buttonByText = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  const alert = () => el.querySelector('lab-error-state [role=alert]');
  const render = () => fixture.whenStable();

  /** Zustand "Liste leer" herstellen: Fake-Signale passend zueinander setzen. */
  const withoutContacts = () => {
    store.sortedContacts.set([]);
    store.total.set(0);
  };

  describe('Anzeige je Zustand', () => {
    it('geladen: Kontakte in der Reihenfolge von sortedContacts und Zähler', () => {
      expect(names()).toEqual(['Ada', 'Linus']);
      expect(el.querySelector('[data-testid=stats]')?.textContent?.trim()).toBe('2 Kontakte, 1 Favoriten');
      expect(alert()).toBeNull();
    });

    it('erstes Laden: Ladehinweis, kein Leerzustand, Liste aria-busy', async () => {
      withoutContacts();
      store.isLoading.set(true);
      await render();

      expect(el.textContent).toContain('Lade Kontakte');
      expect(el.textContent).not.toContain('Keine Kontakte gefunden');
      expect(el.querySelector('.list')?.getAttribute('aria-busy')).toBe('true');
    });

    it('leer nach Erfolg: Leerzustand', async () => {
      withoutContacts();
      store.isEmpty.set(true);
      await render();

      expect(el.textContent).toContain('Keine Kontakte gefunden');
    });

    it('Fehler ohne Daten: große Fehleranzeige mit Titel und Nutzer-Meldung', async () => {
      withoutContacts();
      store.loadError.set(new AppError('server'));
      await render();

      expect(alert()?.textContent).toContain('Kontakte konnten nicht geladen werden');
      expect(alert()?.textContent).toContain(USER_MESSAGES.server);
      expect(el.querySelector('.error-state')?.classList).not.toContain('compact');
    });

    it('Fehler mit alten Daten: kompakte Anzeige, Liste bleibt sichtbar', async () => {
      store.loadError.set(new AppError('offline'));
      await render();

      expect(el.querySelector('.error-state')?.classList).toContain('compact');
      expect(names()).toEqual(['Ada', 'Linus']);
    });

    it('Retry-Button nur bei wiederholbaren Fehlern (403 wird durch Wiederholen nicht besser)', async () => {
      store.loadError.set(new AppError('forbidden'));
      await render();

      expect(alert()?.textContent).toContain(USER_MESSAGES.forbidden);
      expect(buttonByText('Erneut versuchen')).toBeUndefined();
    });
  });

  describe('Template -> Store-Methoden', () => {
    it('"Erneut versuchen" ruft store.retry', async () => {
      store.loadError.set(new AppError('server'));
      await render();

      buttonByText('Erneut versuchen')?.click();

      expect(store.retry).toHaveBeenCalledOnce();
    });

    it('während des erneuten Ladens zeigt der Retry-Button den Ladezustand', async () => {
      store.loadError.set(new AppError('server'));
      store.isLoading.set(true);
      await render();

      expect(buttonByText('Erneut versuchen')?.getAttribute('aria-busy')).toBe('true');
    });

    it('Eingabe im Suchfeld ruft search mit dem Text', () => {
      const input = el.querySelector('#contact-search') as HTMLInputElement;
      input.value = 'gra';
      input.dispatchEvent(new Event('input'));

      expect(store.search).toHaveBeenCalledWith('gra');
    });

    it('Stern ruft toggleFavorite, Löschen ruft remove, jeweils mit der Id', () => {
      button('Linus als Favorit markieren').click();
      button('Ada löschen').click();

      expect(store.toggleFavorite).toHaveBeenCalledExactlyOnceWith(1);
      expect(store.remove).toHaveBeenCalledExactlyOnceWith(2);
    });

    it('das Formular speichert über store.add', async () => {
      const type = (label: string, value: string) => {
        const labelEl = Array.from(el.querySelectorAll('lab-contact-form label')).find(
          (l) => l.textContent?.trim() === label
        );
        const input = el.querySelector(`#${labelEl?.getAttribute('for')}`) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      };
      type('Name', 'Grace');
      type('E-Mail', 'grace@example.com');
      await render();

      el.querySelector('form')?.dispatchEvent(new Event('submit'));

      await vi.waitFor(() =>
        expect(store.add).toHaveBeenCalledWith({ name: 'Grace', email: 'grace@example.com', company: '' })
      );
    });
  });
});
