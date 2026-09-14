# Changelog

Alle nennenswerten Änderungen an Monorepo. Die Einträge beschreiben, was das Projekt
danach kann bzw. was sich für den Nutzer ändert – kein Commit-Protokoll.

**Regel:** Jeder Commit bekommt seinen Eintrag, im selben Commit. Neues kommt oben unter
„Unveröffentlicht“ dazu; beim Release wird daraus ein Abschnitt mit Versionsnummer und Datum.

Kategorien: **Neu** (neue Funktionen), **Verbessert** (bestehendes Verhalten), **Behoben**
(Fehler), **Intern** (Struktur, Tooling, nicht sichtbar).

## Unveröffentlicht

### Neu
- `testing-lab`: Barrierefreiheits-Tests (`*.a11y.browser.spec.ts`) für Listenzeile,
  Formular und Tabelle. Sie prüfen Tastaturbedienung, Tab-Reihenfolge, sichtbaren
  Fokus sowie exakte Accessible Names und Descriptions. `TESTING.md` erklärt das
  Vorgehen und die Matcher.
- `testing-lab`: eigene Komponenten für Button, Alert, Select, sortierbare Tabelle,
  Bestätigungsdialog (Modal) und Tabs sowie Tests für die bisher ungetesteten Toasts.
  Neue Seite „Komponenten“ zeigt alle Arten. Jede Art hat einen jsdom- und einen
  Browser-Test; der Dialog nur im Browser, weil jsdom `showModal()` nicht kennt.
  `TESTING.md` hat eine Übersicht, welcher Test was lehrt (86 jsdom-, 39 Browser-Tests).
- Lern-App `testing-lab` (Aufgabenliste mit Formular, Filter, Statistik-Seite und
  Toasts) samt `TESTING.md`: 46 jsdom-Tests und 12 Browser-Tests zeigen reine
  Unit-Tests, Pipes, Services mit HttpTestingController, Fake Timers, Modul-Mocks
  (`vi.mock`), Spione (`vi.spyOn`/`vi.fn`), DI-Fakes (`useValue`), Router-Tests
  mit RouterTestingHarness und Browser-Tests mit `page`/`userEvent`/`expect.element`.
- Detailseite einer Initiative (Klick auf eine Zeile der Übersicht): Kopf mit
  „Löschen“, „Bearbeiten“ und „Absenden“, Info-Karte mit Freigabe-Badge, Ersteller und
  Aktualisierungsdatum, alle Abschnitte als Label/Wert-Listen. „Absenden“ setzt einen
  Entwurf auf „Freigabe offen“, „Bearbeiten“ lädt den Datensatz ins Formular.
- Stammdaten-Felder ans Mockup angeglichen (Kurztitel, Initiativen-ID,
  Konzernunternehmen im Lead, Typ, Interne Kooperation, Auftraggeber*in).
- Angular-App `initiatives` mit Kopfzeile, Haupt- und Unternavigation. Die
  Übersicht zeigt Initiativen als sortierbare Tabelle mit Suche, Filter (Phase,
  Freigabe), Status-Badges und Seitennavigation; das Archiv nutzt dieselbe Ansicht.
- Seite „Initiative erstellen“ mit fünf aufklappbaren Abschnitten (Stammdaten,
  Status, Budget, Gruppenstrategie, Weitere), Zähler ausgefüllter Felder je
  Abschnitt, Zusammenfassung und Speichern ans Mock-Backend.
- Mock-Backend liefert Initiativen unter `/api/initiatives` mit Suche, Sortierung,
  Filter und Paging.
- Angular-22-App `flight` mit Seitenmenü und lazy geladenem Feature „Nächste Flüge“,
  das Flüge vom Backend lädt und als Karten anzeigt.
- Express-Mock-Backend (Port 5100) mit Flug- und Flugzeugdaten inklusive Suche,
  Anlegen, Ändern und Löschen.
- Spring-Boot-Backend (Port 5200) mit denselben Endpunkten in klassischer
  MVC-Schichtung (Controller, Service, Repository) zum Vergleich mit Express.

### Behoben
- `testing-lab`, Tabelle: klickbare Zeilen waren per Tastatur nicht erreichbar. Mit dem
  neuen Input `rowActionLabel` bekommt die erste Zelle einen fokussierbaren Button.
- `testing-lab`, Tabelle: Sortier-Buttons heißen jetzt „<Spalte> sortieren“ statt nur
  „<Spalte>“.
- `testing-lab`, Formular: das Titelfeld meldet Fehler jetzt auch an Screenreader
  (`aria-invalid`, Meldung per `aria-describedby` verknüpft).

### Intern
- `@vitest/browser` als devDependency, damit `import { page, userEvent } from 'vitest/browser'`
  typisiert ist. `testing-lab` nutzt Vitest (Analog-Plugin) auch für die jsdom-Tests,
  mit getrennten Konfigurationen `vite.config.mts` und `vite.browser.config.mts`.
- End-to-End-Tests mit Playwright (`pnpm e2e`) für Übersicht und „Initiative erstellen“;
  Mock-Backend und App werden automatisch gestartet.
- Vitest im Browser-Modus (Chromium) für UI-Komponenten (`pnpm test:browser`),
  getrennt von den Jest-Unit-Tests über die Endung `.browser.spec.ts`.
- Neue Schicht `type:ui-composition` (Blöcke aus generischen UI-Elementen) und
  Domäne `domain:initiative` in den ESLint-Modulgrenzen.
- Nx-Workspace mit pnpm, ESLint, Jest und Prettier aufgesetzt; Struktur nach dem
  Angular-Architects-Workshop (`frontend/apps`, `frontend/libs`, `backend`).
- DDD-Bibliotheken `flight-domain`, `flight-feature-next-flights`, `flight-ui-blocks`
  und `shared-util` mit `domain:*`/`type:*`-Tags und Modul-Grenzen in ESLint.
