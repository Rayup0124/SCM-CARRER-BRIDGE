const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = {
  resumes: 'resumes',
  'company-docs': 'company-docs',
  announcements: 'announcements',
  'application-attachments': 'application-attachments',
};

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const validateFile = (buffer, mimetype) => {
  if (!ALLOWED_MIME.includes(mimetype)) {
    throw new Error(`File type ${mimetype} is not allowed. Only PDF and images (JPEG, PNG, WebP, GIF) are accepted.`);
  }
  if (buffer.length > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
};

const getStorageBucket = (type) => {
  const bucket = BUCKETS[type];
  if (!bucket) throw new Error(`Unknown storage type: ${type}`);
  return bucket;
};

const uploadFile = async (bucketType, folder, file) => {
  validateFile(file.buffer, file.mimetype);

  const bucket = getStorageBucket(bucketType);
  const sanitized = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  const safeName = sanitized;
  const filePath = `${folder}/${safeName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  console.log('[supabaseStorage] upload result — bucket:', bucket, 'path:', filePath, 'data:', JSON.stringify(data), 'error:', JSON.stringify(error));

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return urlData.publicUrl;
};

const deleteFile = async (bucketType, fileUrl) => {
  try {
    const { path } = parsePublicUrl(fileUrl, bucketType);
    if (!path) return;

    await supabaseAdmin.storage.from(getStorageBucket(bucketType)).remove([path]);
  } catch (e) {
    console.error('Failed to delete file from Supabase Storage:', e.message);
  }
};

const deleteFileFromUrl = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  try {
    // Handle Supabase Storage public URLs:
    // https://xxx.supabase.co/storage/v1/object/public/bucket/folder/file.pdf
    const withoutQuery = fileUrl.split('?')[0];
    const match = withoutQuery.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const path = match[2];
      await supabaseAdmin.storage.from(bucket).remove([path]);
      return;
    }

    // Handle relative paths: /storage/v1/object/public/bucket/folder/file.pdf
    const relMatch = withoutQuery.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (relMatch) {
      const bucket = relMatch[1];
      const path = relMatch[2];
      await supabaseAdmin.storage.from(bucket).remove([path]);
    }
  } catch (e) {
    console.error('Failed to delete file from Supabase Storage:', e.message);
  }
};

const parsePublicUrl = (url, bucketType) => {
  if (!url || typeof url !== 'string') return { bucket: null, path: null };

  const bucket = getStorageBucket(bucketType);
  const withoutQuery = url.split('?')[0];
  const regex = new RegExp(`${bucket}/(.+)$`);
  const match = withoutQuery.match(regex);
  if (match) {
    return { bucket, path: match[1] };
  }
  return { bucket: null, path: null };
};

module.exports = {
  supabaseAdmin,
  BUCKETS,
  ALLOWED_MIME,
  MAX_SIZE,
  validateFile,
  getStorageBucket,
  uploadFile,
  deleteFile,
  deleteFileFromUrl,
  parsePublicUrl,
};
