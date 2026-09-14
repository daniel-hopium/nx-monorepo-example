# Monorepo

Nx-Monorepo mit einer Angular-22-App nach Domain-Driven Design (DDD), einem
Express-Mock-Backend und einem Spring-Boot-Backend. Die Struktur folgt dem
Angular-Architects-Workshop.

## Struktur

```
frontend/
  apps/flight                        Angular-App "Flight" (nur Routing + Layout)
  apps/initiatives                   Angular-App "Initiativen" (Übersicht, Erstellen, Archiv)
  apps/testing-lab                   Lern-App zum Testen mit Vitest (siehe TESTING.md dort)
  libs/
    flight/domain                    Domänenmodell, DTOs, Data-Access (HTTP)
    flight/feature-next-flights      Feature "Nächste Flüge" (Smart Components, Routen)
    flight/ui-blocks                 Präsentations-Komponenten der Domäne
    initiative/domain                Modell, Formular-DTO mit Signal-Forms-Schema, Service
    initiative/feature-overview      Übersicht/Archiv: Suche, Filter, Sortierung, Paging
    initiative/feature-create        Initiative erstellen/bearbeiten (Akkordeon) + Zusammenfassung
    initiative/feature-detail        Detailseite mit Löschen, Bearbeiten, Absenden
    initiative/ui-blocks             Tabelle und Formularblöcke der Domäne
    shared/ui-elements               Generische UI-Elemente (Badge, Pagination, Akkordeon, Textfeld, Dropdown, Suche)
    shared/util                      Domänenübergreifende Helfer (Konfiguration)
backend/
  mock-backend                       Express + TypeScript, Port 5100
  spring-backend                     Spring Boot + Java 21, Port 5200
```

### Tags und Architektur-Regeln

Jede Bibliothek trägt zwei Tags in ihrer `project.json`:

- `domain:flight` / `domain:shared`: fachliche Zugehörigkeit
- `type:app` / `type:feature` / `type:ui` / `type:domain` / `type:util`: technische Schicht

Die erlaubten Abhängigkeiten sind in `eslint.config.mjs` festgelegt
(`@nx/enforce-module-boundaries`). Erlaubt ist nur "nach unten":
`app → feature → ui → domain → util`. Eine Domäne darf andere Domänen nicht
direkt importieren, nur `shared`.

## Befehle

```bash
pnpm install

pnpm nx serve mock-backend      # Express-Backend auf http://localhost:5100/api
pnpm nx serve spring-backend    # Spring-Backend auf http://localhost:5200/api
pnpm nx serve flight            # Angular-App "Flight" auf http://localhost:4200
pnpm start:initiatives          # Angular-App "Initiativen" auf http://localhost:4300
pnpm start:lab                  # Lern-App "Testing Lab" auf http://localhost:4400
pnpm test:lab                   # Vitest: jsdom- und Browser-Tests der Lern-App

pnpm nx run-many -t lint test build
pnpm nx graph                   # Abhängigkeitsgraph im Browser
```

## Tests

Drei Ebenen, jede mit eigenem Zweck:

| Ebene | Werkzeug | Befehl | Was wird geprüft |
| --- | --- | --- | --- |
| Unit | Jest (jsdom) | `pnpm test` | Logik und Komponenten, schnell, ohne Browser |
| Komponente im Browser | Vitest Browser Mode (Chromium via Playwright) | `pnpm test:browser` | Komponenten mit echtem CSS, Layout und Events (`*.browser.spec.ts`) |
| End-to-End | Playwright | `pnpm e2e` | Ganze App gegen das Mock-Backend, aus Nutzersicht |

`pnpm e2e` startet Mock-Backend und App selbst (Playwright `webServer`). Beim ersten Mal
einmalig den Browser laden:

```bash
pnpm exec playwright install chromium
```

Welches Backend die App nutzt, steht in
`frontend/apps/flight/public/configuration.json` (`baseUrl`).

## Neue Bibliothek anlegen

```bash
pnpm nx g @nx/angular:library --name=flight-feature-search --directory=frontend/libs/flight/feature-search --importPath=@monorepo/flight-feature-search --tags=type:feature,domain:flight --prefix=lib --skipModule
```
