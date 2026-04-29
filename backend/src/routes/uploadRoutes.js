const express = require('express');
const multer = require('multer');
const {
  uploadResume,
  uploadCompanyDoc,
  uploadStudentResume,
  uploadCompanyDocument,
  deleteStudentResume,
  deleteCompanyDocument,
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

router.delete('/company-document', authorize('company'), deleteCompanyDocument);

// GET /api/uploads/proxy?url=... — proxies Supabase Storage URLs to avoid CORS
router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url query parameter');
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('supabase')) {
      return res.status(400).send('Only Supabase URLs are allowed');
    }
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch file');
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.body.pipe(res);
  } catch {
    res.status(500).send('Proxy error');
  }
});

module.exports = router;
