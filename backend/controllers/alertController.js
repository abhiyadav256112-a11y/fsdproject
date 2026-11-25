const alertService = require('../services/alertService');

function getAlerts(req, res) {
  try {
    const patientId = req.query.patientId;
    const alerts = alertService.getAlerts(patientId ? Number(patientId) : null);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function acknowledgeAlert(req, res) {
  try {
    const alertId = req.params.id;
    const updated = alertService.markAlertStatus(alertId, 'acknowledged');
    const io = req.app.get('io');
    if (io) {
      io.emit('alert_acknowledged', { alertId });
    }
    res.json({ success: true, alert: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function simulateRefillWarning(req, res) {
  try {
    const io = req.app.get('io');
    const alert = alertService.createAlert(io, {
      patientId: 1,
      medicationId: 2,
      alertType: 'refill_warning',
      message: '[REFILL DEMO] Amlodipine (5 mg) inventory reached critical level (3 doses left). Caregiver refill needed.'
    });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function simulateDoseReminder(req, res) {
  try {
    const io = req.app.get('io');
    const { medicationName = 'Amlodipine', dosage = '5 mg', foodInstruction = 'Take with a glass of water', time = '10:00 AM' } = req.body;

    if (io) {
      io.emit('trigger_dose_reminder', {
        medicationName,
        dosage,
        foodInstruction,
        time,
        icon: 'capsule',
        color: '#10b981'
      });
    }
    res.json({ success: true, message: 'Dose reminder triggered to patient screen' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function resetDemoData(req, res) {
  try {
    const db = require('../models/db');
    db.resetDefaultData();
    const io = req.app.get('io');
    if (io) {
      io.emit('schedule_updated', { message: 'Demo data reset to initial state' });
    }
    res.json({ success: true, message: 'Database reset to initial hackathon demo state' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAlerts,
  acknowledgeAlert,
  simulateRefillWarning,
  simulateDoseReminder,
  resetDemoData
};
