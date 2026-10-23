const normalize = (grade: string) => grade.trim().toLowerCase();

// Grade is typed by whoever added the tea, so "Ceremonial" and "ceremonial " are one option.
// The first spelling seen is the one shown. Filtering by grade happens in SQL on the same
// normalised key (catalogue_teas.grade_key).
export function gradeOptions(rows: { grade: string | null }[]): string[] {
  const byKey = new Map<string, string>();
  for (const { grade } of rows) {
    if (grade?.trim() && !byKey.has(normalize(grade))) byKey.set(normalize(grade), grade.trim());
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}
