const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAlerts);
router.put('/:id/acknowledge', alertController.acknowledgeAlert);
router.post('/simulate-refill', alertController.simulateRefillWarning);
router.post('/simulate-reminder', alertController.simulateDoseReminder);
router.post('/reset-demo', alertController.resetDemoData);

module.exports = router;
