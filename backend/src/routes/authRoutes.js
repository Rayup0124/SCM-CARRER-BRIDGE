const express = require('express');
const { registerStudent, registerCompany, login, requestReactivation } = require('../controllers/authController');
const { registerCompanyDocUpload } = require('../middleware/registerCompanyUpload');

const router = express.Router();

router.post('/register/student', registerStudent);

const registerCompanyWithDoc = (req, res, next) => {
  registerCompanyDocUpload.array('documents', 10)(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Each file must be smaller than 5MB.'
          : err.code === 'LIMIT_FILES'
          ? 'Maximum 10 files allowed.'
          : err.message || 'File upload failed';
      return res.status(400).json({ message });
    }
    next();
  });
};

router.post('/register/company', registerCompanyWithDoc, registerCompany);
router.post('/login', login);
router.post('/reactivate-request', requestReactivation);

module.exports = router;

