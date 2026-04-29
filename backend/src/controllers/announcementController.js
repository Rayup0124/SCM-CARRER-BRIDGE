const Announcement = require('../models/Announcement');
const { uploadFile, deleteFile } = require('../utils/supabaseStorage');

const getAnnouncements = async (_req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    return res.json(announcements);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch announcements', details: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, postedBy } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let attachments = [];
    if (req.files?.length) {
      const uploaded = [];
      try {
        for (const f of req.files) {
          const url = await uploadFile('announcements', 'announcements', f);
          uploaded.push(url);
        }
        attachments = uploaded;
      } catch (err) {
        uploaded.forEach((url) => deleteFile('announcements', url));
        return res.status(400).json({ message: err.message });
      }
    } else if (req.body.attachments) {
      attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [req.body.attachments];
    }

    const announcement = await Announcement.create({ title, content, postedBy, attachments });
    return res.status(201).json(announcement.toObject());
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create announcement', details: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (Array.isArray(announcement.attachments)) {
      announcement.attachments.forEach((url) => deleteFile('announcements', url));
    }

    await Announcement.findByIdAndDelete(id);
    return res.json({ message: 'Announcement deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete announcement', details: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const { title, content, postedBy } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    announcement.title = title;
    announcement.content = content;
    if (postedBy !== undefined) announcement.postedBy = postedBy;

    // Append newly uploaded attachments
    if (req.files?.length) {
      const newUrls = [];
      try {
        for (const f of req.files) {
          const url = await uploadFile('announcements', 'announcements', f);
          newUrls.push(url);
        }
        announcement.attachments = [...(announcement.attachments || []), ...newUrls];
      } catch (err) {
        newUrls.forEach((url) => deleteFile('announcements', url));
        return res.status(400).json({ message: err.message });
      }
    }

    await announcement.save();
    return res.json(announcement.toObject());
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update announcement', details: error.message });
  }
};

const deleteAnnouncementAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'Missing attachment URL' });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.attachments = (announcement.attachments || []).filter((u) => u !== url);
    await announcement.save();
    deleteFile('announcements', url);

    return res.json({ message: 'Attachment removed', announcement: announcement.toObject() });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to remove attachment', details: error.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, deleteAnnouncementAttachment };
