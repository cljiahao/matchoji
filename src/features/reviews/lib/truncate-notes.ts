const TRAILING_PUNCTUATION = new Set([' ', ',', '.', ';', ':', '!', '?', '-']);

// Cut at the last space within the limit so a word is never split mid-way, unless the
// first word alone exceeds it.
export function truncateNotes(notes: string, limit: number): { text: string; truncated: boolean } {
  if (notes.length <= limit) return { text: notes, truncated: false };

  const slice = notes.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  let end = lastSpace > 0 ? lastSpace : slice.length;
  while (end > 0 && TRAILING_PUNCTUATION.has(slice[end - 1])) end--;
  return { text: `${slice.slice(0, end)}…`, truncated: true };
}
