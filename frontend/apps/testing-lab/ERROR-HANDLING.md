# Error Handling in Angular

Diese App zeigt Fehlerbehandlung so, wie man sie in einer echten Angular-Anwendung
aufbaut. Dieselbe Seite „Kontakte“ gibt es zweimal, mit identischem Template und
identischer Fehlerstrategie:

| Route                | Store                                          | Lesen über                         |
| -------------------- | ---------------------------------------------- | ---------------------------------- |
| `/kontakte`          | `data-access/contact-store.ts` (Variante A)    | `rxMethod` + `switchMap` + `catchError` |
| `/kontakte-resource` | `data-access/contact-resource-store.ts` (Variante B) | `httpResource` + `debounced`  |

Unter „Fehlerfälle ausprobieren“ auf beiden Seiten stehen die Eingaben, mit denen das
Mock-Backend Fehler erzeugt (Suche `fehler` → 500, `offline` → Status 0, `langsam` → Timeout,
E-Mail `vergeben@example.com` → 422, „Grace Hopper“ löschen → 403).

## Die Grundidee: Fehler haben Ebenen

Nicht jeder Fehler gehört an dieselbe Stelle. Die wichtigste Entscheidung ist, **wer**
einen Fehler behandelt.

```
 ┌───────────────────────────────────────────────────────────────┐
 │ Komponente / Store     erwartete Fehler, fachlich              │
 │   Lesen  -> Zustand, inline mit "Erneut versuchen"             │
 │   Schreiben -> Result: Formular-Feldfehler oder Rollback+Toast │
 ├───────────────────────────────────────────────────────────────┤
 │ HTTP-Interceptor       technisch, für ALLE Requests gleich     │
 │   Timeout, Retry mit Backoff, in AppError übersetzen, loggen   │
 │   KEINE Anzeige                                                │
 ├───────────────────────────────────────────────────────────────┤
 │ Router                 Navigation scheitert (Resolver, Guard,  │
 │   withNavigationErrorHandler -> Fehlerseite    Lazy Chunk)     │
 ├───────────────────────────────────────────────────────────────┤
 │ GlobalErrorHandler     UNERWARTETE Fehler (Bugs)               │
 │   loggen + eine allgemeine Meldung, letztes Sicherheitsnetz    │
 └───────────────────────────────────────────────────────────────┘
```

### 1. Ein Fehlermodell: `AppError` (`core/error/app-error.ts`)

Jede Schicht darüber arbeitet nur noch mit `kind`, `userMessage`, `retryable` und
`fieldErrors`. Niemand außer `toAppError` muss wissen, dass Status 0 „offline“ heißt oder
wo im Body die Feldfehler stehen. `toAppError` ist eine reine Funktion und wirft nie.

- **`userMessage`** ist für Menschen. Die technische `message` geht nur ins Log.
- **`retryable`** ist nur bei offline, timeout und server wahr. Ein 403 wird durch
  Wiederholen nicht besser, also gibt es dort keinen „Erneut versuchen“-Button.

### 2. HTTP-Interceptor (`core/error/http-error.interceptor.ts`)

- **Retry nur für idempotente Methoden** (GET, HEAD, OPTIONS). Ein POST, dessen Antwort
  verloren ging, wurde vielleicht schon ausgeführt. Nochmal senden hieße doppelte Daten.
- **Exponential Backoff**: 500 ms, 1000 ms … So bekommt ein überlasteter Server Luft.
- **Einmal loggen**, mit dem endgültigen Fehler, nicht pro Versuch.
- **Keine Toasts im Interceptor.** Nur der Aufrufer weiß, ob ein Fehler inline, am
  Formularfeld, als Toast oder gar nicht angezeigt werden soll.
- Pro Request überschreibbar über `HttpContext` (`RETRIES`, `TIMEOUT_MS`), global über
  das `InjectionToken` `HTTP_ERROR_CONFIG`. Tests setzen damit die Wartezeiten auf 0.

### 3. Navigation (`core/error/navigation-error-handler.ts`)

Wirft ein Resolver oder fehlt nach einem Deployment ein Lazy Chunk, bliebe der Nutzer
ohne Handler still auf der alten Seite. Der Handler gibt einen `RedirectCommand` auf
`/fehler?grund=…` zurück. Mit `browserUrl` steht in der Adresszeile weiter die gewünschte
URL, „Neu laden“ probiert es also erneut. Ausprobieren: Seite „Komponenten“ → „Kaputte Route öffnen“.

### 4. Globaler ErrorHandler (`core/error/global-error-handler.ts`)

`provideBrowserGlobalErrorListeners()` leitet auch unbehandelte Promise-Rejections und
`window.onerror` an den `ErrorHandler`. Der eigene Handler loggt den Originalfehler (mit
Stacktrace) und zeigt eine freundliche Meldung. Er darf **nie selbst werfen**.
Ausprobieren: Seite „Komponenten“ → „Unerwarteten Fehler auslösen“.

## Lesen vs. Schreiben

| | Lesen (Liste laden) | Schreiben (anlegen, löschen, favorisieren) |
|---|---|---|
| Wo steht der Fehler? | im **Zustand** des Stores | als **Rückgabewert** (`Result`) |
| Anzeige | inline (`lab-error-state`) mit „Erneut versuchen“ | Anlegen: am Formularfeld · Löschen/Favorit: Toast |
| Alte Daten | bleiben sichtbar (**stale-while-error**) | optimistisch geändert, bei Fehler **Rollback** |
| Retry | automatisch im Interceptor, danach manuell | nie automatisch (nicht idempotent) |

Warum `Result` statt Exception bei Befehlen? `Promise<Result<Contact>>` zwingt den
Aufrufer über den Typ, den Fehlerfall zu behandeln. Eine vergessene `try/catch` fällt
dagegen erst zur Laufzeit auf und landet im GlobalErrorHandler.

Warum ist ein Ladefehler nicht „leer“? Eine leere Liste nach einem Fehler sieht aus wie
„keine Kontakte vorhanden“. Das ist eine falsche Aussage. Deshalb gilt `isEmpty` nur nach
erfolgreichem Laden.

## Variante A: klassisch mit `rxMethod`

```ts
switchMap((query) =>
  api.getContacts(query).pipe(
    tap((contacts) => patchState(store, { contacts, loadStatus: 'loaded', loadError: null })),
    catchError((error) => {
      patchState(store, { loadStatus: 'error', loadError: toAppError(error) });
      return EMPTY; // Strom lebt weiter
    })
  )
)
```

- `catchError` **innerhalb** von `switchMap`. Außerhalb würde der Fehler den ganzen
  Strom beenden, und jede spätere Suche täte nichts mehr.
- Status und Fehler pflegt der Store selbst (`loadStatus`, `loadError`).
- Stärken: volle Kontrolle über Timing (`debounceTime`, `distinctUntilChanged`),
  bekannt aus jedem RxJS-Projekt.

## Variante B: Resource API

```ts
const debouncedQuery = debounced(query, 300);
const contacts = httpResource<Contact[]>((ctx) => ({
  url: '/api/contacts',
  params: ctx.chain(debouncedQuery) ? { q: ctx.chain(debouncedQuery) } : {},
}));
// contacts.status(), contacts.error(), contacts.isLoading(), contacts.reload()
```

- Status, Fehler und „Erneut versuchen“ (`reload()`) liefert die Resource. Kein
  `catchError`, kein „Strom darf nicht sterben“.
- Parameter ändern sich → alter Request wird abgebrochen (eingebautes `switchMap`).
- Schreiben bleibt imperativ mit `Result`. Die Liste wird danach mit `resource.set()`
  lokal aktualisiert (Status `local`), bei 404/409 mit `reload()` neu geholt.

### Stolperfallen der Resource API

1. **`value()` wirft im Status `error`.** Ein Template, das einfach `value()` liest,
   stürzt ab. Immer erst `hasValue()` prüfen.
2. **Neue Parameter → `value()` ist während des Ladens `undefined`.** Die Liste würde bei
   jedem Tastendruck verschwinden (bei `reload()` bleibt der Wert dagegen stehen).
3. **Den letzten Wert nicht lazy merken.** Ein `linkedSignal` oder `computed` sieht einen
   Zwischenstand nur, wenn ihn jemand liest. Im Template klappt das zufällig, im
   Store-Test nicht. Der Store hält den letzten Wert daher mit einem `effect` fest.
   Aus demselben Grund nutzt er nicht `withPreviousValueOnLoading()` aus
   `@ngrx/signals/resource` (22.0.1): ein `computed`, das den Wert zuerst beim Laden
   liest, bekommt dort keine Abhängigkeit und rechnet nie neu.
4. `error()` ist `unknown`. Dank Interceptor ist es ein `AppError`, der Store ruft
   trotzdem `toAppError`, damit er auch ohne Interceptor funktioniert (siehe Store-Test).

## Wann welche Variante?

- **Resource API**, wenn Daten von Parametern (Route, Suche, Filter) abhängen und
  einfach nur „das Aktuelle“ angezeigt werden soll. Weniger Code, weniger Fehlerquellen.
- **rxMethod**, wenn der Datenfluss selbst Logik hat: Polling, WebSockets, mehrere
  Requests kombinieren, feines Timing, oder in Codebasen mit viel bestehendem RxJS.
- Die Fehlerstrategie oben ist in **beiden** Fällen gleich. Das ist der eigentliche Punkt.

## Tests

| Datei | Was sie zeigt |
|---|---|
| `core/error/app-error.spec.ts` | reine Funktion, Status-Tabelle mit `it.each` |
| `core/error/http-error.interceptor.spec.ts` | Retry, Backoff und Timeout mit Fake Timers, POST ohne Retry |
| `core/error/global-error-handler.spec.ts` | loggt, meldet, wirft nie |
| `core/error/navigation-error-handler.spec.ts` | `RouterTestingHarness`, Resolver wirft → Fehlerseite |
| `data-access/contact-store.spec.ts` | Variante A: Fehlerzustand, stale-while-error, Result, Rollback + Toast |
| `data-access/contact-resource-store.spec.ts` | Variante B: echte API + `HttpTestingController`, `TestBed.tick()` |
| `pages/contacts-page.spec.ts` | alle Anzeige-Zustände mit gefaktem Store |
| `ui/error-state.browser.spec.ts` | `role="alert"`, Retry nur wenn sinnvoll, Tastatur |
| `ui/contact-form.browser.spec.ts` | 422 am Feld mit `toHaveAccessibleDescription`, 500 am Formular |
| `pages/contacts-page.browser.spec.ts` | Variante A integriert, Toast über Host-Komponente |
| `pages/contacts-resource-page.browser.spec.ts` | Variante B: ganze Kette inkl. Interceptor und Mock-Backend |
