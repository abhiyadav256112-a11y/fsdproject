const db = require('../models/db');

function createAlert(io, { patientId, medicationId = null, alertType, message }) {
  const stmt = db.prepare(`
    INSERT INTO CaregiverAlerts (patient_id, medication_id, alert_type, message, status)
    VALUES (?, ?, ?, ?, 'unread')
  `);
  const result = stmt.run(patientId, medicationId, alertType, message);
  const alertId = Number(result.lastInsertRowid);

  const alert = db.prepare(`
    SELECT a.*, p.name as patient_name, m.name as medication_name, m.dosage
    FROM CaregiverAlerts a
    JOIN Patients p ON a.patient_id = p.id
    LEFT JOIN Medications m ON a.medication_id = m.id
    WHERE a.id = ?
  `).get(alertId);

  if (io) {
    io.emit('new_alert', alert);
  }

  return alert;
}

function getAlerts(patientId, limit = 20) {
  let query = `
    SELECT a.*, p.name as patient_name, m.name as medication_name, m.dosage
    FROM CaregiverAlerts a
    JOIN Patients p ON a.patient_id = p.id
    LEFT JOIN Medications m ON a.medication_id = m.id
  `;
  const params = [];

  if (patientId) {
    query += ` WHERE a.patient_id = ? `;
    params.push(patientId);
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? `;
  params.push(limit);

  return db.prepare(query).all(...params);
}

function markAlertStatus(alertId, status = 'acknowledged') {
  db.prepare(`UPDATE CaregiverAlerts SET status = ? WHERE id = ?`).run(status, alertId);
  return db.prepare(`SELECT * FROM CaregiverAlerts WHERE id = ?`).get(alertId);
}

module.exports = {
  createAlert,
  getAlerts,
  markAlertStatus
};
