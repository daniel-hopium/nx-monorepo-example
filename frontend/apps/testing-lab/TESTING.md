# Testing Lab: Testen in Angular mit Vitest

Diese App ist ein Lernprojekt. Die Website ist bewusst klein (Aufgabenliste
mit Formular, Filter und Statistik), damit der Fokus auf den Tests liegt.

Wie Fehler behandelt und getestet werden (AppError, Interceptor, Resource API
vs. rxMethod), erklärt [ERROR-HANDLING.md](ERROR-HANDLING.md).

```bash
pnpm start:lab                       # App auf http://localhost:4400
pnpm nx test testing-lab             # Unit- und Komponententests (jsdom, schnell)
pnpm nx test-browser testing-lab     # Browser-Tests in Chromium (Playwright)
pnpm test:lab                        # beides
```

## Die drei Stufen

| Stufe | Was | Läuft in | Dateien |
| --- | --- | --- | --- |
| 1 | Reine Funktionen, Pipes, Services | jsdom (Node) | `task.spec.ts`, `relative-time-pipe.spec.ts`, `notification-service.spec.ts`, `task-service.spec.ts` |
| 2 | Komponenten mit TestBed | jsdom | alle `ui/*.spec.ts` und `pages/*.spec.ts` ohne `.browser` |
| 3 | Komponenten mit echten Eingaben | Chromium | `*.browser.spec.ts` |

Faustregel: so tief wie möglich, so hoch wie nötig. Logik in reine
Funktionen ziehen (Stufe 1), Komponenten schlank halten (Stufe 2), Browser
nur für echte Interaktion, Fokus, CSS (Stufe 3).

## Komponentenarten im Überblick

Jede Art hat eine eigene Komponente unter `src/app/ui` und ist auf der Seite
**/komponenten** zu sehen. Die Spalten zeigen, welcher Test was lehrt.

| Art | Komponente | jsdom-Test lehrt | Browser-Test lehrt |
| --- | --- | --- | --- |
| Button | `button.ts` (Attribut-Selector) | Host-Komponente, Content Projection, `it.each` für Varianten, disabled und aria-busy | Enter und Leertaste klicken, Tab überspringt disabled, `toHaveFocus` |
| Alert | `alert.ts` | ARIA-Rollen alert vs. status, `output<void>` mit `vi.fn` im Host | `getByRole('alert')`, aria-hidden-Icon, Schließen entfernt aus dem DOM |
| Toast | `toasts.ts` | Service-Fake mit schreibbarem Signal, `mockReset`, aria-live | echter Service mit 50 ms Dauer, wartendes `not.toBeInTheDocument`, `position: fixed` |
| Select | `select.ts` | Two-Way-Binding in beide Richtungen, `value` setzen und `change` feuern, label for/id | `userEvent.selectOptions` per Wert und per Text, `getByLabelText` |
| Tabelle | `data-table.ts` (generisch) | Struktur-Helfer, Text- vs. Zahlensortierung, Klick-Zyklus, aria-sort, Leerzustand, `rowClick` | Rollen table/row/columnheader/cell, `nth()`, Sortieren per Tastatur |
| Dialog/Modal | `confirm-dialog.ts` | **keiner**: jsdom kennt `showModal()` nicht | Öffnen, Fokus im Dialog, `:modal`, Bestätigen, Abbrechen, Escape, `expect.poll` |
| Tabs | `tabs.ts` | `contentChildren`, aria-selected, roving tabindex, aria-controls | Pfeiltasten, Home/End, Wrap-around, Fokus |
| Formular | `task-form.ts` | – | Validierungsmeldung, touched per Tab, Enter sendet ab |
| Checkbox, Liste | `task-item.ts` | Inputs, Outputs, gemockte Clock, `By.css` | echtes CSS (line-through), Checkbox per Label |
| Badge | `priority-badge.ts` | erster, einfachster Komponententest | – |

**Wann jsdom, wann Browser?** jsdom für Struktur, Zustand und Klicks.
Browser für Fokus, Tastatur, echtes CSS und alles, was jsdom nicht
implementiert (Dialog, Layout, Scrollen).

## Anatomie eines Tests

```ts
describe('sortTasks', () => {              // Gruppe
  it('stellt offene nach vorne', () => {   // ein Fall, Name = Satz
    const tasks = [...];                   // Arrange
    const result = sortTasks(tasks);       // Act
    expect(result[0].done).toBe(false);    // Assert
  });
});
```

- `beforeEach` läuft vor jedem `it` und baut frischen Zustand auf. Tests
  dürfen sich nie gegenseitig beeinflussen.
- `it.each([...])` führt denselben Test mit mehreren Datensätzen aus.
- `expect(x).toBe(y)` prüft Identität (`===`), `toEqual` prüft strukturell,
  `toMatchObject` nur die genannten Felder, `toThrow` erwartet einen Fehler
  (die Funktion in einen Wrapper `() => fn()` packen).

## Mocken: welche Technik wann?

| Abhängigkeit kommt über | Technik | Beispiel |
| --- | --- | --- |
| Angular DI (`inject()`) | `{ provide: X, useValue: fake }` | `Clock` in fast jedem Test |
| ES-Modul-Import | `vi.mock('./modul', () => ({...}))` | `generateId` in `task-service.spec.ts` |
| Eine Methode beobachten | `vi.spyOn(obj, 'methode')` | `notify` in `task-service.spec.ts` |
| Callback / Output | `vi.fn()` | Outputs in `task-item.spec.ts` |
| HTTP | `provideHttpClientTesting()` + `HttpTestingController` | `task-service.spec.ts` |
| Zeit / Timer | `vi.useFakeTimers()`, `vi.setSystemTime()`, `vi.advanceTimersByTime()` | `notification-service.spec.ts` |
| Router | `provideRouter()` + `RouterTestingHarness` | `stats-page.spec.ts` |

Prinzipien:

- **Mocke die Ränder, nicht die Mitte.** HTTP, Zeit, Zufall und Browser-APIs
  sind unzuverlässig oder langsam, die eigene Logik nicht.
- **Ein Fake hat dieselbe Form.** Der Fake für `TaskService` hat Signale und
  Methoden mit denselben Namen, aber keine Logik (`task-list-page.spec.ts`).
- **`vi.mock` wird gehoistet.** Es wird an den Dateianfang verschoben, noch vor
  die Imports. Die Factory darf daher keine Variablen von außen verwenden.
- **Fake Timers immer zurücksetzen** (`afterEach(() => vi.useRealTimers())`),
  sonst bleibt die manipulierte Uhr für die nächsten Tests aktiv.

## Komponenten mit TestBed (Stufe 2)

```ts
await TestBed.configureTestingModule({ imports: [PriorityBadge], providers: [...] }).compileComponents();
const fixture = TestBed.createComponent(PriorityBadge);
fixture.componentRef.setInput('priority', 'hoch');   // input() setzen
await fixture.whenStable();                           // rendern
fixture.nativeElement.querySelector('.badge');        // DOM prüfen
fixture.componentInstance.toggled.subscribe(vi.fn()); // output() abhören
```

- `setInput` vor dem ersten `whenStable`, sonst fehlt ein `input.required()`.
- Events auslösen: `element.click()` oder `element.dispatchEvent(new Event('change'))`.
- Nach jeder Zustandsänderung erneut `await fixture.whenStable()`.
- Alternative zum Host: eine kleine Test-Komponente, die die Komponente wie
  im echten Template benutzt (siehe `task-item.browser.spec.ts`).

## Browser-Tests (Stufe 3)

```ts
import { page, userEvent } from 'vitest/browser';

await userEvent.fill(page.getByPlaceholder('Was ist zu tun?'), 'Text');
await userEvent.click(page.getByRole('button', { name: 'Hinzufügen' }));
await expect.element(page.getByRole('alert')).toHaveTextContent('Titel ist Pflicht');
```

- **Locators** beschreiben Elemente wie ein Nutzer sie sieht: Rolle, Label,
  Text, Platzhalter. Das ist robuster als CSS-Klassen und prüft nebenbei die
  Barrierefreiheit (ein Button ohne Namen ist auch für Screenreader unsichtbar).
- **`expect.element(...)` wartet.** Es prüft wiederholt, bis die Bedingung
  eintritt oder ein Timeout greift. Deshalb entfällt `whenStable()`.
- **`userEvent`** erzeugt echte Browser-Events mit Fokus, Tastatur und
  Formularverhalten. `{Tab}` und `{Enter}` gehen über `userEvent.keyboard`.
- `getComputedStyle` liefert echtes CSS, jsdom könnte das nicht.
- Dateien heißen `*.browser.spec.ts` und laufen über
  `vite.browser.config.mts`; die jsdom-Konfiguration schließt sie aus.

## Barrierefreiheit (a11y) testen

Die Dateien `*.a11y.browser.spec.ts` prüfen gezielt Barrierefreiheit. Sie
laufen im Browser, weil nur dort Fokus und Accessible Names echt berechnet werden.

| Datei | Prüft |
| --- | --- |
| `task-item.a11y.browser.spec.ts` | exakte Namen von Checkbox und Icon-Button, eindeutige Namen bei mehreren Zeilen, Tab-Reihenfolge, Leertaste, sichtbarer Fokusring |
| `task-form.a11y.browser.spec.ts` | Feldnamen aus Labels, `aria-invalid` erst nach dem Verlassen, Fehlermeldung als Accessible Description |
| `data-table.a11y.browser.spec.ts` | Tabellenname aus `<caption>`, Name des Sortier-Buttons, Zeilen-Aktion per Tab und Enter erreichbar |

Die zwei Leitfragen:

1. **Ist alles per Tastatur erreichbar und bedienbar?** Wirklich durchtabben
   (`userEvent.keyboard('{Tab}')`) und mit `toHaveFocus()` prüfen, wo der Fokus
   landet. Dann mit Enter oder Leertaste bedienen.
2. **Hat jedes Element den richtigen Namen?** `toHaveAccessibleName('…')` prüft
   den exakten Namen, den ein Screenreader vorliest.
   `getByRole('button', { name: 'Löschen' })` allein reicht nicht, weil es
   auch Teiltreffer wie „Löschen: Einkaufen“ findet.

| Matcher | Prüft |
| --- | --- |
| `toHaveAccessibleName('…')` | Name aus `aria-label`, `aria-labelledby`, `<label>` oder Text |
| `toHaveAccessibleDescription('…')` | Beschreibung aus `aria-describedby`, z. B. Fehlermeldungen |
| `toHaveFocus()` | Fokus liegt auf dem Element |
| `toHaveAttribute('aria-…', '…')` | ARIA-Zustände wie `aria-invalid`, `aria-sort`, `aria-selected` |

**Was die Tests gefunden haben.** Die a11y-Tests wurden zuerst geschrieben und
schlugen fünfmal fehl, bevor die Komponenten angepasst wurden:

- Tabellenzeilen waren nur per Maus klickbar. Lösung: der Input
  `rowActionLabel` rendert einen echten Button in der ersten Zelle.
- Der Sortier-Button hieß nur „Name“. Jetzt heißt er „Name sortieren“, die
  Richtung steht in `aria-sort`.
- Das Titelfeld zeigte Fehler nur visuell. Jetzt setzt es `aria-invalid` und
  verknüpft die Meldung per `aria-describedby`.

Vorgehen zum Merken: **a11y-Test schreiben, rot sehen, Komponente fixen, grün sehen.**

Nicht abgedeckt sind Farbkontraste und automatische Regelprüfungen. Dafür gibt
es `axe-core`, das eine ganze Seite gegen die WCAG-Regeln prüft. Es ergänzt
diese Tests, ersetzt sie aber nicht: axe erkennt einen fehlenden Namen, aber
nicht, ob „Löschen“ der richtige Name ist oder ob die Tab-Reihenfolge sinnvoll ist.

## Typische Fehler

- **"NG0950: Input is required"**: `setInput` fehlt oder kommt zu spät.
- **"Expected one matching request"**: Der Code hat einen anderen Pfad
  aufgerufen als `expectOne` erwartet, oder `load()` wurde nicht gestartet.
- **Test grün, obwohl nichts geprüft wird**: `expect` in einem `subscribe`
  oder nach einem fehlenden `await`. Immer `await` bei async und Fake-Funktionen
  mit `toHaveBeenCalled...` prüfen.
- **Tests beeinflussen sich**: Zustand in `beforeEach` neu aufbauen, Timer
  zurücksetzen, `TestBed` wird pro Test automatisch zurückgesetzt.
