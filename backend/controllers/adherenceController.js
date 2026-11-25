const adherenceService = require('../services/adherenceService');
const reminderService = require('../services/reminderService');

function getWeeklyScorecard(req, res) {
  try {
    const patientId = req.query.patientId || 1;
    const scorecard = adherenceService.calculateWeeklyAdherence(patientId);
    res.json(scorecard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getTodaySummary(req, res) {
  try {
    const patientId = req.query.patientId || 1;
    const summary = adherenceService.getTodaySummary(patientId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function confirmDose(req, res) {
  try {
    const { logId, patientId = 1 } = req.body;
    if (!logId) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    const io = req.app.get('io');
    const updated = reminderService.confirmDose(io, logId, patientId);
    res.json({ success: true, log: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function snoozeDose(req, res) {
  try {
    const { logId, minutes = 15 } = req.body;
    if (!logId) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    const io = req.app.get('io');
    const snoozed = reminderService.snoozeDose(io, logId, minutes);
    res.json({ success: true, log: snoozed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function simulateMissed(req, res) {
  try {
    const { logId } = req.body;
    const io = req.app.get('io');
    
    let targetLogId = logId;
    if (!targetLogId) {
      // Find any pending log today
      const todayLogs = reminderService.getTodayDoses(1);
      const pending = todayLogs.find(l => l.dose_status === 'pending');
      if (pending) {
        targetLogId = pending.log_id;
      } else if (todayLogs.length > 0) {
        targetLogId = todayLogs[0].log_id;
      }
    }

    if (!targetLogId) {
      return res.status(400).json({ error: 'No dose schedule found to simulate' });
    }

    const result = reminderService.simulateMissedEscalation(io, targetLogId);
    res.json({ success: true, message: 'Missed dose escalation triggered successfully', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getWeeklyScorecard,
  getTodaySummary,
  confirmDose,
  snoozeDose,
  simulateMissed
};
