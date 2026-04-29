const multer = require('multer');

const ALLOWED_COMPANY_REGISTER_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_SIZE = 5 * 1024 * 1024;

const registerCompanyDocUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_COMPANY_REGISTER_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed.'), false);
    }
  },
});

module.exports = { registerCompanyDocUpload };
