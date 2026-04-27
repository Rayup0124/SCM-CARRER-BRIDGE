const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Interviewing', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
    note: { type: String, default: '' },
    attachments: {
      type: [
        {
          type: { type: String, required: true },
          url: { type: String, required: true },
          filename: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Application', applicationSchema);

