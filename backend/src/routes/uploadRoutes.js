const express = require('express');
const multer = require('multer');
const {
  uploadResume,
  uploadCompanyDoc,
  uploadStudentResume,
  uploadCompanyDocument,
  deleteStudentResume,
  uploadApplicationAttachment,
  uploadApplicationAttachmentHandler,
  deleteApplicationAttachment,
} = require('../controllers/uploadController');
const authorize = require('../middleware/auth');

const router = express.Router();

const uploadStudentResumeMiddleware = (req, res, next) => {
  uploadResume.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Each file must be smaller than 5MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Maximum 10 files allowed per upload.' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

router.post(
  '/resume',
  authorize('student'),
  uploadStudentResumeMiddleware,
  uploadStudentResume,
);

router.delete('/resume', authorize('student'), deleteStudentResume);

router.post(
  '/application-attachment',
  authorize('student'),
  uploadApplicationAttachment.array('files', 10),
  uploadApplicationAttachmentHandler,
);

router.delete('/application-attachment', authorize('student'), deleteApplicationAttachment);

router.post(
  '/company-document',
  authorize('company'),
  uploadCompanyDoc.array('documents', 10),
  uploadCompanyDocument,
);

module.exports = router;
