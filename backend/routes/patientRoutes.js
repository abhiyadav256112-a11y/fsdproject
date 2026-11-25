const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

router.get('/:id', patientController.getPatientProfile);
router.put('/:id/language', patientController.updateLanguage);
router.post('/:id/sos', patientController.triggerSOS);

module.exports = router;
