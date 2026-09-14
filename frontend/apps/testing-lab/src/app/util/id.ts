/**
 * Erzeugt eine zufällige Id.
 *
 * Zufall ist der Feind reproduzierbarer Tests. Deshalb liegt der Aufruf in
 * einem eigenen Modul: Tests können das ganze Modul mit `vi.mock()` durch eine
 * deterministische Version ersetzen (siehe task-service.spec.ts).
 */
export function generateId(): string {
  return crypto.randomUUID();
}
