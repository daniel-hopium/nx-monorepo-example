import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * App-Hülle: Kopfzeile mit Hauptnavigation, darunter die Unternavigation
 * des aktiven Bereichs. Inhalt kommt aus den lazy geladenen Features.
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly mainNav = [
    { label: 'Initiativen', link: '/initiativen' },
    { label: 'Auswertung', link: '/auswertung' },
    { label: 'Reporting', link: '/reporting' },
  ];

  protected readonly subNav = [
    { label: 'Übersicht', link: '/initiativen', exact: true },
    { label: 'Initiative erstellen', link: '/initiativen/erstellen', exact: false },
    { label: 'Archiv', link: '/initiativen/archiv', exact: false },
  ];
}
