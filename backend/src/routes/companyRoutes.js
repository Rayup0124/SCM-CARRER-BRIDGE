const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Company = require('../models/Company');
const authorize = require('../middleware/auth');

const router = express.Router();

const COMPANY_DOCS_DIR = path.join(__dirname, '..', 'uploads', 'company-docs');
const companyDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(COMPANY_DOCS_DIR)) fs.mkdirSync(COMPANY_DOCS_DIR, { recursive: true });
    cb(null, COMPANY_DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`);
  },
});
const uploadCompanyDocSubmit = multer({
  storage: companyDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// PUT /api/companies/profile — company updates its own profile
router.put('/profile', authorize('company'), async (req, res) => {
  try {
    const { companyName, description, website } = req.body;
    const companyId = req.currentCompany._id;

    const updateFields = {};
    if (companyName !== undefined) updateFields.companyName = companyName.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (website !== undefined) {
      updateFields.website = website.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    if (updateFields.companyName && !updateFields.companyName) {
      return res.status(400).json({ message: 'Company name cannot be empty' });
    }

    const updated = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({ message: 'Profile updated', company: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update profile', details: error.message });
  }
});

// GET /api/companies/profile — fetch own profile
router.get('/profile', authorize('company'), async (req, res) => {
  try {
    const company = await Company.findById(req.currentCompany._id).select('-password');
    return res.json(company);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile', details: error.message });
  }
});

// POST /api/companies/documents/submit — submit documents (from pending_documents state, goes back to pending_review)
router.post('/documents/submit', authorize('company'), uploadCompanyDocSubmit.array('documents', 10), async (req, res) => {
  try {
    const companyId = req.currentCompany._id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (company.verificationStatus !== 'pending_documents') {
      return res.status(400).json({ message: 'Document submission is not required at this stage' });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: 'Please upload at least one document' });
    }

    const newDocUrls = req.files.map((f) => f.path);
    company.documentUrls = [...(company.documentUrls || []), ...newDocUrls];
    company.verificationStatus = 'pending_review';
    company.adminRequestMessage = '';
    await company.save();

    return res.json({ message: 'Documents submitted for review', company: company });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to submit documents', details: error.message });
  }
});

module.exports = router;
