const express = require('express');
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, deleteAnnouncementAttachment } = require('../controllers/announcementController');
const { uploadAnnouncement } = require('../controllers/uploadController');
const authorize = require('../middleware/auth');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', authorize('admin'), uploadAnnouncement.array('attachments', 5), createAnnouncement);
router.put('/:id', authorize('admin'), uploadAnnouncement.array('attachments', 5), updateAnnouncement);
router.delete('/:id', authorize('admin'), deleteAnnouncement);
router.delete('/:id/attachments', authorize('admin'), deleteAnnouncementAttachment);

module.exports = router;
