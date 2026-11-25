const db = require('../models/db');

function login(req, res) {
  try {
    const { role, email, password, patientId } = req.body;

    if (role === 'patient') {
      const pid = patientId || 1;
      const patient = db.prepare('SELECT * FROM Patients WHERE id = ?').get(pid);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      return res.json({
        success: true,
        user: {
          id: patient.id,
          name: patient.name,
          role: 'patient',
          language: patient.language || 'en',
          emergency_contact: patient.emergency_contact,
          emergency_name: patient.emergency_name
        }
      });
    }

    if (role === 'caregiver') {
      const cgEmail = email || 'caregiver@pillping.com';
      const caregiver = db.prepare('SELECT * FROM Caregivers WHERE email = ?').get(cgEmail);
      if (!caregiver) {
        return res.status(401).json({ error: 'Invalid caregiver credentials' });
      }
      return res.json({
        success: true,
        user: {
          id: caregiver.id,
          name: caregiver.name,
          email: caregiver.email,
          phone: caregiver.phone,
          role: 'caregiver'
        }
      });
    }

    return res.status(400).json({ error: 'Invalid role specified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getMe(req, res) {
  try {
    const role = req.query.role || 'caregiver';
    if (role === 'caregiver') {
      const cg = db.prepare('SELECT id, name, email, phone FROM Caregivers LIMIT 1').get();
      return res.json({ user: { ...cg, role: 'caregiver' } });
    } else {
      const p = db.prepare('SELECT * FROM Patients LIMIT 1').get();
      return res.json({ user: { ...p, role: 'patient' } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  login,
  getMe
};
