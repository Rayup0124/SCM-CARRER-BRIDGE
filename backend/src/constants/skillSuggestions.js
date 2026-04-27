/**
 * Must match frontend/src/constants/profileOptions.ts COMMON_SKILL_SUGGESTIONS.
 * Used to exclude fixed chips from SkillStats (only "Other" / custom skills count toward popular).
 */
const FIXED_SKILL_SUGGESTIONS = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'SQL',
  'Database',
  'Git',
  'UI/UX',
  'Project Management',
  'Data Analysis',
  'Machine Learning',
  'Communication',
];

module.exports = { FIXED_SKILL_SUGGESTIONS };
