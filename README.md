# Monorepo

Nx-Monorepo mit einer Angular-22-App nach Domain-Driven Design (DDD), einem
Express-Mock-Backend und einem Spring-Boot-Backend. Die Struktur folgt dem
Angular-Architects-Workshop.

## Struktur

```
frontend/
  apps/flight                        Angular-App (nur Routing + Layout)
  libs/
    flight/domain                    Domänenmodell, DTOs, Data-Access (HTTP)
    flight/feature-next-flights      Feature "Nächste Flüge" (Smart Components, Routen)
    flight/ui-blocks                 Präsentations-Komponenten der Domäne
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
pnpm nx serve flight            # Angular-App auf http://localhost:4200

pnpm nx run-many -t lint test build
pnpm nx graph                   # Abhängigkeitsgraph im Browser
```

Welches Backend die App nutzt, steht in
`frontend/apps/flight/public/configuration.json` (`baseUrl`).

## Neue Bibliothek anlegen

```bash
pnpm nx g @nx/angular:library --name=flight-feature-search --directory=frontend/libs/flight/feature-search --importPath=@monorepo/flight-feature-search --tags=type:feature,domain:flight --prefix=lib --skipModule
```
