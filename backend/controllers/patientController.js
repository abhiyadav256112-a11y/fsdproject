const db = require('../models/db');
const alertService = require('../services/alertService');

function getPatientProfile(req, res) {
  try {
    const patientId = req.params.id || 1;
    const patient = db.prepare(`
      SELECT p.*, c.name as caregiver_name, c.email as caregiver_email, c.phone as caregiver_phone
      FROM Patients p
      LEFT JOIN Caregivers c ON p.caregiver_id = c.id
      WHERE p.id = ?
    `).get(patientId);

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function updateLanguage(req, res) {
  try {
    const patientId = req.params.id || 1;
    const { language } = req.body;
    db.prepare('UPDATE Patients SET language = ? WHERE id = ?').run(language || 'en', patientId);
    res.json({ success: true, language });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function triggerSOS(req, res) {
  try {
    const patientId = req.params.id || 1;
    const patient = db.prepare('SELECT * FROM Patients WHERE id = ?').get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const io = req.app.get('io');
    const alert = alertService.createAlert(io, {
      patientId: patient.id,
      alertType: 'sos',
      message: `🚨 EMERGENCY SOS! ${patient.name} pressed the Emergency SOS Help button! Immediate caregiver response required.`
    });

    if (io) {
      io.emit('patient_emergency_sos', {
        patientId: patient.id,
        patientName: patient.name,
        contact: patient.phone,
        emergencyContact: patient.emergency_contact,
        alert
      });
    }

    res.json({ success: true, message: 'Emergency SOS activated and caregiver alerted.', alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPatientProfile,
  updateLanguage,
  triggerSOS
};
