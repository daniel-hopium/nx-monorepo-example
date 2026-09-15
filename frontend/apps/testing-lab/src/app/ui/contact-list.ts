import { Component, input, output } from '@angular/core';
import { Contact } from '../data-access/contact';
import { Button } from './button';

/**
 * Präsentationskomponente für die Kontaktliste.
 * Wird von BEIDEN Kontakte-Seiten genutzt (klassischer Store und Resource-Store),
 * damit sich die Seiten nur in der Datenschicht unterscheiden.
 */
@Component({
  selector: 'lab-contact-list',
  imports: [Button],
  template: `
    <ul class="list" [attr.aria-busy]="busy()">
      @for (contact of contacts(); track contact.id) {
        <li class="contact">
          <button
            type="button"
            class="fav"
            [attr.aria-pressed]="contact.favorite"
            [attr.aria-label]="contact.name + ' als Favorit markieren'"
            (click)="favoriteToggled.emit(contact.id)"
          >
            <span aria-hidden="true">{{ contact.favorite ? '★' : '☆' }}</span>
          </button>
          <div class="info">
            <span class="name">{{ contact.name }}</span>
            <span class="meta">{{ contact.email }} · {{ contact.company }}</span>
          </div>
          <button labButton variant="danger" [attr.aria-label]="contact.name + ' löschen'" (click)="removed.emit(contact.id)">
            Löschen
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    .list { list-style: none; margin: 0.5rem 0 0; padding: 0; }
    .list[aria-busy='true'] { opacity: 0.6; transition: opacity 0.2s; }
    .contact { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid #eef0f2; }
    .fav { border: 0; background: transparent; font-size: 1.2rem; color: #f79009; cursor: pointer; }
    .fav:focus-visible { outline: 2px solid #1f3a93; border-radius: 4px; }
    .info { flex: 1; display: flex; flex-direction: column; }
    .name { font-weight: 600; }
    .meta { font-size: 0.8rem; color: #57606a; }
  `,
})
export class ContactList {
  readonly contacts = input.required<Contact[]>();
  /** Liste wird gerade aktualisiert (alte Daten bleiben sichtbar, leicht ausgegraut). */
  readonly busy = input(false);
  readonly favoriteToggled = output<number>();
  readonly removed = output<number>();
}
