const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const generateToken = require('../utils/generateToken');
const { ALLOWED_PROGRAMMES } = require('../constants/programmes');
const {
  STUDENT_EMAIL_DOMAIN,
  isValidStudentEmailDomain,
  studentIdMatchesProgramme,
} = require('../constants/studentRegistration');

const registerStudent = async (req, res) => {
  try {
    let { name, email, password, studentId, programme, skills = [] } = req.body;

    name = typeof name === 'string' ? name.trim() : '';
    email = typeof email === 'string' ? email.trim() : '';
    studentId = typeof studentId === 'string' ? studentId.trim() : '';
    programme = typeof programme === 'string' ? programme.trim() : '';

    if (!name || !email || !password || !studentId || !programme) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!ALLOWED_PROGRAMMES.includes(programme)) {
      return res.status(400).json({ message: 'Invalid programme selected' });
    }

    if (!isValidStudentEmailDomain(email)) {
      return res.status(400).json({
        message: `Student email must use @${STUDENT_EMAIL_DOMAIN}`,
      });
    }

    if (!studentIdMatchesProgramme(studentId, programme)) {
      return res.status(400).json({
        message:
          'Student ID does not match the selected programme. Check the required prefix (e.g. BCS for Computer Science, BID for Industrial Design, BDM for Creative Digital Media, BMD for Mobile Game Development).',
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existing) {
      return res.status(409).json({ message: 'Email or studentId already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      studentId,
      programme,
      skills,
    });

    const token = generateToken({ id: user._id, role: user.role, accountType: 'user' });
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to register student', details: error.message });
  }
};

const registerCompany = async (req, res) => {
  try {
    const { companyName, hrEmail, password, description = '' } = req.body;

    const existing = await Company.findOne({ hrEmail });
    if (existing) {
      if (existing.verificationStatus === 'pending_review') {
        if (!req.files?.length) {
          return res.status(400).json({ message: 'Please upload your verification documents' });
        }

        const { uploadFile, deleteFile } = require('../utils/supabaseStorage');
        const uploaded = [];
        try {
          for (const f of req.files) {
            const url = await uploadFile('company-docs', 'company-documents', f);
            uploaded.push(url);
          }
          existing.documentUrls = uploaded;
        } catch (err) {
          uploaded.forEach((url) => deleteFile('company-docs', url));
          return res.status(400).json({ message: err.message });
        }
        existing.adminRequestMessage = '';
        await existing.save();
        return res.json({ message: 'Documents updated. Await admin approval.' });
      }
      return res.status(409).json({ message: 'Company email already exists' });
    }

    if (!companyName || !hrEmail || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const documentUrls = [];
    if (req.files?.length) {
      const { uploadFile, deleteFile } = require('../utils/supabaseStorage');
      try {
        for (const f of req.files) {
          const url = await uploadFile('company-docs', 'company-documents', f);
          documentUrls.push(url);
        }
      } catch (err) {
        documentUrls.forEach((url) => deleteFile('company-docs', url));
        return res.status(400).json({ message: err.message });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const company = await Company.create({
      companyName,
      hrEmail,
      password: hashed,
      description,
      documentUrls,
      verificationStatus: 'pending_review',
    });

    return res.status(201).json({
      message: 'Company registered. Await admin approval.',
      company: { id: company._id, companyName: company.companyName, status: company.status },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to register company', details: error.message });
  }
};

const requestReactivation = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const company = await Company.findOne({ hrEmail: email.toLowerCase().trim() });
    if (!company) {
      return res.status(404).json({ message: 'No company found with that email' });
    }

    if (company.verificationStatus !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected companies can request reactivation' });
    }

    company.verificationStatus = 'pending_review';
    company.documentUrls = [];
    company.adminRequestMessage = '';
    await company.save();

    return res.json({
      message: 'Reactivation requested. Please upload your documents again.',
      company: {
        companyName: company.companyName,
        hrEmail: company.hrEmail,
        description: company.description || '',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to process reactivation request', details: error.message });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = typeof email === 'string' ? email.trim() : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const user = await User.findOne({ email });
    if (user) {
      if (user.role === 'student' && !isValidStudentEmailDomain(email)) {
        return res.status(400).json({
          message: `Student login requires an email ending with @${STUDENT_EMAIL_DOMAIN}`,
        });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({
          message: 'Invalid email or password',
          reason: 'password_mismatch',
        });
      }
      const token = generateToken({ id: user._id, role: user.role, accountType: 'user' });
      return res.json({
        token,
        role: user.role,
        profile: { id: user._id, name: user.name, email: user.email, studentId: user.studentId, programme: user.programme },
      });
    }

    const company = await Company.findOne({ hrEmail: email });
    if (company) {
      const valid = await bcrypt.compare(password, company.password);
      if (!valid) {
        return res.status(401).json({
          message: 'Invalid email or password',
          reason: 'password_mismatch',
        });
      }

      if (company.verificationStatus === 'rejected') {
        return res.status(403).json({
          message: 'Your company account has been rejected. Please contact the administrator for more information.',
          reason: 'company_rejected',
        });
      }

      const token = generateToken({
        id: company._id,
        role: 'company',
        accountType: 'company',
        verificationStatus: company.verificationStatus,
      });

      return res.json({
        token,
        role: 'company',
        verificationStatus: company.verificationStatus,
        adminRequestMessage: company.adminRequestMessage || '',
        profile: {
          id: company._id,
          companyName: company.companyName,
          hrEmail: company.hrEmail,
          description: company.description || '',
          website: company.website || '',
          documentUrls: company.documentUrls,
        },
      });
    }

    return res.status(401).json({
      message: 'No account found with that email. Please check your email or register first.',
      reason: 'account_not_found',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to login', details: error.message });
  }
};

module.exports = {
  registerStudent,
  registerCompany,
  login,
  requestReactivation,
};
