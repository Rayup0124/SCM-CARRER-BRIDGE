/**
 * SCM undergraduate programmes (official list). Source: faculty site — Undergraduate Programme.
 */
const ALLOWED_PROGRAMMES = [
  'Bachelor of Computer Science (Hons)',
  'Bachelor of Arts in Industrial Design (Honours)',
  'Bachelor of Arts (Hons.) in Creative Digital Media',
  'Bachelor of Mobile Game Development (Honours)',
];

/** Legacy / alternate spellings map to ALLOWED_PROGRAMMES[canonical] (first in each group). */
const PROGRAMME_EQUIVALENCE_GROUPS = [
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

function canonicalProgrammeLabel(input) {
  const t = String(input || '')
    .trim()
    .toLowerCase();
  if (!t) return null;
  for (const group of PROGRAMME_EQUIVALENCE_GROUPS) {
    if (group.some((g) => g.toLowerCase() === t)) {
      return group[0];
    }
  }
  const exact = ALLOWED_PROGRAMMES.find((p) => p.toLowerCase() === t);
  return exact || null;
}

function normalizeTargetedProgrammes(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const c = canonicalProgrammeLabel(item);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

module.exports = { ALLOWED_PROGRAMMES, normalizeTargetedProgrammes, canonicalProgrammeLabel };
