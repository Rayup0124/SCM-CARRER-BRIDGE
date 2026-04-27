const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    hrEmail: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    documentUrls: { type: [String], default: [] },
    verificationStatus: {
      type: String,
      enum: ['pending_review', 'pending_documents', 'approved', 'rejected'],
      default: 'pending_review',
    },
    adminRequestMessage: { type: String, default: '' },
  },
  { timestamps: true },
);

companySchema.virtual('status').get(function () {
  if (this.verificationStatus === 'approved') return 'Approved';
  return 'Pending';
});
companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);
