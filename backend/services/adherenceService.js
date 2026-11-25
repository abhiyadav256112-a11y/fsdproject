const db = require('../models/db');

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getTodaySummary(patientId = 1) {
  const todayStr = formatDate(new Date());

  const logs = db.prepare(`
    SELECT l.*, m.name as medication_name, m.dosage, m.food_instruction, m.icon, m.color, s.scheduled_time
    FROM AdherenceLogs l
    JOIN Medications m ON l.medication_id = m.id
    LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
    WHERE l.patient_id = ? AND l.scheduled_date = ?
    ORDER BY s.scheduled_time ASC
  `).all(patientId, todayStr);

  const total = logs.length;
  const completed = logs.filter(l => l.dose_status === 'taken').length;
  const missed = logs.filter(l => l.dose_status === 'missed').length;
  const pending = logs.filter(l => l.dose_status === 'pending' || l.dose_status === 'snoozed').length;

  const adherence = total > 0 ? Math.round((completed / total) * 100) : 100;

  return {
    date: todayStr,
    total,
    completed,
    missed,
    pending,
    adherencePercentage: adherence,
    logs
  };
}

function calculateWeeklyAdherence(patientId = 1) {
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyBreakdown = [];

  let totalScheduled = 0;
  let totalConfirmed = 0;
  let totalMissed = 0;
  let totalPending = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const dayName = dayNames[d.getDay()];

    const dayLogs = db.prepare(`
      SELECT l.*, m.name as medication_name, m.dosage, s.scheduled_time
      FROM AdherenceLogs l
      JOIN Medications m ON l.medication_id = m.id
      LEFT JOIN DoseSchedules s ON l.schedule_id = s.id
      WHERE l.patient_id = ? AND l.scheduled_date = ?
      ORDER BY s.scheduled_time ASC
    `).all(patientId, dateStr);

    const scheduled = dayLogs.length;
    const confirmed = dayLogs.filter(l => l.dose_status === 'taken').length;
    const missed = dayLogs.filter(l => l.dose_status === 'missed').length;
    const pending = dayLogs.filter(l => l.dose_status === 'pending' || l.dose_status === 'snoozed').length;

    totalScheduled += scheduled;
    totalConfirmed += confirmed;
    totalMissed += missed;
    totalPending += pending;

    const dayRate = scheduled > 0 ? Math.round((confirmed / scheduled) * 100) : 100;

    dailyBreakdown.push({
      date: dateStr,
      dayName,
      isToday: i === 0,
      scheduled,
      confirmed,
      missed,
      pending,
      adherencePercentage: dayRate,
      logs: dayLogs
    });
  }

  // Denominator: Scheduled doses that have reached decision or scheduled total
  const completedOrMissed = totalConfirmed + totalMissed;
  // Standard formula requested in prompt: Confirmed doses / Scheduled doses * 100
  const adherence = totalScheduled > 0 ? Math.round((totalConfirmed / totalScheduled) * 100) : 100;

  return {
    patientId,
    totalScheduled,
    totalConfirmed,
    totalMissed,
    totalPending,
    adherencePercentage: adherence,
    dailyBreakdown
  };
}

module.exports = {
  getTodaySummary,
  calculateWeeklyAdherence
};
