/**
 * PillPing: CareCircle - Local Store & Multi-Tab Synchronization Service
 * 100% Client-Side Pure Frontend State Management with BroadcastChannel & LocalStorage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'pillping_state_v1';
  const CHANNEL_NAME = 'pillping_sync_channel';

  // BroadcastChannel for cross-window / cross-tab real-time sync
  let channel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported or restricted, falling back to storage events');
  }

  // Initial Seed Data: 2 Patient Profiles, 4 Prescribed Chronic Medications each, 14-day logs
  function getDefaultData() {
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      activePatientId: 1,
      patients: [
        {
          id: 1,
          name: 'Ramachandra Rao',
          age: 74,
          gender: 'Male',
          emergency_contact: '+91 98765 12345',
          caregiver_name: 'Ananya Rao (Daughter)',
          caregiver_email: 'ananya.rao@carecircle.org',
          medical_notes: 'Hypertension, Type 2 Diabetes',
          avatar: '🧓'
        },
        {
          id: 2,
          name: 'Savitri Devi',
          age: 79,
          gender: 'Female',
          emergency_contact: '+91 98111 22334',
          caregiver_name: 'Rajesh Sharma (Son)',
          caregiver_email: 'rajesh.sharma@carecircle.org',
          medical_notes: 'Osteoarthritis, Cardiac arrhythmia',
          avatar: '👵'
        }
      ],
      medications: [
        {
          id: 1,
          patient_id: 1,
          name: 'Metformin',
          dosage: '500 mg',
          frequency: 'Morning & Night',
          scheduled_times: ['08:30', '20:30'],
          food_instruction: 'Take with food or breakfast',
          remaining_pills: 28,
          refill_threshold: 5,
          image_url: './assets/images/metformin.svg',
          color: '#3b82f6',
          active: true
        },
        {
          id: 2,
          patient_id: 1,
          name: 'Amlodipine',
          dosage: '5 mg',
          frequency: 'Morning',
          scheduled_times: ['10:00'],
          food_instruction: 'Take with a glass of water',
          remaining_pills: 4, // <= 5: triggers prescription refill alert
          refill_threshold: 5,
          image_url: './assets/images/amlodipine.svg',
          color: '#ef4444',
          active: true
        },
        {
          id: 3,
          patient_id: 1,
          name: 'Aspirin',
          dosage: '75 mg',
          frequency: 'Afternoon',
          scheduled_times: ['14:00'],
          food_instruction: 'Take after lunch with water',
          remaining_pills: 22,
          refill_threshold: 5,
          image_url: './assets/images/aspirin.svg',
          color: '#10b981',
          active: true
        },
        {
          id: 4,
          patient_id: 1,
          name: 'Atorvastatin',
          dosage: '20 mg',
          frequency: 'Night',
          scheduled_times: ['21:00'],
          food_instruction: 'Take at bedtime with water',
          remaining_pills: 18,
          refill_threshold: 5,
          image_url: './assets/images/atorvastatin.svg',
          color: '#8b5cf6',
          active: true
        },
        // Patient 2 Medications
        {
          id: 5,
          patient_id: 2,
          name: 'Losartan',
          dosage: '50 mg',
          frequency: 'Morning',
          scheduled_times: ['09:00'],
          food_instruction: 'Take before breakfast',
          remaining_pills: 25,
          refill_threshold: 5,
          image_url: './assets/images/amlodipine.svg',
          color: '#3b82f6',
          active: true
        },
        {
          id: 6,
          patient_id: 2,
          name: 'Aspirin',
          dosage: '75 mg',
          frequency: 'Afternoon',
          scheduled_times: ['13:30'],
          food_instruction: 'Take with lunch',
          remaining_pills: 3, // Low refill alert
          refill_threshold: 5,
          image_url: './assets/images/aspirin.svg',
          color: '#ef4444',
          active: true
        }
      ],
      // Today's generated schedule logs for Patient 1
      todayLogs: [
        {
          id: 101,
          patient_id: 1,
          medication_id: 1,
          medication_name: 'Metformin',
          dosage: '500 mg',
          scheduled_time: '08:30',
          dose_status: 'taken',
          food_instruction: 'Take with food or breakfast',
          image_url: './assets/images/metformin.svg',
          confirmed_time: '08:32 AM',
          date: todayStr
        },
        {
          id: 102,
          patient_id: 1,
          medication_id: 2,
          medication_name: 'Amlodipine',
          dosage: '5 mg',
          scheduled_time: '10:00',
          dose_status: 'pending',
          food_instruction: 'Take with a glass of water',
          image_url: './assets/images/amlodipine.svg',
          confirmed_time: null,
          date: todayStr
        },
        {
          id: 103,
          patient_id: 1,
          medication_id: 3,
          medication_name: 'Aspirin',
          dosage: '75 mg',
          scheduled_time: '14:00',
          dose_status: 'pending',
          food_instruction: 'Take after lunch with water',
          image_url: './assets/images/aspirin.svg',
          confirmed_time: null,
          date: todayStr
        },
        {
          id: 104,
          patient_id: 1,
          medication_id: 1,
          medication_name: 'Metformin',
          dosage: '500 mg',
          scheduled_time: '20:30',
          dose_status: 'pending',
          food_instruction: 'Take with dinner',
          image_url: './assets/images/metformin.svg',
          confirmed_time: null,
          date: todayStr
        },
        {
          id: 105,
          patient_id: 1,
          medication_id: 4,
          medication_name: 'Atorvastatin',
          dosage: '20 mg',
          scheduled_time: '21:00',
          dose_status: 'pending',
          food_instruction: 'Take at bedtime with water',
          image_url: './assets/images/atorvastatin.svg',
          confirmed_time: null,
          date: todayStr
        }
      ],
      // 14-day adherence history for computation & visual calendar dots (Past 14 days)
      historyLogs: generate14DayHistoryLogs(),
      alerts: [
        {
          id: 1,
          patient_id: 1,
          type: 'refill',
          title: 'Prescription Refill Warning',
          message: 'Amlodipine (5mg) is low: only 4 doses remaining. Please order refill.',
          timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          urgent: true,
          read: false
        }
      ]
    };
  }

  // Generates 14-day history for Patient 1 yielding ~94% compliance
  function generate14DayHistoryLogs() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const history = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;

      // Realistic compliance distribution yielding 94% on-time adherence
      let scheduled = isToday ? 4 : 5;
      let confirmed = isToday ? 3 : (i === 4 ? 4 : 5);
      let missed = isToday ? 0 : (i === 4 ? 1 : 0);
      let pending = isToday ? 1 : 0;
      let adherence = Math.round((confirmed / scheduled) * 100);

      history.push({
        dayName,
        date: dateStr,
        dayOffset: i,
        isToday,
        scheduled,
        confirmed,
        missed,
        pending,
        adherencePercentage: adherence
      });
    }
    return history;
  }

  // Local state container
  let state = null;
  const subscribers = [];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
      } else {
        state = getDefaultData();
        saveState(false);
      }
    } catch (e) {
      console.warn('Failed to parse state from localStorage, initializing fresh:', e);
      state = getDefaultData();
    }
  }

  function saveState(broadcast = true, eventAction = 'UPDATE', eventPayload = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }

    if (broadcast) {
      const msg = { action: eventAction, payload: eventPayload, timestamp: Date.now() };
      if (channel) {
        channel.postMessage(msg);
      }
      // Also notify local listeners
      notifySubscribers(msg);
    }
  }

  function notifySubscribers(eventData) {
    subscribers.forEach((fn) => {
      try {
        fn(state, eventData);
      } catch (err) {
        console.error('Subscriber error:', err);
      }
    });
  }

  // Cross-tab message listener
  if (channel) {
    channel.onmessage = function (ev) {
      loadState();
      notifySubscribers(ev.data);
    };
  }

  // Fallback storage listener for cross-tab sync
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) {
        loadState();
        notifySubscribers({ action: 'STORAGE_EVENT', payload: {} });
      }
    });
  }

  // Initialize state once
  loadState();

  // Public Store API
  const PillPingStore = {
    // Subscription
    subscribe(callback) {
      if (typeof callback === 'function') {
        subscribers.push(callback);
      }
      return () => {
        const idx = subscribers.indexOf(callback);
        if (idx !== -1) subscribers.splice(idx, 1);
      };
    },

    getState() {
      return state;
    },

    // Patient Profile
    getActivePatientId() {
      return state.activePatientId || 1;
    },

    setActivePatientId(id) {
      state.activePatientId = Number(id);
      saveState(true, 'PATIENT_SWITCHED', { patientId: id });
    },

    getPatients() {
      return state.patients || [];
    },

    getCurrentPatient() {
      const id = this.getActivePatientId();
      return state.patients.find((p) => p.id === id) || state.patients[0];
    },

    // Medications
    getMedications(patientId = null) {
      const pid = patientId || this.getActivePatientId();
      return state.medications.filter((m) => m.patient_id === pid && m.active !== false);
    },

    addMedication(medData) {
      const pid = this.getActivePatientId();
      const newId = Date.now();
      const newMed = {
        id: newId,
        patient_id: pid,
        name: medData.name.trim(),
        dosage: medData.dosage.trim(),
        frequency: medData.frequency || 'Morning',
        scheduled_times: [medData.scheduled_time || '09:00'],
        food_instruction: medData.food_instruction || 'Take with water',
        remaining_pills: Number(medData.remaining_pills) || 30,
        refill_threshold: 5,
        image_url: medData.image_url || './assets/images/default-pill.svg',
        color: '#2563eb',
        active: true
      };

      state.medications.push(newMed);

      // Also add to today's schedule
      const newDose = {
        id: Date.now() + 1,
        patient_id: pid,
        medication_id: newId,
        medication_name: newMed.name,
        dosage: newMed.dosage,
        scheduled_time: medData.scheduled_time || '09:00',
        dose_status: 'pending',
        food_instruction: newMed.food_instruction,
        image_url: newMed.image_url,
        confirmed_time: null,
        date: new Date().toISOString().split('T')[0]
      };
      state.todayLogs.push(newDose);

      saveState(true, 'MEDICATION_ADDED', { medication: newMed });
      return newMed;
    },

    updateMedication(id, updateData) {
      const med = state.medications.find((m) => m.id === Number(id));
      if (med) {
        Object.assign(med, updateData);
        saveState(true, 'MEDICATION_UPDATED', { id, updateData });
      }
      return med;
    },

    deleteMedication(id) {
      const numId = Number(id);
      state.medications = state.medications.filter((m) => m.id !== numId);
      state.todayLogs = state.todayLogs.filter((l) => l.medication_id !== numId);
      saveState(true, 'MEDICATION_DELETED', { id: numId });
    },

    refillPills(medicationId, count = 30) {
      const med = state.medications.find((m) => m.id === Number(medicationId));
      if (med) {
        med.remaining_pills = (Number(med.remaining_pills) || 0) + Number(count);

        // Remove low refill alert if count is restored
        if (med.remaining_pills > med.refill_threshold) {
          state.alerts = state.alerts.filter(
            (a) => !(a.type === 'refill' && a.message.includes(med.name))
          );
        }

        saveState(true, 'PILLS_REFILLED', { medicationId, newCount: med.remaining_pills });
      }
      return med;
    },

    // Today's Doses
    getTodayDoses(patientId = null) {
      const pid = patientId || this.getActivePatientId();
      return (state.todayLogs || []).filter((d) => d.patient_id === pid);
    },

    confirmDose(doseId) {
      const dose = state.todayLogs.find((d) => d.id === Number(doseId));
      if (!dose) return null;

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      dose.dose_status = 'taken';
      dose.confirmed_time = timeFormatted;

      // Decrease pill inventory count
      const med = state.medications.find((m) => m.id === dose.medication_id);
      if (med && med.remaining_pills > 0) {
        med.remaining_pills -= 1;

        // Auto trigger low refill warning if <= threshold
        if (med.remaining_pills <= (med.refill_threshold || 5)) {
          this.createAlert({
            type: 'refill',
            title: 'Prescription Refill Warning',
            message: `${med.name} (${med.dosage}) is low: only ${med.remaining_pills} doses remaining. Refill needed soon.`,
            urgent: true
          });
        }
      }

      // Update today's confirmed count in 14-day history for the scorecard
      const todayEntry = state.historyLogs.find((h) => h.isToday);
      if (todayEntry) {
        todayEntry.confirmed = (todayEntry.confirmed || 0) + 1;
        todayEntry.pending = Math.max(0, (todayEntry.pending || 1) - 1);
        todayEntry.adherencePercentage = Math.round(
          (todayEntry.confirmed / Math.max(1, todayEntry.scheduled)) * 100
        );
      }

      saveState(true, 'DOSE_TAKEN', {
        doseId: dose.id,
        medicationName: dose.medication_name,
        time: timeFormatted
      });

      return dose;
    },

    snoozeDose(doseId, minutes = 15) {
      const dose = state.todayLogs.find((d) => d.id === Number(doseId));
      if (!dose) return null;

      dose.dose_status = 'snoozed';
      dose.snoozed_until = Date.now() + minutes * 60 * 1000;

      saveState(true, 'DOSE_SNOOZED', { doseId: dose.id, minutes });
      return dose;
    },

    alreadyTookDose(doseId) {
      return this.confirmDose(doseId);
    },

    // Missed Dose Escalation Engine
    triggerMissedEscalationDemo() {
      // Find the first pending dose and turn it into missed / escalated
      const pid = this.getActivePatientId();
      const pendingDose = (state.todayLogs || []).find(
        (d) => d.patient_id === pid && d.dose_status === 'pending'
      );

      if (pendingDose) {
        pendingDose.dose_status = 'missed';
        pendingDose.missed_escalated = true;

        // Update scorecard
        const todayEntry = state.historyLogs.find((h) => h.isToday);
        if (todayEntry) {
          todayEntry.missed = (todayEntry.missed || 0) + 1;
          todayEntry.pending = Math.max(0, (todayEntry.pending || 1) - 1);
          todayEntry.adherencePercentage = Math.round(
            (todayEntry.confirmed / Math.max(1, todayEntry.scheduled)) * 100
          );
        }

        this.createAlert({
          type: 'missed',
          title: '⚠️ Missed Dose Escalation Alert',
          message: `URGENT: ${pendingDose.medication_name} (${pendingDose.dosage}) scheduled for ${pendingDose.scheduled_time} was unconfirmed 30 minutes past due! Caregiver alert dispatched.`,
          urgent: true
        });

        saveState(true, 'MISSED_ESCALATION', { dose: pendingDose });
        return pendingDose;
      }
      return null;
    },

    // Emergency SOS
    triggerEmergencySOS() {
      const patient = this.getCurrentPatient();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const alert = this.createAlert({
        type: 'sos',
        title: '🚨 CRITICAL EMERGENCY SOS',
        message: `EMERGENCY: Patient ${patient.name} pressed the Emergency SOS button at ${timeStr}! Contact: ${patient.emergency_contact}`,
        urgent: true
      });

      saveState(true, 'EMERGENCY_SOS', { patient, time: timeStr, alert });
      return alert;
    },

    // Alerts
    getAlerts() {
      const pid = this.getActivePatientId();
      return (state.alerts || []).filter((a) => a.patient_id === pid || !a.patient_id);
    },

    createAlert(alertData) {
      const pid = this.getActivePatientId();
      const newAlert = {
        id: Date.now(),
        patient_id: pid,
        type: alertData.type || 'info',
        title: alertData.title || 'Notification',
        message: alertData.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgent: !!alertData.urgent,
        read: false
      };
      state.alerts.unshift(newAlert);
      saveState(true, 'ALERT_CREATED', { alert: newAlert });
      return newAlert;
    },

    dismissAlert(alertId) {
      state.alerts = state.alerts.filter((a) => a.id !== Number(alertId));
      saveState(true, 'ALERT_DISMISSED', { alertId });
    },

    // Today's Adherence Summary
    getTodaySummary(patientId = null) {
      const pid = patientId || this.getActivePatientId();
      const doses = (state.todayLogs || []).filter((d) => d.patient_id === pid);

      const total = doses.length;
      const completed = doses.filter((d) => d.dose_status === 'taken').length;
      const missed = doses.filter((d) => d.dose_status === 'missed').length;
      const pending = doses.filter(
        (d) => d.dose_status === 'pending' || d.dose_status === 'snoozed'
      ).length;

      // Adherence rate based on past 7 days average
      const weekly = this.getWeeklyAdherence(pid);

      return {
        total,
        completed,
        missed,
        pending,
        adherencePercentage: weekly.adherencePercentage,
        logs: doses
      };
    },

    // Weekly Adherence Scorecard Computation: (Confirmed / Scheduled) * 100
    getWeeklyAdherence(patientId = null) {
      // Past 7 days from historyLogs
      const past7 = (state.historyLogs || []).slice(-7);

      let totalConfirmed = 0;
      let totalScheduled = 0;

      past7.forEach((day) => {
        totalConfirmed += day.confirmed || 0;
        totalScheduled += day.scheduled || 0;
      });

      const adherencePercentage =
        totalScheduled > 0 ? Math.round((totalConfirmed / totalScheduled) * 100) : 100;

      return {
        adherencePercentage,
        totalConfirmed,
        totalScheduled,
        dailyBreakdown: past7
      };
    },

    // Reset Demo State
    resetToDefault() {
      state = getDefaultData();
      saveState(true, 'STATE_RESET', {});
    }
  };

  window.PillPingStore = PillPingStore;
})();
