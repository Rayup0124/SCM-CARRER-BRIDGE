/** UTS SCM — must match backend `studentRegistration.js` */
export const STUDENT_EMAIL_DOMAIN = 'student.uts.edu.my';

export const PROGRAMME_STUDENT_ID_PREFIX: Record<string, string> = {
  'Bachelor of Computer Science (Hons)': 'bcs',
  'Bachelor of Arts in Industrial Design (Honours)': 'bid',
  'Bachelor of Arts (Hons.) in Creative Digital Media': 'bdm',
  'Bachelor of Mobile Game Development (Honours)': 'bmd',
};

export const isValidStudentEmailDomain = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return false;
  return trimmed.slice(at + 1) === STUDENT_EMAIL_DOMAIN;
};

export const studentIdMatchesProgramme = (studentId: string, programme: string): boolean => {
  const prefix = PROGRAMME_STUDENT_ID_PREFIX[programme];
  if (!prefix) return false;
  const id = studentId.trim();
  if (!id.length) return false;
  return id.toLowerCase().startsWith(prefix);
};
