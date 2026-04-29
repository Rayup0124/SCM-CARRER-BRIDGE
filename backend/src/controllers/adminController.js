const Company = require('../models/Company');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Announcement = require('../models/Announcement');
const { normalizeSkillLabel } = require('../utils/skillNormalize');
const { deleteFileFromUrl } = require('../utils/supabaseStorage');

const getPendingCompanies = async (_req, res) => {
  try {
    const pending = await Company.find({
      verificationStatus: { $in: ['pending_review', 'pending_documents'] },
    }).select('-password');
    return res.json(pending.map((c) => c.toObject()));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch companies', details: error.message });
  }
};

const getAllCompanies = async (_req, res) => {
  try {
    const companies = await Company.find().select('-password').sort({ createdAt: -1 });
    return res.json(companies.map((c) => c.toObject()));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch companies', details: error.message });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.verificationStatus = 'approved';
    company.adminRequestMessage = '';
    await company.save();

    return res.json({ message: 'Company approved', company: { id: company._id, companyName: company.companyName } });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to approve company', details: error.message });
  }
};

const deleteCompanyDocuments = async (documentUrls) => {
  if (!Array.isArray(documentUrls)) return;
  await Promise.all(documentUrls.map((url) => deleteFileFromUrl(url)));
};

const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await deleteCompanyDocuments(company.documentUrls);
    company.verificationStatus = 'rejected';
    company.adminRequestMessage = reason
      ? `Your company registration has been rejected. Reason: ${reason}`
      : 'Your company registration has been rejected. Please contact the administrator for more information.';
    await company.save();

    return res.json({ message: 'Company rejected' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reject company', details: error.message });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await deleteCompanyDocuments(company.documentUrls);

    const internshipIds = await Internship.find({ company: id }).select('_id');
    const ids = internshipIds.map((i) => i._id);

    await Application.deleteMany({ internship: { $in: ids } });
    await Internship.deleteMany({ company: id });
    await Company.findByIdAndDelete(id);

    return res.json({ message: 'Company and all related data deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete company', details: error.message });
  }
};

const requestDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.verificationStatus = 'pending_documents';
    company.adminRequestMessage = (message || '').trim();
    await company.save();

    return res.json({ message: 'Document request sent to company' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to request documents', details: error.message });
  }
};

const getStats = async (_req, res) => {
  try {
    const [totalStudents, totalCompanies, totalApproved, totalPending, totalInternships, totalApplications] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Company.countDocuments({ verificationStatus: 'approved' }),
      Company.countDocuments({ verificationStatus: { $in: ['pending_review', 'pending_documents'] } }),
      Internship.countDocuments(),
      Application.countDocuments(),
    ]);

    const applicationStats = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = {};
    applicationStats.forEach((s) => { byStatus[s._id] = s.count; });

    return res.json({
      totalStudents,
      totalCompanies,
      totalApproved,
      totalPending,
      totalInternships,
      totalApplications,
      applicationsByStatus: byStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch stats', details: error.message });
  }
};

const getSkillsStats = async (_req, res) => {
  try {
    const internships = await Internship.find({
      isPublished: true,
      status: 'Open',
    }).populate('company', 'verificationStatus');

    const tally = {};
    internships.forEach((i) => {
      if (i.company?.verificationStatus !== 'approved') return;
      (i.skills ?? []).forEach((s) => {
        const label = normalizeSkillLabel(s);
        if (!label) return;
        tally[label] = (tally[label] ?? 0) + 1;
      });
    });

    const rows = Object.entries(tally)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({ rows, totalInternships: internships.length });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch skills stats', details: error.message });
  }
};

const getAllStudents = async (_req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch students', details: error.message });
  }
};

const getAllInternships = async (_req, res) => {
  try {
    const internships = await Internship.find()
      .populate('company', 'companyName verificationStatus')
      .sort({ createdAt: -1 });

    const internshipIds = internships.map((i) => i._id);

    if (internshipIds.length === 0) {
      return res.json(
        internships.map((i) => ({
          ...i.toObject(),
          applicantCount: 0,
          applicantCountByStatus: {},
        })),
      );
    }

    const counts = await Application.aggregate([
      { $match: { internship: { $in: internshipIds } } },
      { $group: { _id: { internship: '$internship', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    internships.forEach((i) => {
      countMap[i._id.toString()] = { total: 0, byStatus: {} };
    });
    counts.forEach((c) => {
      const id = c._id.internship.toString();
      if (!countMap[id]) return;
      countMap[id].total += c.count;
      countMap[id].byStatus[c._id.status] = c.count;
    });

    return res.json(
      internships.map((i) => ({
        ...i.toObject(),
        applicantCount: countMap[i._id.toString()].total,
        applicantCountByStatus: countMap[i._id.toString()].byStatus,
      })),
    );
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch internships', details: error.message });
  }
};

const updateInternshipStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Open', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Open or Closed.' });
    }

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    internship.status = status;
    await internship.save();
    return res.json({ message: 'Status updated', internship });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update internship status', details: error.message });
  }
};

const deleteInternshipByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    await Application.deleteMany({ internship: id });
    await Internship.findByIdAndDelete(id);
    return res.json({ message: 'Internship and related applications deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete internship', details: error.message });
  }
};

const getAllApplications = async (_req, res) => {
  try {
    const applications = await Application.find()
      .populate('student', 'name email programme')
      .populate({
        path: 'internship',
        select: 'title location status company',
        populate: { path: 'company', select: 'companyName' },
      })
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch applications', details: error.message });
  }
};


module.exports = {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  requestDocuments,
  getStats,
  getSkillsStats,
  getAllCompanies,
  getAllStudents,
  getAllInternships,
  updateInternshipStatusByAdmin,
  deleteInternshipByAdmin,
  getAllApplications,
  deleteCompany,
};

