const express = require('express');
const { getProgrammes, getMe, updateMe } = require('../controllers/userController');
const authorize = require('../middleware/auth');

const router = express.Router();

router.get('/programmes', getProgrammes);
router.get('/me', authorize('student', 'admin'), getMe);
router.patch('/me', authorize('student', 'admin'), updateMe);

module.exports = router;
