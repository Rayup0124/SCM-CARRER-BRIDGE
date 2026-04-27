/**
 * Official SCM programme strings can differ slightly between student profile,
 * company forms, and older data (e.g. (Hons) vs (Honours)). Match by canonical group.
 */
const PROGRAMME_GROUPS: string[][] = [
  ['Bachelor of Computer Science (Hons)'],
  [
    'Bachelor of Arts in Industrial Design (Honours)',
    'Bachelor of Arts in Industrial Design (Hons)',
  ],
  [
    'Bachelor of Arts (Hons.) in Creative Digital Media',
    'Bachelor of Arts (Hons) in Creative Digital Media',
  ],
  [
    'Bachelor of Mobile Game Development (Honours)',
    'Bachelor of Mobile Game Development (Hons)',
  ],
];

/** First string in each group is the canonical display form */
export function canonicalProgrammeLabel(input: string): string | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  for (const group of PROGRAMME_GROUPS) {
    if (group.some((g) => g.toLowerCase() === t)) {
      return group[0];
    }
  }
  return null;
}

/** True if this internship should count when filtering by the student's programme */
export function internshipMatchesStudentProgramme(
  studentProgramme: string,
  targetedProgrammes: string[] | undefined,
): boolean {
  const sp = studentProgramme.trim();
  if (!sp) return false;

  if (!targetedProgrammes || targetedProgrammes.length === 0) {
    return true;
  }

  const studentCanon = canonicalProgrammeLabel(sp);
  if (studentCanon) {
    return targetedProgrammes.some((t) => canonicalProgrammeLabel(t) === studentCanon);
  }

  return targetedProgrammes.some((t) => t.trim().toLowerCase() === sp.toLowerCase());
}

/** Dedupe legacy / typo programme strings to the official label list (for forms & display). */
export function normalizeTargetedProgrammes(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const c = canonicalProgrammeLabel(item);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}
