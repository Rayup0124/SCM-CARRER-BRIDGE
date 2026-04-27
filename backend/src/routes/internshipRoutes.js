const express = require('express');
const {
  getInternships,
  getInternshipById,
  getCompanyInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  getSkillsStats,
  getPopularSkills,
  getCompanyInternships,
} = require('../controllers/internshipController');
const authorize = require('../middleware/auth');

const router = express.Router();

router.get('/', getInternships);
router.get('/skills/stats', getSkillsStats);
router.get('/skills/popular', getPopularSkills);
router.get('/company/me', authorize('company'), getCompanyInternships);
router.get('/company/me/:id', authorize('company'), getCompanyInternshipById);
router.get('/:id', getInternshipById);
router.post('/', authorize('company'), createInternship);
router.put('/:id', authorize('company'), updateInternship);
router.delete('/:id', authorize('company'), deleteInternship);

module.exports = router;

