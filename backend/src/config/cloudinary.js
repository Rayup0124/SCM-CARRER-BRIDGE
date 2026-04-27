const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeCloudinaryStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: 'auto',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif'],
    },
  });

const storageMap = {
  resumes: makeCloudinaryStorage('scm-career-bridge/resumes'),
  'company-docs': makeCloudinaryStorage('scm-career-bridge/company-docs'),
  announcements: makeCloudinaryStorage('scm-career-bridge/announcements'),
  'application-attachments': makeCloudinaryStorage('scm-career-bridge/application-attachments'),
};

module.exports = { cloudinary, storageMap };
