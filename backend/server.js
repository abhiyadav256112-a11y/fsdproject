const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

// Database initialization
require('./models/db');

// Service dependencies
const reminderService = require('./services/reminderService');
const alertService = require('./services/alertService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Store io instance in app for controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/medications', require('./routes/medicineRoutes'));
app.use('/api/adherence', require('./routes/adherenceRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));

// Socket.IO Real-time Connection
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_caregiver', (data) => {
    socket.join('caregivers');
    console.log(`[Socket.IO] Caregiver joined room 'caregivers':`, data);
    socket.emit('connection_ready', { role: 'caregiver', message: 'Connected to PillPing Live Adherence Network' });
  });

  socket.on('join_patient', (data) => {
    socket.join('patients');
    console.log(`[Socket.IO] Patient joined room 'patients':`, data);
    socket.emit('connection_ready', { role: 'patient', message: 'Connected to PillPing Senior Care Service' });
  });

  socket.on('trigger_patient_reminder', (data) => {
    io.emit('trigger_dose_reminder', data);
  });

  socket.on('patient_sos', (data) => {
    const alert = alertService.createAlert(io, {
      patientId: data.patientId || 1,
      alertType: 'sos',
      message: `🚨 URGENT SOS: Patient ${data.name || 'Ramachandra Rao'} has activated the Emergency SOS alert!`
    });
    io.emit('patient_emergency_sos', { ...data, alert });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Background Check for Missed Dose Escalation every 60 seconds
setInterval(() => {
  try {
    reminderService.checkMissedDoseEscalation(io, 30);
  } catch (err) {
    console.error('[Scheduler Error]', err.message);
  }
}, 60000);

// Default route fallback to index.html for client-side navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDir, 'index.html'));
  }
  next();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  PillPing: CareCircle Full-Stack Server Running!    `);
  console.log(`  Local URL:        http://localhost:${PORT}        `);
  console.log(`  Elderly Screen:   http://localhost:${PORT}/patient.html`);
  console.log(`  Caregiver Screen: http://localhost:${PORT}/caregiver.html`);
  console.log(`  Login Portal:     http://localhost:${PORT}/login.html  `);
  console.log(`====================================================`);
});
