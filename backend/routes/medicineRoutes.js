const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

router.get('/', medicineController.getMedications);
router.get('/today', medicineController.getTodayMedications);
router.post('/', medicineController.addMedication);
router.put('/:id', medicineController.updateMedication);
router.delete('/:id', medicineController.deleteMedication);
router.post('/:id/refill', medicineController.refillPills);

module.exports = router;
