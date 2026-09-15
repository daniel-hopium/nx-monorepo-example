import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppErrorKind, USER_MESSAGES } from '../core/error/app-error';

/**
 * Ziel des Navigation-Error-Handlers. Der Grund kommt als Query-Parameter
 * (`?grund=offline`) und wird per withComponentInputBinding zum Input.
 */
@Component({
  imports: [RouterLink],
  template: `
    <section class="card" role="alert">
      <h1>Seite konnte nicht geladen werden</h1>
      <p>{{ message() }}</p>
      <a routerLink="/aufgaben">Zur Startseite</a>
    </section>
  `,
  styles: `
    .card { background: #fff; border-radius: 6px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 0.5rem; font-size: 1.3rem; color: #b42318; }
  `,
})
export class ErrorPage {
  readonly grund = input<string>();

  protected readonly message = computed(() => {
    const kind = this.grund() as AppErrorKind | undefined;
    return (kind && USER_MESSAGES[kind]) || USER_MESSAGES.unknown;
  });
}
