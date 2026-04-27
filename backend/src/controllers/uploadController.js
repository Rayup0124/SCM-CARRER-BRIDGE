const multer = require('multer');
const User = require('../models/User');
const Company = require('../models/Company');
const { cloudinary, storageMap } = require('../config/cloudinary');

const ALLOWED_RESUME_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_COMPANY_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_ANNOUNCEMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_SIZE = 5 * 1024 * 1024;

const makeFileFilter = (allowedMimes, errorMessage) => (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(errorMessage), false);
  }
};

const uploadResume = multer({
  storage: storageMap.resumes,
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: makeFileFilter(
    ALLOWED_RESUME_MIME,
    'Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed for resumes',
  ),
});

const uploadCompanyDoc = multer({
  storage: storageMap['company-docs'],
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: makeFileFilter(
    ALLOWED_COMPANY_MIME,
    'Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed',
  ),
});

const uploadAnnouncement = multer({
  storage: storageMap.announcements,
  limits: { fileSize: MAX_SIZE, files: 5 },
  fileFilter: makeFileFilter(
    ALLOWED_ANNOUNCEMENT_MIME,
    'Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed',
  ),
});

const uploadApplicationAttachment = multer({
  storage: storageMap['application-attachments'],
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: makeFileFilter(
    ALLOWED_RESUME_MIME,
    'Only PDF or image files (JPEG, PNG, WebP, GIF) are allowed',
  ),
});

const handleMulterError = (err, _req, res) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  return null;
};

/**
 * Parse public_id from a Cloudinary URL.
 * URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
 * public_id includes the folder path (e.g. "scm-career-bridge/resumes/filename")
 */
const parseCloudinaryPublicId = (url) => {
  if (typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

/** Detect whether a URL is a Cloudinary URL or legacy local URL */
const isCloudinaryUrl = (url) => {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
};

/** Delete a file from Cloudinary given its full URL */
const deleteCloudinaryFile = (url) => {
  const publicId = parseCloudinaryPublicId(url);
  if (publicId) {
    cloudinary.uploader.destroy(publicId, { resource_type: 'auto' }, () => {});
  }
};

const uploadStudentResume = async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrls = req.files.map((f) => f.path);

  try {
    const user = await User.findById(req.authContext.id);
    if (!user) {
      req.files.forEach((f) => deleteCloudinaryFile(f.path));
      return res.status(404).json({ message: 'User not found' });
    }

    let existing = Array.isArray(user.resumeUrls) && user.resumeUrls.length > 0 ? [...user.resumeUrls] : [];
    if (!existing.length && user.resumeUrl) {
      existing = [user.resumeUrl];
    }

    if (existing.length + fileUrls.length > 10) {
      req.files.forEach((f) => deleteCloudinaryFile(f.path));
      return res.status(400).json({ message: 'Maximum 10 resume files allowed.' });
    }

    user.resumeUrls = [...existing, ...fileUrls];
    user.resumeUrl = user.resumeUrls[0] || '';
    await user.save();

    const safe = await User.findById(req.authContext.id).select('-password');
    const urls = Array.isArray(safe.resumeUrls) ? safe.resumeUrls : [];

    return res.json({
      message: 'Resume(s) uploaded successfully',
      resumeUrls: urls,
      resumeUrl: safe.resumeUrl || urls[0] || '',
      user: safe,
    });
  } catch (err) {
    req.files.forEach((f) => deleteCloudinaryFile(f.path));
    return res.status(500).json({ message: 'Failed to save resume record', details: err.message });
  }
};

const uploadCompanyDocument = async (req, res) => {
  const error = handleMulterError(req.fileValidationError, req);
  if (error) return;

  if (!req.files?.length) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrls = req.files.map((f) => f.path);

  try {
    const company = await Company.findByIdAndUpdate(
      req.authContext.id,
      { $push: { documentUrls: { $each: fileUrls } } },
      { new: true, runValidators: true },
    ).select('-password');

    if (!company) {
      req.files.forEach((f) => deleteCloudinaryFile(f.path));
      return res.status(404).json({ message: 'Company not found' });
    }

    return res.json({
      message: 'Documents uploaded successfully',
      documentUrls: company.documentUrls,
      company,
    });
  } catch (err) {
    req.files.forEach((f) => deleteCloudinaryFile(f.path));
    return res.status(500).json({ message: 'Failed to save document record', details: err.message });
  }
};

const deleteStudentResume = async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!url) {
    return res.status(400).json({ message: 'Missing resume URL' });
  }

  try {
    const user = await User.findById(req.authContext.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let urls = Array.isArray(user.resumeUrls) && user.resumeUrls.length > 0 ? [...user.resumeUrls] : [];
    if (!urls.length && user.resumeUrl) {
      urls = [user.resumeUrl];
    }

    const idx = urls.indexOf(url);
    if (idx === -1) {
      return res.status(404).json({ message: 'That file is not in your resume list' });
    }

    urls.splice(idx, 1);
    user.resumeUrls = urls;
    user.resumeUrl = urls[0] || '';
    await user.save();

    if (isCloudinaryUrl(url)) {
      deleteCloudinaryFile(url);
    }

    const safe = await User.findById(req.authContext.id).select('-password');
    const outUrls = Array.isArray(safe.resumeUrls) ? safe.resumeUrls : [];

    return res.json({
      message: 'Resume removed',
      resumeUrls: outUrls,
      resumeUrl: safe.resumeUrl || outUrls[0] || '',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove resume', details: err.message });
  }
};

const uploadApplicationAttachmentHandler = async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { applicationId, attachmentType } = req.body;
  if (!applicationId) {
    req.files.forEach((f) => deleteCloudinaryFile(f.path));
    return res.status(400).json({ message: 'applicationId is required' });
  }
  if (!attachmentType) {
    req.files.forEach((f) => deleteCloudinaryFile(f.path));
    return res.status(400).json({ message: 'attachmentType is required' });
  }

  try {
    const Application = require('../models/Application');
    const application = await Application.findById(applicationId);
    if (!application) {
      req.files.forEach((f) => deleteCloudinaryFile(f.path));
      return res.status(404).json({ message: 'Application not found' });
    }

    const studentId = req.authContext.id;
    if (!studentId || String(application.student) !== String(studentId)) {
      req.files.forEach((f) => deleteCloudinaryFile(f.path));
      return res.status(403).json({ message: 'Only the applicant can upload attachments for this application' });
    }

    const fileUrls = req.files.map((f) => ({
      type: attachmentType,
      url: f.path,
      filename: f.originalname,
      uploadedAt: new Date(),
    }));

    application.attachments = [...(application.attachments || []), ...fileUrls];
    await application.save();

    return res.json({
      message: 'Attachment uploaded successfully',
      attachments: application.attachments,
    });
  } catch (err) {
    req.files.forEach((f) => deleteCloudinaryFile(f.path));
    return res.status(500).json({ message: 'Failed to save attachment', details: err.message });
  }
};

const deleteApplicationAttachment = async (req, res) => {
  const { applicationId, url } = req.body;
  if (!applicationId || !url) {
    return res.status(400).json({ message: 'applicationId and url are required' });
  }

  try {
    const Application = require('../models/Application');
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const studentId = req.authContext.id;
    if (!studentId || String(application.student) !== String(studentId)) {
      return res.status(403).json({ message: 'Only the applicant can delete attachments' });
    }

    application.attachments = (application.attachments || []).filter((a) => a.url !== url);
    await application.save();

    if (isCloudinaryUrl(url)) {
      deleteCloudinaryFile(url);
    }

    return res.json({ message: 'Attachment deleted', attachments: application.attachments });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete attachment', details: err.message });
  }
};

module.exports = {
  uploadResume,
  uploadCompanyDoc,
  uploadAnnouncement,
  uploadApplicationAttachment,
  uploadApplicationAttachmentHandler,
  uploadStudentResume,
  uploadCompanyDocument,
  deleteStudentResume,
  deleteApplicationAttachment,
};
