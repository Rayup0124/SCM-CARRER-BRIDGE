const express = require('express');
const {
  createApplication,
  getStudentApplications,
  getCompanyApplicationsForInternship,
  getCompanyAllApplications,
  updateApplicationStatus,
  updateApplicationNote,
  withdrawApplication,
} = require('../controllers/applicationController');
const { toggleFavorite, getMyFavorites, getMyFavoriteIds } = require('../controllers/favoriteController');
const authorize = require('../middleware/auth');

const router = express.Router();

router.post('/', authorize('student'), createApplication);
router.delete('/:id', authorize('student'), withdrawApplication);
router.get('/student/me', authorize('student'), getStudentApplications);
router.get('/company/me', authorize('company'), getCompanyAllApplications);
router.get('/company/:internshipId', authorize('company'), getCompanyApplicationsForInternship);
router.put('/:id/status', authorize('company'), updateApplicationStatus);
router.put('/:id/note', authorize('company'), updateApplicationNote);

// Favorites
router.post('/favorites/toggle', authorize('student'), toggleFavorite);
router.get('/favorites/me', authorize('student'), getMyFavorites);
router.get('/favorites/me/ids', authorize('student'), getMyFavoriteIds);

module.exports = router;

