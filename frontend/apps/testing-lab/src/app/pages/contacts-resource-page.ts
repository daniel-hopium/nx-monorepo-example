import { Component, inject } from '@angular/core';
import { ContactResourceStore } from '../data-access/contact-resource-store';
import { NewContact } from '../data-access/contact';
import { ContactForm } from '../ui/contact-form';
import { ContactList } from '../ui/contact-list';
import { ErrorDemoHints } from '../ui/error-demo-hints';
import { ErrorState } from '../ui/error-state';

/**
 * Smart Component, VARIANTE B (Signal Store mit Resource API).
 * Template fast identisch mit contacts-page.ts. Unterschiede:
 *   - `store.error()` kommt direkt aus der Resource statt aus eigenem State
 *   - `store.isInitialLoading()` unterscheidet erstes Laden vom Aktualisieren
 *   - `store.retry()` ruft intern `resource.reload()`
 */
@Component({
  // Eigener Selector: ohne ihn erzeugt Angular für beide (fast gleichen) Seiten dieselbe ID (NG0912).
  selector: 'lab-contacts-resource-page',
  imports: [ContactForm, ContactList, ErrorDemoHints, ErrorState],
  providers: [ContactResourceStore],
  template: `
    <section class="card">
      <header class="head">
        <h1>Kontakte <small>Resource API</small></h1>
        <p class="stats" data-testid="stats">{{ store.total() }} Kontakte, {{ store.favoriteCount() }} Favoriten</p>
      </header>

      <lab-error-demo-hints />

      <div class="search">
        <label for="contact-search">Suchen</label>
        <input
          id="contact-search"
          type="search"
          placeholder="Name, E-Mail oder Firma"
          [value]="store.query()"
          (input)="store.search($any($event.target).value)"
        />
      </div>

      @if (store.error(); as error) {
        <lab-error-state
          title="Kontakte konnten nicht geladen werden"
          [error]="error"
          [compact]="store.total() > 0"
          [retrying]="store.isLoading()"
          (retry)="store.retry()"
        />
      }

      <div aria-live="polite">
        @if (store.isInitialLoading()) {
          <p class="hint">Lade Kontakte…</p>
        } @else if (store.isEmpty()) {
          <p class="hint">Keine Kontakte gefunden.</p>
        }
      </div>

      <lab-contact-list
        [contacts]="store.sortedContacts()"
        [busy]="store.isLoading()"
        (favoriteToggled)="store.toggleFavorite($event)"
        (removed)="store.remove($event)"
      />

      <h2>Neuer Kontakt</h2>
      <lab-contact-form [save]="save" />
    </section>
  `,
  styleUrl: './contacts-page.css',
})
export class ContactsResourcePage {
  protected readonly store = inject(ContactResourceStore);
  protected readonly save = (contact: NewContact) => this.store.add(contact);
}
