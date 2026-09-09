# spring-backend

Java-Backend mit Spring Boot und klassischer MVC-Schichtung. Es bietet dieselben
Endpunkte wie das Express-Mock-Backend (`backend/mock-backend`), läuft aber auf
Port **5200**. So lassen sich beide Backends direkt vergleichen.

## Starten

```bash
pnpm nx serve spring-backend
```

Beim ersten Start lädt der Maven Wrapper (`mvnw`) Maven automatisch herunter.
Voraussetzung: JDK 21 (`JAVA_HOME` gesetzt).

Angular gegen dieses Backend fahren: in `frontend/apps/flight/public/configuration.json`
die `baseUrl` auf `http://localhost:5200/api` stellen.

## Struktur (MVC + Schichten)

```
src/main/java/com/monorepo/flight
├── controller/   HTTP-Endpunkte (@RestController), keine Fachlogik
├── service/      Fachlogik (@Service), z. B. Filtern und Limitieren
├── repository/   Datenzugriff (@Repository), hier In-Memory
├── model/        Domänenobjekte (Records)
├── dto/          Ein-/Ausgabeobjekte der API
├── exception/    Fachliche Exceptions + zentrale Fehlerbehandlung
└── config/       CORS und Testdaten-Initialisierung
```

## Express vs. Spring, die wichtigsten Unterschiede

| Thema | Express (`mock-backend`) | Spring Boot (`spring-backend`) |
| --- | --- | --- |
| Routing | `app.get('/api/flights/:id', handler)` | `@GetMapping("/flights/{id}")` auf einer Methode |
| Struktur | eine Datei mit allen Handlern | Controller → Service → Repository |
| Abhängigkeiten | Module direkt importieren | Dependency Injection über den Konstruktor |
| Validierung | manuell im Handler | `@Valid` + Constraint-Annotationen |
| Fehler (404) | in jedem Handler `res.status(404)` | einmal zentral im `@RestControllerAdvice` |
| Typen | TypeScript-Types (zur Laufzeit weg) | Java-Records (zur Laufzeit geprüft) |
