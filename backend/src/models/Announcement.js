const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: String, default: 'SCM Admin' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
