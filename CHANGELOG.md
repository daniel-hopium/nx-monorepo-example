# Changelog

Alle nennenswerten Änderungen an Monorepo. Die Einträge beschreiben, was das Projekt
danach kann bzw. was sich für den Nutzer ändert – kein Commit-Protokoll.

**Regel:** Jeder Commit bekommt seinen Eintrag, im selben Commit. Neues kommt oben unter
„Unveröffentlicht“ dazu; beim Release wird daraus ein Abschnitt mit Versionsnummer und Datum.

Kategorien: **Neu** (neue Funktionen), **Verbessert** (bestehendes Verhalten), **Behoben**
(Fehler), **Intern** (Struktur, Tooling, nicht sichtbar).

## Unveröffentlicht

### Neu
- Angular-22-App `flight` mit Seitenmenü und lazy geladenem Feature „Nächste Flüge“,
  das Flüge vom Backend lädt und als Karten anzeigt.
- Express-Mock-Backend (Port 5100) mit Flug- und Flugzeugdaten inklusive Suche,
  Anlegen, Ändern und Löschen.
- Spring-Boot-Backend (Port 5200) mit denselben Endpunkten in klassischer
  MVC-Schichtung (Controller, Service, Repository) zum Vergleich mit Express.

### Intern
- Nx-Workspace mit pnpm, ESLint, Jest und Prettier aufgesetzt; Struktur nach dem
  Angular-Architects-Workshop (`frontend/apps`, `frontend/libs`, `backend`).
- DDD-Bibliotheken `flight-domain`, `flight-feature-next-flights`, `flight-ui-blocks`
  und `shared-util` mit `domain:*`/`type:*`-Tags und Modul-Grenzen in ESLint.
