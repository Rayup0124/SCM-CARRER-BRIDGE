/**
 * Map lowercase input → canonical display label so "html", "HTML", "Html" count as one skill.
 * Custom "Other" skills: same fuzzy key merges variants (next.js / Next.Js / next js).
 * Keep in sync with frontend/src/utils/skillNormalize.ts
 */
const SKILL_ALIASES = {
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

function fuzzySkillKey(lower) {
  return lower.replace(/\s+/g, '').replace(/[._\-/]+/g, '');
}

const FUZZY_TO_CANONICAL = {
  nextjs: 'Next.js',
  vuejs: 'Vue.js',
  nuxtjs: 'Nuxt',
  nuxt: 'Nuxt',
  sveltejs: 'Svelte',
  svelte: 'Svelte',
  angularjs: 'AngularJS',
  angular: 'Angular',
};

function normalizeSkillLabel(raw) {
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

function normalizeSkillsArray(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
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

module.exports = { normalizeSkillLabel, normalizeSkillsArray, SKILL_ALIASES, FUZZY_TO_CANONICAL };
