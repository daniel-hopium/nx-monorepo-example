import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { ContactStore } from '../data-access/contact-store';
import { NewContact } from '../data-access/contact';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';

/**
 * Smart Component für Kontakte.
 *
 * "Smart" heißt: sie kennt den Store und verbindet ihn mit dem Template. Sie
 * enthält selbst KEINE Datenlogik (kein HTTP, kein Sortieren, kein Rollback).
 * Alles davon liegt im Store und wird dort getestet.
 *
 * `providers: [ContactStore]` erzeugt eine Store-Instanz PRO Komponente. Wird
 * die Seite verlassen, verschwindet der Store mit ihr (kein globaler Zustand).
 * Für den Test bedeutet das: der Store muss per `TestBed.overrideComponent`
 * ersetzt werden, ein normales `providers` im TestBed reicht NICHT, weil der
 * Komponenten-Provider näher dran ist und gewinnt.
 */
@Component({
  imports: [Alert, Button, FormField],
  providers: [ContactStore],
  template: `
    <section class="card">
      <header class="head">
        <h1>Kontakte</h1>
        <p class="stats" data-testid="stats">{{ store.total() }} Kontakte, {{ store.favoriteCount() }} Favoriten</p>
      </header>

      @if (store.error(); as error) {
        <lab-alert kind="error" [dismissible]="true" (closed)="store.clearError()">{{ error }}</lab-alert>
      }

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

      <div aria-live="polite" class="status">
        @if (store.loading()) {
          <p>Lade Kontakte…</p>
        }
      </div>

      <ul class="list" [attr.aria-busy]="store.loading()">
        @for (contact of store.sortedContacts(); track contact.id) {
          <li class="contact">
            <button
              type="button"
              class="fav"
              [attr.aria-pressed]="contact.favorite"
              [attr.aria-label]="contact.name + ' als Favorit markieren'"
              (click)="store.toggleFavorite(contact.id)"
            >
              <span aria-hidden="true">{{ contact.favorite ? '★' : '☆' }}</span>
            </button>
            <div class="info">
              <span class="name">{{ contact.name }}</span>
              <span class="meta">{{ contact.email }} · {{ contact.company }}</span>
            </div>
            <button labButton variant="danger" [attr.aria-label]="contact.name + ' löschen'" (click)="store.remove(contact.id)">
              Löschen
            </button>
          </li>
        } @empty {
          @if (!store.loading()) {
            <li class="empty">Keine Kontakte gefunden.</li>
          }
        }
      </ul>

      <h2>Neuer Kontakt</h2>
      <form class="form" (submit)="submit($event)">
        <label>
          <span>Name</span>
          <input [formField]="f.name" />
        </label>
        <label>
          <span>E-Mail</span>
          <input type="email" [formField]="f.email" />
        </label>
        <label>
          <span>Firma</span>
          <input [formField]="f.company" />
        </label>
        <button labButton type="submit" [loading]="store.saving()" [disabled]="!f().valid()">Anlegen</button>
      </form>
    </section>
  `,
  styles: `
    .card { background: #fff; border-radius: 6px; padding: 1.25rem 1.5rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .head { display: flex; justify-content: space-between; align-items: baseline; }
    h1 { margin: 0 0 1rem; font-size: 1.4rem; }
    h2 { font-size: 1rem; margin: 1.5rem 0 0.75rem; color: #57606a; }
    .stats { color: #57606a; font-size: 0.85rem; margin: 0; }
    .search { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #57606a; max-width: 320px; }
    input { font: inherit; padding: 0.4rem 0.6rem; border: 1px solid #d0d7de; border-radius: 6px; }
    .status p { font-size: 0.85rem; color: #57606a; margin: 0.5rem 0; }
    .list { list-style: none; margin: 0.5rem 0 0; padding: 0; }
    .contact { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid #eef0f2; }
    .fav { border: 0; background: transparent; font-size: 1.2rem; color: #f79009; cursor: pointer; }
    .fav:focus-visible { outline: 2px solid #1f3a93; border-radius: 4px; }
    .info { flex: 1; display: flex; flex-direction: column; }
    .name { font-weight: 600; }
    .meta { font-size: 0.8rem; color: #57606a; }
    .empty { color: #8c959f; padding: 1rem 0; }
    .form { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #57606a; }
  `,
})
export class ContactsPage {
  protected readonly store = inject(ContactStore);

  private readonly model = signal<NewContact>({ name: '', email: '', company: '' });
  protected readonly f = form(this.model, (c) => {
    required(c.name);
    required(c.email);
    email(c.email);
  });

  protected async submit(event: Event) {
    event.preventDefault();
    if (!this.f().valid()) return;

    const ok = await this.store.add({ ...this.model() });
    // Nur bei Erfolg leeren: schlägt das Anlegen fehl, bleibt die Eingabe erhalten.
    if (ok) {
      this.model.set({ name: '', email: '', company: '' });
      this.f().reset();
    }
  }
}
