const Application = require('../models/Application');
const Internship = require('../models/Internship');

const createApplication = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit applications' });
    }

    const { internshipId } = req.body;
    if (!internshipId) {
      return res.status(400).json({ message: 'internshipId is required' });
    }

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    const existing = await Application.findOne({ student: student._id, internship: internshipId });
    if (existing) {
      return res.status(409).json({ message: 'Application already exists for this internship' });
    }

    const application = await Application.create({
      student: student._id,
      internship: internshipId,
    });

    return res.status(201).json(application);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create application', details: error.message });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their applications' });
    }

    const applications = await Application.find({ student: student._id })
      .populate({
        path: 'internship',
        select: 'title company location requiredAttachments',
        populate: { path: 'company', select: 'companyName' },
      })
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch applications', details: error.message });
  }
};

const getCompanyApplicationsForInternship = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Only companies can view applications for their internships' });
    }

    const { internshipId } = req.params;

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (String(internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only view applications for your own internships' });
    }

    const applications = await Application.find({ internship: internshipId })
      .populate('student', 'name email programme skills resumeUrl resumeUrls')
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch applications for internship', details: error.message });
  }
};

const getCompanyAllApplications = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Only companies can view applications' });
    }

    const internships = await Internship.find({ company: company._id }).select('_id title');
    const internshipIds = internships.map((i) => i._id);

    if (internshipIds.length === 0) {
      return res.json({ internships: [], applications: [] });
    }

    const applications = await Application.find({ internship: { $in: internshipIds } })
      .populate('student', 'name email programme skills resumeUrl resumeUrls')
      .populate('internship', 'title requiredAttachments')
      .sort({ createdAt: -1 });

    return res.json({ applications, internships });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch applications', details: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Only companies can update application status' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Reviewed', 'Interviewing', 'Accepted', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Application.findById(id).populate('internship');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(application.internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only update applications for your own internships' });
    }

    application.status = status;
    await application.save();

    return res.json(application);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update application status', details: error.message });
  }
};

const updateApplicationNote = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Only companies can update application notes' });
    }

    const { id } = req.params;
    const { note } = req.body;

    const application = await Application.findById(id).populate('internship');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(application.internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only update notes for your own applications' });
    }

    application.note = note !== undefined ? String(note) : '';
    await application.save();

    return res.json({ note: application.note });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update note', details: error.message });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can withdraw applications' });
    }

    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (String(application.student) !== String(student._id)) {
      return res.status(403).json({ message: 'You can only withdraw your own applications' });
    }

    const withdrawable = ['Pending', 'Reviewed'];
    if (!withdrawable.includes(application.status)) {
      return res.status(400).json({
        message: 'You can only withdraw while your status is Applied or Under Review.',
      });
    }

    await Application.findByIdAndDelete(id);
    return res.json({ message: 'Application withdrawn' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to withdraw application', details: error.message });
  }
};

module.exports = {
  createApplication,
  getStudentApplications,
  getCompanyApplicationsForInternship,
  getCompanyAllApplications,
  updateApplicationStatus,
  updateApplicationNote,
  withdrawApplication,
};

