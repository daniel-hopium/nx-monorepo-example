# Testing Lab: Testen in Angular mit Vitest

Diese App ist ein Lernprojekt. Die Website ist bewusst klein (Aufgabenliste
mit Formular, Filter und Statistik), damit der Fokus auf den Tests liegt.

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
| 2 | Komponenten mit TestBed | jsdom | `priority-badge.spec.ts`, `task-item.spec.ts`, `task-list-page.spec.ts`, `stats-page.spec.ts` |
| 3 | Komponenten mit echten Eingaben | Chromium | `*.browser.spec.ts` |

Faustregel: so tief wie möglich, so hoch wie nötig. Logik in reine
Funktionen ziehen (Stufe 1), Komponenten schlank halten (Stufe 2), Browser
nur für echte Interaktion, Fokus, CSS (Stufe 3).

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

## Typische Fehler

- **"NG0950: Input is required"**: `setInput` fehlt oder kommt zu spät.
- **"Expected one matching request"**: Der Code hat einen anderen Pfad
  aufgerufen als `expectOne` erwartet, oder `load()` wurde nicht gestartet.
- **Test grün, obwohl nichts geprüft wird**: `expect` in einem `subscribe`
  oder nach einem fehlenden `await`. Immer `await` bei async und Fake-Funktionen
  mit `toHaveBeenCalled...` prüfen.
- **Tests beeinflussen sich**: Zustand in `beforeEach` neu aufbauen, Timer
  zurücksetzen, `TestBed` wird pro Test automatisch zurückgesetzt.
