/**
 * UTS (Universiti Teknologi Sarawak) SCM student registration rules.
 */
const STUDENT_EMAIL_DOMAIN = 'student.uts.edu.my';

/** Programme label → required Student ID prefix (case-insensitive), e.g. BCS23090015 */
const PROGRAMME_STUDENT_ID_PREFIX = {
  'Bachelor of Computer Science (Hons)': 'bcs',
  'Bachelor of Arts in Industrial Design (Honours)': 'bid',
  'Bachelor of Arts (Hons.) in Creative Digital Media': 'bdm',
  'Bachelor of Mobile Game Development (Honours)': 'bmd',
};

const isValidStudentEmailDomain = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return false;
  const domain = trimmed.slice(at + 1);
  return domain === STUDENT_EMAIL_DOMAIN;
};

const studentIdMatchesProgramme = (studentId, programme) => {
  const prefix = PROGRAMME_STUDENT_ID_PREFIX[programme];
  if (!prefix || typeof studentId !== 'string') return false;
  const id = studentId.trim();
  if (!id.length) return false;
  return id.toLowerCase().startsWith(prefix);
};

module.exports = {
  STUDENT_EMAIL_DOMAIN,
  PROGRAMME_STUDENT_ID_PREFIX,
  isValidStudentEmailDomain,
  studentIdMatchesProgramme,
};
