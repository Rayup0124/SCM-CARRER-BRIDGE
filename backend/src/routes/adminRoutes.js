const express = require('express');
const {
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
} = require('../controllers/adminController');
const authorize = require('../middleware/auth');

const router = express.Router();

router.get('/companies/pending', authorize('admin'), getPendingCompanies);
router.get('/companies/all', authorize('admin'), getAllCompanies);
router.put('/companies/approve/:id', authorize('admin'), approveCompany);
router.delete('/companies/reject/:id', authorize('admin'), rejectCompany);
router.delete('/companies/:id', authorize('admin'), deleteCompany);
router.put('/companies/request-documents/:id', authorize('admin'), requestDocuments);
router.get('/students/all', authorize('admin'), getAllStudents);
router.get('/stats', authorize('admin'), getStats);
router.get('/skills/stats', authorize('admin'), getSkillsStats);

router.get('/internships/all', authorize('admin'), getAllInternships);
router.put('/internships/:id/status', authorize('admin'), updateInternshipStatusByAdmin);
router.delete('/internships/:id', authorize('admin'), deleteInternshipByAdmin);

router.get('/applications/all', authorize('admin'), getAllApplications);

module.exports = router;
