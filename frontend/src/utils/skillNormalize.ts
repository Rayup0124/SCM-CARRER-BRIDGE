/**
 * Same rules as backend/src/utils/skillNormalize.js — keep alias keys in sync.
 *
 * Custom "Other" skills from HR are merged when they normalize to the same label
 * (case, spacing, dots — e.g. next.js / Next.Js / next js → Next.js via fuzzy key).
 */
const SKILL_ALIASES: Record<string, string> = {
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  react: 'React',
  'react.js': 'React',
  reactjs: 'React',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  /** SQL vs general Database are distinct */
  sql: 'SQL',
  database: 'Database',
  databases: 'Database',
  'sql & databases': 'SQL & Databases',
  'sql and databases': 'SQL & Databases',
  'sql and database': 'SQL & Databases',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  git: 'Git',
  github: 'GitHub',
  'ui/ux': 'UI/UX',
  uiux: 'UI/UX',
  ux: 'UI/UX',
  'project management': 'Project Management',
  'data analysis': 'Data Analysis',
  'machine learning': 'Machine Learning',
  ml: 'Machine Learning',
  communication: 'Communication',
  word: 'Word',
  'ms word': 'Word',
  'microsoft word': 'Word',
  excel: 'Excel',
  'ms excel': 'Excel',
  'microsoft excel': 'Excel',
  filming: 'Filming',
  editing: 'Editing',
  hardware: 'Hardware',
  hw: 'Hardware',
  software: 'Software',
  sw: 'Software',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  'next js': 'Next.js',
  next_js: 'Next.js',
};

/**
 * Collapse separators so "next.js", "next js", "nextjs" share one fuzzy key.
 * Only used to look up FUZZY_TO_CANONICAL — not applied to arbitrary phrases
 * (avoids merging unrelated skills).
 */
function fuzzySkillKey(lower: string): string {
  return lower.replace(/\s+/g, '').replace(/[._\-/]+/g, '');
}

/** Tech/framework names where HR typing varies (Other field); extend as needed. */
const FUZZY_TO_CANONICAL: Record<string, string> = {
  nextjs: 'Next.js',
  vuejs: 'Vue.js',
  nuxtjs: 'Nuxt',
  nuxt: 'Nuxt',
  sveltejs: 'Svelte',
  svelte: 'Svelte',
  angularjs: 'AngularJS',
  angular: 'Angular',
};

/** Canonical display string for a skill tag (merges case / common aliases). */
export function normalizeSkillLabel(raw: string): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const lower = t.toLowerCase().replace(/\s+/g, ' ');
  if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower];
  const fk = fuzzySkillKey(lower);
  if (FUZZY_TO_CANONICAL[fk]) return FUZZY_TO_CANONICAL[fk];
  return t
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Lowercase key for comparing profile vs market demand. */
export function skillCanonicalKey(raw: string): string {
  return normalizeSkillLabel(raw).toLowerCase();
}

/** Dedupe skills after normalizing (same rules as backend). */
export function normalizeSkillsArray(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const label = normalizeSkillLabel(s);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
