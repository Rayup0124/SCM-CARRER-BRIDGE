const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    duration: { type: String },
    skills: { type: [String], default: [] },
    targetedProgrammes: { type: [String], default: [] },
    supervisorName: { type: String },
    meetingCadence: { type: String },
    deliverableCheckpoints: { type: String },
    status: { type: String, default: 'Open' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isPublished: { type: Boolean, default: true },
    isDraft: { type: Boolean, default: false },
    requiredAttachments: {
      type: [String],
      default: [],
      description: 'List of attachment types the company requires from applicants (e.g. "Resume", "Portfolio", "Transcript")',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Internship', internshipSchema);

