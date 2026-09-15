import { Component } from '@angular/core';

/** Aufklappbare Liste, mit welchen Eingaben das Fake-Backend welche Fehler erzeugt. */
@Component({
  selector: 'lab-error-demo-hints',
  template: `
    <details class="hints">
      <summary>Fehlerfälle ausprobieren</summary>
      <ul>
        <li>Suche <code>fehler</code>: Server-Fehler 500, wird 2x automatisch wiederholt, dann "Erneut versuchen"</li>
        <li>Suche <code>offline</code>: keine Verbindung (Status 0)</li>
        <li>Suche <code>langsam</code>: Antwort nach 12 s, Timeout nach 10 s</li>
        <li>Kontakt mit E-Mail <code>vergeben&#64;example.com</code> anlegen: 422, Fehler direkt am E-Mail-Feld</li>
        <li>Kontakt mit "fehler" im Namen anlegen: 500, Fehler über dem Formular, kein Retry (POST)</li>
        <li>"Grace Hopper" löschen: 403, Liste wird zurückgerollt, Toast</li>
      </ul>
    </details>
  `,
  styles: `
    .hints { font-size: 0.8rem; color: #57606a; background: #f6f8fa; border-radius: 6px; padding: 0.5rem 0.75rem; }
    summary { cursor: pointer; font-weight: 600; }
    ul { margin: 0.5rem 0 0; padding-left: 1.1rem; }
    li { margin: 0.2rem 0; }
    code { background: #eaeef2; padding: 0 0.25rem; border-radius: 3px; }
  `,
})
export class ErrorDemoHints {}
