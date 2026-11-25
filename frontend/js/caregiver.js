/**
 * PillPing: CareCircle - Caregiver Dashboard Controller
 * Real-Time Adherence Tracking, Medication Schedule Configurator, Escalation & Inventory.
 */

(function () {
  'use strict';

  function formatTime12h(timeStr) {
    if (!timeStr) return '09:00 AM';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function showToast(message, type = 'info') {
    const existing = document.getElementById('caregiver-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'caregiver-toast';
    toast.style.cssText =
      'position:fixed; bottom:24px; right:24px; z-index:9999; background:#0f172a; color:#ffffff; padding:16px 24px; border-radius:12px; font-weight:700; box-shadow:0 10px 25px rgba(0,0,0,0.25); display:flex; align-items:center; gap:12px; border-left:6px solid #10b981; animation:fadeIn 0.3s ease;';
    if (type === 'danger') toast.style.borderLeftColor = '#ef4444';
    if (type === 'warning') toast.style.borderLeftColor = '#f59e0b';

    toast.innerHTML = `<span>${type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : '✓'}</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // Refresh All Dashboard Panels
  function refreshDashboardData() {
    const store = window.PillPingStore;
    const patient = store.getCurrentPatient();

    // 1. Patient Profile Header
    if (patient) {
      const nameEl = document.getElementById('patient-display-name');
      const metaEl = document.getElementById('patient-display-meta');
      if (nameEl) nameEl.textContent = `${patient.avatar} ${patient.name}`;
      if (metaEl) {
        metaEl.textContent = `Age: ${patient.age} • Caregiver: ${patient.caregiver_name} (${patient.emergency_contact}) • Notes: ${patient.medical_notes}`;
      }
    }

    // 2. Metrics & Summary
    const summary = store.getTodaySummary();
    const totalEl = document.getElementById('stat-total-val');
    const compEl = document.getElementById('stat-completed-val');
    const pendEl = document.getElementById('stat-pending-val');
    const missEl = document.getElementById('stat-missed-val');
    const adhEl = document.getElementById('stat-adherence-val');

    if (totalEl) totalEl.textContent = summary.total;
    if (compEl) compEl.textContent = summary.completed;
    if (pendEl) pendEl.textContent = summary.pending;
    if (missEl) missEl.textContent = summary.missed;
    if (adhEl) adhEl.textContent = `${summary.adherencePercentage}%`;

    // 3. 7-Day Adherence Scorecard
    const weeklyData = store.getWeeklyAdherence();
    window.AdherenceModule.renderWeeklyScorecard(weeklyData, 'adherence-container');

    // 4. Today's Medication Schedule Table
    renderScheduleTable(summary.logs || []);

    // 5. Pill Inventory List & Refill Warnings
    renderInventoryList();

    // 6. Caregiver Alerts Feed
    renderAlertsFeed();
  }

  // Render Schedule Table
  function renderScheduleTable(doses) {
    const tbody = document.getElementById('today-schedule-tbody');
    if (!tbody) return;

    if (doses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#64748b;">No scheduled medications for today.</td></tr>`;
      return;
    }

    tbody.innerHTML = doses
      .map((d) => {
        const isTaken = d.dose_status === 'taken';
        const isMissed = d.dose_status === 'missed';
        const isSnoozed = d.dose_status === 'snoozed';

        let badgeClass = 'badge-pending';
        let badgeLabel = '⏳ Pending';
        let rowStyle = '';

        if (isTaken) {
          badgeClass = 'badge-taken';
          badgeLabel = '✓ Confirmed Taken';
        } else if (isMissed) {
          badgeClass = 'badge-missed';
          badgeLabel = '✕ Potentially Missed';
          rowStyle = 'background:#fef2f2;';
        } else if (isSnoozed) {
          badgeClass = 'badge-snoozed';
          badgeLabel = '💤 Snoozed (15m)';
        }

        const timeFormatted = formatTime12h(d.scheduled_time);

        return `
        <tr style="${rowStyle}">
          <td style="font-weight:700; color:#1e293b; font-size:1rem;">
            ${timeFormatted}
          </td>
          <td>
            <div class="table-med-cell">
              <img src="${d.image_url || './assets/images/default-pill.svg'}" class="table-med-img" alt="${d.medication_name}">
              <div>
                <div style="font-weight:800; color:#0f172a; font-size:1.05rem;">${d.medication_name}</div>
                <div style="font-size:0.85rem; color:#64748b;">${d.dosage} • ${d.food_instruction || 'With water'}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${badgeClass}" style="font-size:0.85rem; padding:6px 12px;">
              ${badgeLabel}
            </span>
          </td>
          <td style="font-size:0.95rem; font-weight:700; color:#334155;">
            ${d.confirmed_time ? `<span style="color:#059669;">✓ ${d.confirmed_time}</span>` : '<span style="color:#94a3b8;">—</span>'}
          </td>
          <td>
            ${
              !isTaken
                ? `<button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;" onclick="window.CaregiverApp.quickConfirmDose(${d.id}, '${d.medication_name}')">Mark Taken</button>`
                : `<span style="color:#059669; font-weight:700; font-size:0.85rem;">Completed</span>`
            }
          </td>
        </tr>
      `;
      })
      .join('');
  }

  // Render Inventory List
  function renderInventoryList() {
    const container = document.getElementById('inventory-list');
    if (!container) return;

    const meds = window.PillPingStore.getMedications();
    if (meds.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:16px; color:#64748b;">No medication records found.</div>`;
      return;
    }

    container.innerHTML = meds
      .map((m) => {
        const isLow = Number(m.remaining_pills) <= Number(m.refill_threshold || 5);
        const pillCount = Number(m.remaining_pills) || 0;

        return `
        <div class="inventory-item ${isLow ? 'low-stock-alert' : ''}" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #f1f5f9; background:${isLow ? '#fff1f2' : '#ffffff'}; border-radius:8px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${m.image_url || './assets/images/default-pill.svg'}" style="width:36px; height:36px; object-fit:contain;" alt="${m.name}">
            <div>
              <div style="font-weight:800; font-size:0.95rem; color:#0f172a;">${m.name} <span style="font-size:0.8rem; color:#64748b;">(${m.dosage})</span></div>
              <div style="font-size:0.8rem; color:${isLow ? '#b91c1c' : '#64748b'}; font-weight:${isLow ? '700' : '400'};">
                ${isLow ? '⚠️ Low Supply Warning: ' : ''}${pillCount} doses remaining
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}" style="font-size:0.8rem;">
              ${pillCount} Pills
            </span>
            <button class="btn ${isLow ? 'btn-danger' : 'btn-outline'}" style="padding:6px 10px; font-size:0.8rem; font-weight:700;" onclick="window.CaregiverApp.refillPills(${m.id}, '${m.name}')">
              + Refill
            </button>
            <button class="btn btn-outline" style="padding:6px 8px; font-size:0.8rem; color:#ef4444; border-color:#fecaca;" onclick="window.CaregiverApp.deleteMedication(${m.id}, '${m.name}')" title="Delete Prescription">
              🗑️
            </button>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Render Alerts Feed
  function renderAlertsFeed() {
    const container = document.getElementById('alerts-feed-list');
    if (!container) return;

    const alerts = window.PillPingStore.getAlerts();
    if (alerts.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b; font-size:0.9rem;">✅ All systems clear. No active alerts.</div>`;
      return;
    }

    container.innerHTML = alerts
      .map((a) => {
        let badgeColor = '#3b82f6';
        let icon = 'ℹ️';
        if (a.type === 'missed') {
          badgeColor = '#ef4444';
          icon = '⚠️';
        } else if (a.type === 'refill') {
          badgeColor = '#f59e0b';
          icon = '📦';
        } else if (a.type === 'sos') {
          badgeColor = '#b91c1c';
          icon = '🚨';
        }

        return `
        <div class="alert-card ${a.urgent ? 'alert-urgent' : ''}" style="background:#ffffff; border:1px solid #e2e8f0; border-left:5px solid ${badgeColor}; padding:14px; border-radius:10px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <div style="font-weight:800; font-size:0.95rem; color:#0f172a; display:flex; align-items:center; gap:6px;">
              <span>${icon}</span>
              <span>${a.title}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">${a.timestamp}</span>
              <button style="border:none; background:transparent; cursor:pointer; color:#94a3b8; font-size:1rem;" onclick="window.CaregiverApp.dismissAlert(${a.id})" title="Dismiss Alert">✕</button>
            </div>
          </div>
          <div style="font-size:0.88rem; color:#334155; line-height:1.4;">
            ${a.message}
          </div>
        </div>
      `;
      })
      .join('');
  }

  const CaregiverApp = {
    init() {
      refreshDashboardData();

      // Subscribe to real-time synchronization
      window.PillPingStore.subscribe((state, eventData) => {
        refreshDashboardData();

        if (eventData) {
          if (eventData.action === 'DOSE_TAKEN') {
            showToast(
              `Senior Confirmed: ${eventData.payload.medicationName} taken at ${eventData.payload.time}!`,
              'success'
            );
            window.VoiceService.playSuccessChime();
          } else if (eventData.action === 'EMERGENCY_SOS') {
            showToast(`CRITICAL: Senior activated Emergency SOS!`, 'danger');
            window.VoiceService.playEmergencySiren();
          } else if (eventData.action === 'MISSED_ESCALATION') {
            showToast(`ALERT: Missed dose escalation triggered!`, 'warning');
          }
        }
      });
    },

    refreshDashboardData() {
      refreshDashboardData();
      showToast('Dashboard synchronized with latest data.', 'info');
    },

    // Medication Schedule Configurator
    openAddMedicationModal() {
      const modal = document.getElementById('add-med-modal');
      if (modal) modal.style.display = 'flex';
    },

    closeAddMedicationModal() {
      const modal = document.getElementById('add-med-modal');
      if (modal) modal.style.display = 'none';
    },

    handleAddMedicationSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const medData = {
        name: formData.get('name'),
        dosage: formData.get('dosage'),
        frequency: formData.get('frequency'),
        scheduled_time: formData.get('scheduled_time'),
        remaining_pills: formData.get('remaining_pills'),
        food_instruction: formData.get('food_instruction')
      };

      window.PillPingStore.addMedication(medData);
      form.reset();
      this.closeAddMedicationModal();
      showToast(`Added prescription for ${medData.name} (${medData.dosage}).`, 'info');
    },

    deleteMedication(id, name) {
      if (confirm(`Are you sure you want to delete prescription for ${name}?`)) {
        window.PillPingStore.deleteMedication(id);
        showToast(`Prescription for ${name} deleted.`, 'info');
      }
    },

    refillPills(id, name) {
      window.PillPingStore.refillPills(id, 30);
      showToast(`Restocked +30 pills for ${name}.`, 'info');
    },

    quickConfirmDose(id, name) {
      window.PillPingStore.confirmDose(id);
      showToast(`Marked ${name} as confirmed taken.`, 'info');
    },

    dismissAlert(id) {
      window.PillPingStore.dismissAlert(id);
    },

    // Hackathon Live Demo Bar Triggers
    demoTriggerReminder() {
      const store = window.PillPingStore;
      const doses = store.getTodayDoses();
      const pending = doses.find((d) => d.dose_status === 'pending');
      const medName = pending ? pending.medication_name : 'Prescribed Medicine';

      // Broadcast trigger
      store.createAlert({
        type: 'info',
        title: '🔔 Reminder Dispatched',
        message: `Caregiver manually triggered audio chime & voice prompt for ${medName} on senior tablet.`
      });

      // Post trigger through store broadcast
      const channel = new BroadcastChannel('pillping_sync_channel');
      channel.postMessage({
        action: 'TRIGGER_REMINDER',
        payload: { medicationName: medName },
        timestamp: Date.now()
      });

      window.VoiceService.playReminderChime();
      showToast(`Sent live chime reminder for ${medName} to Senior screen.`, 'info');
    },

    demoSimulateMissed() {
      const dose = window.PillPingStore.triggerMissedEscalationDemo();
      if (dose) {
        showToast(
          `Simulated 30-min missed dose for ${dose.medication_name}. Escalated to caregiver!`,
          'danger'
        );
      } else {
        showToast('All doses are already completed or missed.', 'info');
      }
    },

    demoSimulateRefill() {
      const meds = window.PillPingStore.getMedications();
      if (meds.length > 0) {
        const target = meds[0];
        target.remaining_pills = 2; // Below 5 threshold
        window.PillPingStore.createAlert({
          type: 'refill',
          title: 'Prescription Refill Warning',
          message: `${target.name} (${target.dosage}) is critically low: only 2 pills remaining!`,
          urgent: true
        });
        showToast(`Simulated low inventory (2 pills) for ${target.name}.`, 'warning');
        refreshDashboardData();
      }
    },

    demoSimulateSOS() {
      window.PillPingStore.triggerEmergencySOS();
      showToast(`Simulated Senior Emergency SOS Siren!`, 'danger');
    },

    demoResetDatabase() {
      if (confirm('Reset demo data back to initial clean hackathon state?')) {
        window.PillPingStore.resetToDefault();
        showToast('Demo data reset to clean initial state.', 'info');
      }
    }
  };

  window.CaregiverApp = CaregiverApp;
})();
