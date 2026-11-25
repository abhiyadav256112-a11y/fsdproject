/**
 * PillPing: CareCircle - Senior Smart Reminder & Confirmation Controller
 * High-Contrast, Touch-Optimized UI for Seniors with Audio Feedback & Real-Time Sync.
 */

(function () {
  'use strict';

  let activeDose = null;
  let successStateTimeout = null;

  function formatTime12h(timeStr) {
    if (!timeStr) return '10:00 AM';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function getMealPeriodLabel(timeStr) {
    const V = window.VoiceService;
    if (!timeStr) return V.getTranslation('morning');
    const h = parseInt(timeStr.split(':')[0], 10);
    if (h < 12) return V.getTranslation('morning');
    if (h < 17) return V.getTranslation('afternoon');
    return V.getTranslation('night');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText =
      'background:#0f172a; color:#ffffff; padding:16px 24px; border-radius:12px; margin-top:10px; font-weight:700; font-size:1.1rem; box-shadow:0 10px 25px rgba(0,0,0,0.2); border-left:6px solid #10b981;';
    if (type === 'danger') toast.style.borderLeftColor = '#ef4444';
    if (type === 'warning') toast.style.borderLeftColor = '#f59e0b';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // Load and Render the Senior Screen
  function loadSeniorScreen() {
    const store = window.PillPingStore;
    const patient = store.getCurrentPatient();
    const doses = store.getTodayDoses();

    // Update Header Patient Info
    const subgreeting = document.getElementById('senior-subgreeting-text');
    if (subgreeting && patient) {
      subgreeting.textContent = `${patient.name} • Caregiver: ${patient.caregiver_name}`;
    }

    // Determine Active Hero Dose
    // Priority: First pending or snoozed dose
    const pendingDoses = doses.filter(
      (d) => d.dose_status === 'pending' || d.dose_status === 'snoozed'
    );

    if (pendingDoses.length > 0) {
      activeDose = pendingDoses[0];
      renderHeroReminder(activeDose, false);
    } else {
      activeDose = null;
      renderHeroReminder(null, true);
    }

    renderScheduleList(doses);
  }

  // Render the Oversized Hero Reminder Card
  function renderHeroReminder(dose, allCompleted = false) {
    const heroCard = document.getElementById('hero-reminder-card');
    if (!heroCard) return;

    const V = window.VoiceService;

    if (allCompleted || !dose) {
      heroCard.className = 'hero-reminder-card all-done';
      heroCard.innerHTML = `
        <div class="hero-tag" style="background:#dcfce7; color:#15803d; font-size:1.15rem; font-weight:800; padding:8px 18px; border-radius:999px; display:inline-block;">
          ✅ ${V.getTranslation('allDoneTitle')}
        </div>
        <div class="hero-time" style="font-size:2.8rem; color:#15803d; margin: 24px 0 12px 0; font-weight:900;">
          All Done For Today!
        </div>
        <p style="font-size:1.35rem; color:#475569; font-weight:700; line-height:1.6; max-width:600px; margin:0 auto;">
          ${V.getTranslation('allDoneSub')}
        </p>
      `;
      return;
    }

    heroCard.className = 'hero-reminder-card glow';
    const timeVal = formatTime12h(dose.scheduled_time || '10:00');
    const periodLabel = getMealPeriodLabel(dose.scheduled_time);

    heroCard.innerHTML = `
      <div class="hero-tag">⏰ ${V.getTranslation('nextReminder')}</div>
      <div class="hero-time">${timeVal}</div>
      <div class="hero-time-period">${periodLabel}</div>

      <!-- Pill Identifier Visual -->
      <div class="hero-pill-display">
        <img src="${dose.image_url || './assets/images/default-pill.svg'}" alt="${dose.medication_name}" class="hero-pill-img">
        <div class="hero-med-details">
          <div class="hero-med-name">${dose.medication_name}</div>
          <div class="hero-med-dosage">${dose.dosage}</div>
        </div>
      </div>

      <div class="hero-instruction-box">
        <span>💊 ${dose.food_instruction || V.getTranslation('takeWithWater')}</span>
        <button class="btn-read-aloud" id="btn-read-aloud-hero">
          ${V.getTranslation('readAloud')}
        </button>
      </div>

      <!-- Tactile 64px+ Confirmation Actions -->
      <div class="hero-actions">
        <button class="btn-giant-confirm" id="btn-hero-take-med">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${V.getTranslation('btnConfirm')}</span>
        </button>

        <div class="secondary-actions-row">
          <button class="btn-snooze-action" id="btn-hero-snooze">
            💤 ${V.getTranslation('btnSnooze')}
          </button>
          <button class="btn-already-action" id="btn-hero-already">
            ${V.getTranslation('btnAlready')}
          </button>
        </div>
      </div>
    `;

    // Event Listeners
    const btnTake = document.getElementById('btn-hero-take-med');
    if (btnTake) {
      btnTake.onclick = () => SeniorApp.handleTakeMedicine(dose.id, dose.medication_name);
    }

    const btnSnooze = document.getElementById('btn-hero-snooze');
    if (btnSnooze) {
      btnSnooze.onclick = () => SeniorApp.handleSnooze(dose.id, dose.medication_name);
    }

    const btnAlready = document.getElementById('btn-hero-already');
    if (btnAlready) {
      btnAlready.onclick = () => SeniorApp.handleAlreadyTook(dose.id, dose.medication_name);
    }

    const btnRead = document.getElementById('btn-read-aloud-hero');
    if (btnRead) {
      btnRead.onclick = () =>
        SeniorApp.handleReadAloud(
          dose.medication_name,
          dose.dosage,
          dose.food_instruction || 'Take with water'
        );
    }
  }

  // Render Calming Green Success State
  function renderCalmingSuccessState(medName, confirmedTime) {
    const heroCard = document.getElementById('hero-reminder-card');
    if (!heroCard) return;

    const V = window.VoiceService;
    heroCard.className = 'hero-reminder-card success-calming';
    heroCard.style.cssText =
      'background: linear-gradient(135deg, #059669 0%, #10b981 100%); color:#ffffff; padding:48px 32px; border-radius:24px; text-align:center; box-shadow:0 20px 40px rgba(16, 185, 129, 0.4);';

    heroCard.innerHTML = `
      <div style="width:84px; height:84px; background:rgba(255,255,255,0.25); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="font-size:2.6rem; font-weight:900; margin-bottom:12px; letter-spacing:-0.5px;">
        ${V.getTranslation('goodJobTitle')}
      </h2>
      <p style="font-size:1.4rem; font-weight:700; color:#ecfdf5; margin-bottom:8px;">
        ${medName} taken at ${confirmedTime}
      </p>
      <p style="font-size:1.15rem; color:#d1fae5; font-weight:600;">
        ${V.getTranslation('goodJobSub')}
      </p>
    `;

    // Transition back to timetable or next pending after 4 seconds
    clearTimeout(successStateTimeout);
    successStateTimeout = setTimeout(() => {
      loadSeniorScreen();
    }, 3800);
  }

  // Render Schedule Timetable List
  function renderScheduleList(doses) {
    const listEl = document.getElementById('schedule-card-list');
    if (!listEl) return;

    const V = window.VoiceService;

    if (doses.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b; font-size:1.2rem;">No medications scheduled.</div>`;
      return;
    }

    listEl.innerHTML = doses
      .map((d) => {
        const isTaken = d.dose_status === 'taken';
        const isMissed = d.dose_status === 'missed';
        const isSnoozed = d.dose_status === 'snoozed';

        let statusClass = 'schedule-status-pending';
        let statusBadge = V.getTranslation('statusPending');
        let statusIcon = '⏳';

        if (isTaken) {
          statusClass = 'schedule-status-taken';
          statusBadge = `${V.getTranslation('statusTaken')} (${d.confirmed_time || 'On-Time'})`;
          statusIcon = '✓';
        } else if (isMissed) {
          statusClass = 'schedule-status-missed';
          statusBadge = V.getTranslation('statusMissed');
          statusIcon = '✕';
        } else if (isSnoozed) {
          statusClass = 'schedule-status-snoozed';
          statusBadge = V.getTranslation('statusSnoozed');
          statusIcon = '💤';
        }

        const timeFormatted = formatTime12h(d.scheduled_time);

        return `
        <div class="schedule-card ${statusClass}">
          <div class="schedule-card-time">${timeFormatted}</div>
          <div class="schedule-card-med">
            <img src="${d.image_url || './assets/images/default-pill.svg'}" class="schedule-pill-icon" alt="${d.medication_name}">
            <div>
              <div class="schedule-med-title">${d.medication_name}</div>
              <div class="schedule-med-sub">${d.dosage} • ${d.food_instruction || 'With water'}</div>
            </div>
          </div>
          <div class="schedule-status-pill ${statusClass}">
            <span>${statusIcon}</span>
            <span>${statusBadge}</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Senior App Public Actions
  const SeniorApp = {
    init() {
      loadSeniorScreen();

      // Subscribe to real-time store changes
      window.PillPingStore.subscribe((state, eventData) => {
        // If caregiver triggered reminder, play chime
        if (eventData && eventData.action === 'TRIGGER_REMINDER') {
          window.VoiceService.playReminderChime();
          showToast('🔔 Reminder from your caregiver: Please take your medicine!', 'info');
        }
        loadSeniorScreen();
      });
    },

    loadSeniorScreen() {
      loadSeniorScreen();
    },

    // 1-Tap Dose Confirmation
    handleTakeMedicine(doseId, medName) {
      window.VoiceService.playSuccessChime();
      const updated = window.PillPingStore.confirmDose(doseId);
      const timeStr = updated ? updated.confirmed_time : new Date().toLocaleTimeString();
      renderCalmingSuccessState(medName, timeStr);
      showToast(`✓ Confirmed: ${medName} recorded.`, 'info');
    },

    handleSnooze(doseId, medName) {
      window.PillPingStore.snoozeDose(doseId, 15);
      showToast(`💤 ${medName} snoozed for 15 minutes.`, 'warning');
      loadSeniorScreen();
    },

    handleAlreadyTook(doseId, medName) {
      this.handleTakeMedicine(doseId, medName);
    },

    handleReadAloud(name, dosage, instruction) {
      const btn = document.getElementById('btn-read-aloud-hero');
      if (btn) {
        btn.textContent = '🔊 Speaking...';
        btn.style.opacity = '0.7';
      }

      window.VoiceService.speakMedicationPrompt(name, dosage, instruction, () => {
        if (btn) {
          btn.textContent = window.VoiceService.getTranslation('readAloud');
          btn.style.opacity = '1';
        }
      });
    },

    handleEmergencySOS() {
      window.VoiceService.playEmergencySiren();
      window.PillPingStore.triggerEmergencySOS();

      const patient = window.PillPingStore.getCurrentPatient();
      const caregiverName = patient ? patient.caregiver_name : 'Ananya Rao';
      const contact = patient ? patient.emergency_contact : '+91 98765 12345';

      alert(`🚨 EMERGENCY SOS DISPATCHED!\n\nYour primary caregiver (${caregiverName}) has been alerted immediately at ${contact}.\nEmergency siren sounded.`);
      showToast(`🚨 SOS: Caregiver ${caregiverName} alerted!`, 'danger');
    }
  };

  window.SeniorApp = SeniorApp;
})();
