const db = require('../models/db');
const reminderService = require('../services/reminderService');

function getMedications(req, res) {
  try {
    const patientId = req.query.patientId || 1;
    const meds = db.prepare(`
      SELECT m.*, s.scheduled_time, s.meal_timing, s.id as schedule_id
      FROM Medications m
      LEFT JOIN DoseSchedules s ON s.medication_id = m.id
      WHERE m.patient_id = ?
      ORDER BY s.scheduled_time ASC, m.id ASC
    `).all(patientId);

    res.json({ medications: meds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getTodayMedications(req, res) {
  try {
    const patientId = req.query.patientId || 1;
    const doses = reminderService.getTodayDoses(patientId);
    res.json({ doses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function addMedication(req, res) {
  try {
    const {
      patientId = 1,
      name,
      dosage,
      frequency,
      food_instruction,
      remaining_pills = 30,
      refill_threshold = 5,
      scheduled_time = '09:00',
      meal_timing = 'with_food',
      color = '#3b82f6',
      icon = 'tablet'
    } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Medication name and dosage are required' });
    }

    const insertMed = db.prepare(`
      INSERT INTO Medications (patient_id, name, dosage, frequency, food_instruction, remaining_pills, refill_threshold, icon, color, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const medRes = insertMed.run(
      patientId,
      name,
      dosage,
      frequency || 'Daily',
      food_instruction || 'Take with water',
      Number(remaining_pills),
      Number(refill_threshold),
      icon,
      color,
      '/assets/images/default-pill.svg'
    );
    const medId = Number(medRes.lastInsertRowid);

    // Insert Schedule
    const insertSched = db.prepare(`
      INSERT INTO DoseSchedules (medication_id, patient_id, scheduled_time, meal_timing)
      VALUES (?, ?, ?, ?)
    `);
    insertSched.run(medId, patientId, scheduled_time, meal_timing);

    // Sync today
    reminderService.syncTodaySchedule(patientId);

    const io = req.app.get('io');
    if (io) {
      io.emit('schedule_updated', { patientId, action: 'added', medicationName: name });
    }

    res.json({ success: true, medicationId: medId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function updateMedication(req, res) {
  try {
    const medId = req.params.id;
    const { name, dosage, frequency, food_instruction, remaining_pills, scheduled_time, meal_timing } = req.body;

    db.prepare(`
      UPDATE Medications
      SET name = COALESCE(?, name),
          dosage = COALESCE(?, dosage),
          frequency = COALESCE(?, frequency),
          food_instruction = COALESCE(?, food_instruction),
          remaining_pills = COALESCE(?, remaining_pills)
      WHERE id = ?
    `).run(name, dosage, frequency, food_instruction, remaining_pills, medId);

    if (scheduled_time || meal_timing) {
      db.prepare(`
        UPDATE DoseSchedules
        SET scheduled_time = COALESCE(?, scheduled_time),
            meal_timing = COALESCE(?, meal_timing)
        WHERE medication_id = ?
      `).run(scheduled_time, meal_timing, medId);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('schedule_updated', { medicationId: medId, action: 'updated' });
    }

    res.json({ success: true, message: 'Medication updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function deleteMedication(req, res) {
  try {
    const medId = req.params.id;
    db.prepare('DELETE FROM DoseSchedules WHERE medication_id = ?').run(medId);
    db.prepare('DELETE FROM Medications WHERE id = ?').run(medId);

    const io = req.app.get('io');
    if (io) {
      io.emit('schedule_updated', { medicationId: medId, action: 'deleted' });
    }

    res.json({ success: true, message: 'Medication removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function refillPills(req, res) {
  try {
    const medId = req.params.id;
    const { amount = 30 } = req.body;

    db.prepare(`
      UPDATE Medications
      SET remaining_pills = remaining_pills + ?
      WHERE id = ?
    `).run(Number(amount), medId);

    const updated = db.prepare('SELECT * FROM Medications WHERE id = ?').get(medId);

    const io = req.app.get('io');
    if (io) {
      io.emit('schedule_updated', { medicationId: medId, action: 'refilled', remainingPills: updated.remaining_pills });
    }

    res.json({ success: true, remainingPills: updated.remaining_pills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMedications,
  getTodayMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  refillPills
};
