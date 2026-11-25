const express = require('express');
const router = express.Router();
const adherenceController = require('../controllers/adherenceController');

router.get('/weekly', adherenceController.getWeeklyScorecard);
router.get('/today', adherenceController.getTodaySummary);
router.post('/confirm', adherenceController.confirmDose);
router.post('/snooze', adherenceController.snoozeDose);
router.post('/simulate-missed', adherenceController.simulateMissed);

module.exports = router;
