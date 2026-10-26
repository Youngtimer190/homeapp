// Unikalny identyfikator wpisu (string) — sufiks losowy chroni przed
// kolizją, gdy kilka pozycji jest dodawanych w tej samej milisekundzie.
export function newId(): string {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`;
}
