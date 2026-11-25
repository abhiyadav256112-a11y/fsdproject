const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, '../database/pillping.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Initialize Tables
function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Caregivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caregiver_id INTEGER,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      phone TEXT NOT NULL,
      emergency_contact TEXT NOT NULL,
      emergency_name TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      medical_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caregiver_id) REFERENCES Caregivers(id)
    );

    CREATE TABLE IF NOT EXISTS Medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      food_instruction TEXT NOT NULL,
      remaining_pills INTEGER DEFAULT 30,
      refill_threshold INTEGER DEFAULT 5,
      icon TEXT DEFAULT 'pill',
      color TEXT DEFAULT '#2563eb',
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES Patients(id)
    );

    CREATE TABLE IF NOT EXISTS DoseSchedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      scheduled_time TEXT NOT NULL,
      meal_timing TEXT DEFAULT 'with_food',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES Medications(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES Patients(id)
    );

    CREATE TABLE IF NOT EXISTS AdherenceLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER,
      medication_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      dose_status TEXT DEFAULT 'pending', -- 'taken', 'pending', 'snoozed', 'missed'
      confirmed_at DATETIME,
      snooze_until DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES DoseSchedules(id) ON DELETE SET NULL,
      FOREIGN KEY (medication_id) REFERENCES Medications(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES Patients(id)
    );

    CREATE TABLE IF NOT EXISTS CaregiverAlerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      medication_id INTEGER,
      alert_type TEXT NOT NULL, -- 'missed_dose', 'refill_warning', 'sos', 'dose_taken'
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread', -- 'unread', 'read', 'acknowledged'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES Patients(id),
      FOREIGN KEY (medication_id) REFERENCES Medications(id) ON DELETE SET NULL
    );
  `);

  seedDefaultData();
}

// Seed initial hackathon demo data if empty
function seedDefaultData() {
  const checkCaregiver = db.prepare('SELECT COUNT(*) as count FROM Caregivers').get();
  if (checkCaregiver && checkCaregiver.count > 0) {
    return; // Already seeded
  }

  // 1. Caregiver
  const insertCaregiver = db.prepare(`
    INSERT INTO Caregivers (name, email, phone, password)
    VALUES (?, ?, ?, ?)
  `);
  const caregiverRes = insertCaregiver.run(
    'Ananya Rao',
    'caregiver@pillping.com',
    '+91 98765 12345',
    'password123'
  );
  const caregiverId = Number(caregiverRes.lastInsertRowid);

  // 2. Patient
  const insertPatient = db.prepare(`
    INSERT INTO Patients (caregiver_id, name, age, phone, emergency_contact, emergency_name, language, medical_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const patientRes = insertPatient.run(
    caregiverId,
    'Ramachandra Rao',
    74,
    '+91 98765 43210',
    '+91 98765 12345',
    'Ananya Rao (Daughter)',
    'en',
    'Hypertension, Type 2 Diabetes'
  );
  const patientId = Number(patientRes.lastInsertRowid);

  // 3. Medications
  const insertMed = db.prepare(`
    INSERT INTO Medications (patient_id, name, dosage, frequency, food_instruction, remaining_pills, refill_threshold, icon, color, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const m1 = Number(insertMed.run(patientId, 'Metformin', '500 mg', 'Morning', 'Take with breakfast', 18, 5, 'tablet', '#3b82f6', '/assets/images/metformin.svg').lastInsertRowid);
  const m2 = Number(insertMed.run(patientId, 'Amlodipine', '5 mg', 'Morning', 'Take with a glass of water', 4, 5, 'capsule', '#10b981', '/assets/images/amlodipine.svg').lastInsertRowid); // <= 5 triggers refill alert
  const m3 = Number(insertMed.run(patientId, 'Atorvastatin', '10 mg', 'Afternoon', 'Take after lunch', 24, 5, 'round-pill', '#f59e0b', '/assets/images/atorvastatin.svg').lastInsertRowid);
  const m4 = Number(insertMed.run(patientId, 'Aspirin', '75 mg', 'Night', 'Take after dinner with water', 28, 5, 'circle-pill', '#ec4899', '/assets/images/aspirin.svg').lastInsertRowid);

  // 4. Dose Schedules
  const insertSched = db.prepare(`
    INSERT INTO DoseSchedules (medication_id, patient_id, scheduled_time, meal_timing)
    VALUES (?, ?, ?, ?)
  `);
  const s1 = Number(insertSched.run(m1, patientId, '08:00', 'with_food').lastInsertRowid);
  const s2 = Number(insertSched.run(m2, patientId, '10:00', 'with_water').lastInsertRowid);
  const s3 = Number(insertSched.run(m3, patientId, '14:00', 'after_food').lastInsertRowid);
  const s4 = Number(insertSched.run(m4, patientId, '20:00', 'after_food').lastInsertRowid);

  // 5. Seed Past 6 Days of Adherence Logs for Weekly Scorecard
  const insertLog = db.prepare(`
    INSERT INTO AdherenceLogs (schedule_id, medication_id, patient_id, scheduled_date, dose_status, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Fill last 6 days with ~94% adherence
  for (let i = 6; i >= 1; i--) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const dateStr = formatDate(pastDate);

    // Doses for the day
    insertLog.run(s1, m1, patientId, dateStr, 'taken', `${dateStr}T08:05:00`);
    
    // On day 4 ago, miss one amlodipine dose to show realistic missed dose in history
    if (i === 4) {
      insertLog.run(s2, m2, patientId, dateStr, 'missed', null);
    } else {
      insertLog.run(s2, m2, patientId, dateStr, 'taken', `${dateStr}T10:02:00`);
    }

    insertLog.run(s3, m3, patientId, dateStr, 'taken', `${dateStr}T14:15:00`);
    insertLog.run(s4, m4, patientId, dateStr, 'taken', `${dateStr}T20:10:00`);
  }

  // Today's doses
  const todayStr = formatDate(today);
  // Metformin 8:00 AM - already taken
  insertLog.run(s1, m1, patientId, todayStr, 'taken', `${todayStr}T08:12:00`);
  // Amlodipine 10:00 AM - Pending / Ready for reminder
  insertLog.run(s2, m2, patientId, todayStr, 'pending', null);
  // Atorvastatin 2:00 PM - Pending
  insertLog.run(s3, m3, patientId, todayStr, 'pending', null);
  // Aspirin 8:00 PM - Pending
  insertLog.run(s4, m4, patientId, todayStr, 'pending', null);

  // 6. Caregiver Alerts
  const insertAlert = db.prepare(`
    INSERT INTO CaregiverAlerts (patient_id, medication_id, alert_type, message, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAlert.run(patientId, m2, 'refill_warning', 'Refill Warning: Amlodipine (5 mg) has only 4 doses remaining. Please order a refill.', 'unread');
  insertAlert.run(patientId, m1, 'dose_taken', 'Ramachandra Rao confirmed morning dose of Metformin (500 mg) at 08:12 AM.', 'read');
}

// Reset data back to clean demo state
function resetDefaultData() {
  db.exec(`
    DELETE FROM CaregiverAlerts;
    DELETE FROM AdherenceLogs;
    DELETE FROM DoseSchedules;
    DELETE FROM Medications;
    DELETE FROM Patients;
    DELETE FROM Caregivers;
    DELETE FROM sqlite_sequence WHERE name IN ('Caregivers', 'Patients', 'Medications', 'DoseSchedules', 'AdherenceLogs', 'CaregiverAlerts');
  `);
  seedDefaultData();
}

// Call initDatabase
initDatabase();

db.resetDefaultData = resetDefaultData;

module.exports = db;
