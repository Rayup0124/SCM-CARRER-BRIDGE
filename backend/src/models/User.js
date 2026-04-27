const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    programme: { type: String, required: true },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String, default: '' },
    resumeUrls: { type: [String], default: [] },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);

