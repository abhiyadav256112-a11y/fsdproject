const db = require('../models/db');
const alertService = require('./alertService');

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Sync daily schedules so today always has log rows
function syncTodaySchedule(patientId = 1) {
  const todayStr = formatDate(new Date());

  const schedules = db.prepare(`
    SELECT * FROM DoseSchedules WHERE patient_id = ?
  `).all(patientId);

  const checkLog = db.prepare(`
    SELECT id FROM AdherenceLogs WHERE schedule_id = ? AND scheduled_date = ?
  `);

  const insertLog = db.prepare(`
    INSERT INTO AdherenceLogs (schedule_id, medication_id, patient_id, scheduled_date, dose_status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  for (const s of schedules) {
    const existing = checkLog.get(s.id, todayStr);
    if (!existing) {
      insertLog.run(s.id, s.medication_id, patientId, todayStr);
    }
  }
}

// Get patient's today schedule with live status
function getTodayDoses(patientId = 1) {
  syncTodaySchedule(patientId);
  const todayStr = formatDate(new Date());

  return db.prepare(`
    SELECT 
      l.id as log_id,
      l.dose_status,
      l.confirmed_at,
      l.snooze_until,
      l.scheduled_date,
      s.id as schedule_id,
      s.scheduled_time,
      s.meal_timing,
      m.id as medication_id,
      m.name as medication_name,
      m.dosage,
      m.food_instruction,
      m.remaining_pills,
      m.icon,
      m.color,
      m.image_url
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.patient_id = ? AND l.scheduled_date = ?
    ORDER BY s.scheduled_time ASC
  `).all(patientId, todayStr);
}

// Confirm dose taken
function confirmDose(io, logId, patientId = 1) {
  const now = new Date().toISOString();
  
  const log = db.prepare(`
    SELECT l.*, m.name as medication_name, m.dosage, m.remaining_pills, m.refill_threshold
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    WHERE l.id = ?
  `).get(logId);

  if (!log) {
    throw new Error('Dose record not found');
  }

  // Update status
  db.prepare(`
    UPDATE AdherenceLogs 
    SET dose_status = 'taken', confirmed_at = ?
    WHERE id = ?
  `).run(now, logId);

  // Decrement inventory
  const updatedPills = Math.max(0, (log.remaining_pills || 1) - 1);
  db.prepare(`
    UPDATE Medications 
    SET remaining_pills = ?
    WHERE id = ?
  `).run(updatedPills, log.medication_id);

  // Log dose taken alert for caregiver activity log
  alertService.createAlert(io, {
    patientId: log.patient_id,
    medicationId: log.medication_id,
    alertType: 'dose_taken',
    message: `Medication Confirmed: ${log.medication_name} (${log.dosage}) was taken on time.`
  });

  // Check refill threshold
  if (updatedPills <= (log.refill_threshold || 5)) {
    alertService.createAlert(io, {
      patientId: log.patient_id,
      medicationId: log.medication_id,
      alertType: 'refill_warning',
      message: `Low Inventory Alert: ${log.medication_name} has only ${updatedPills} dose(s) left. Please arrange a refill.`
    });
  }

  const updatedLog = db.prepare(`
    SELECT l.*, m.name as medication_name, m.dosage, m.remaining_pills, s.scheduled_time
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.id = ?
  `).get(logId);

  if (io) {
    io.emit('dose_confirmed', {
      logId,
      patientId: log.patient_id,
      medicationName: log.medication_name,
      confirmedAt: now,
      remainingPills: updatedPills,
      log: updatedLog
    });
  }

  return updatedLog;
}

// Snooze dose for 15 minutes
function snoozeDose(io, logId, minutes = 15) {
  const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE AdherenceLogs
    SET dose_status = 'snoozed', snooze_until = ?
    WHERE id = ?
  `).run(snoozeTime, logId);

  const log = db.prepare(`
    SELECT l.*, m.name as medication_name, m.dosage, s.scheduled_time
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.id = ?
  `).get(logId);

  if (io) {
    io.emit('dose_snoozed', {
      logId,
      patientId: log.patient_id,
      medicationName: log.medication_name,
      snoozeUntil: snoozeTime,
      minutes
    });
  }

  return log;
}

// Check missed dose escalation (runs periodically)
function checkMissedDoseEscalation(io, graceMinutes = 30) {
  const todayStr = formatDate(new Date());
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const pendingDoses = db.prepare(`
    SELECT l.*, s.scheduled_time, m.name as medication_name, m.dosage, p.name as patient_name
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    JOIN Patients p ON l.patient_id = p.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.scheduled_date = ? AND l.dose_status IN ('pending', 'snoozed')
  `).all(todayStr);

  const escalatedLogs = [];

  for (const dose of pendingDoses) {
    if (!dose.scheduled_time) continue;
    const [hh, mm] = dose.scheduled_time.split(':').map(Number);
    const doseMinutes = hh * 60 + mm;

    // If current time is past scheduled time + grace period
    const isPastGrace = currentMinutes > (doseMinutes + graceMinutes);
    const isPastSnooze = dose.snooze_until && new Date(dose.snooze_until) < now;

    if (isPastGrace || (dose.dose_status === 'snoozed' && isPastSnooze)) {
      db.prepare(`UPDATE AdherenceLogs SET dose_status = 'missed' WHERE id = ?`).run(dose.id);
      
      const alert = alertService.createAlert(io, {
        patientId: dose.patient_id,
        medicationId: dose.medication_id,
        alertType: 'missed_dose',
        message: `Potentially Missed Dose: ${dose.patient_name} has not confirmed ${dose.medication_name} (${dose.dosage}) scheduled for ${dose.scheduled_time}. 30-minute grace window expired.`
      });

      if (io) {
        io.emit('missed_dose_escalated', {
          logId: dose.id,
          patientId: dose.patient_id,
          medicationName: dose.medication_name,
          scheduledTime: dose.scheduled_time,
          alert
        });
      }

      escalatedLogs.push(dose);
    }
  }

  return escalatedLogs;
}

// Force escalation simulation for demo
function simulateMissedEscalation(io, logId) {
  const dose = db.prepare(`
    SELECT l.*, s.scheduled_time, m.name as medication_name, m.dosage, p.name as patient_name
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    JOIN Patients p ON l.patient_id = p.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.id = ?
  `).get(logId);

  if (!dose) throw new Error('Dose record not found');

  db.prepare(`UPDATE AdherenceLogs SET dose_status = 'missed' WHERE id = ?`).run(logId);
  dose.dose_status = 'missed';

  const alert = alertService.createAlert(io, {
    patientId: dose.patient_id,
    medicationId: dose.medication_id,
    alertType: 'missed_dose',
    message: `[ESCALATION DEMO] Potentially Missed Dose: ${dose.patient_name} has not confirmed ${dose.medication_name} (${dose.dosage}) scheduled for ${dose.scheduled_time || '10:00 AM'}. 30-minute grace window exceeded.`
  });

  if (io) {
    io.emit('missed_dose_escalated', {
      logId: dose.id,
      patientId: dose.patient_id,
      medicationName: dose.medication_name,
      scheduledTime: dose.scheduled_time || '10:00 AM',
      alert
    });
  }

  return { dose, alert };
}

module.exports = {
  syncTodaySchedule,
  getTodayDoses,
  confirmDose,
  snoozeDose,
  checkMissedDoseEscalation,
  simulateMissedEscalation
};
