/**
 * PillPing: CareCircle - Weekly Adherence Scorecard Module
 * Formula: Adherence % = (Confirmed Doses / Scheduled Doses) * 100
 * Renders circular rate indicator, breakdown formula, and 7-day visual dot strip.
 */

(function () {
  'use strict';

  const AdherenceModule = {
    fetchWeeklyData(patientId = null) {
      return window.PillPingStore.getWeeklyAdherence(patientId);
    },

    fetchTodaySummary(patientId = null) {
      return window.PillPingStore.getTodaySummary(patientId);
    },

    renderWeeklyScorecard(data, containerId = 'adherence-container') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const rate = Number(data.adherencePercentage) || 0;
      const confirmed = Number(data.totalConfirmed) || 0;
      const scheduled = Number(data.totalScheduled) || 0;

      let rateColor = '#10b981'; // Green
      if (rate < 70) rateColor = '#ef4444'; // Red
      else if (rate < 85) rateColor = '#f59e0b'; // Amber

      const breakdown = data.dailyBreakdown || [];

      container.innerHTML = `
        <div class="adherence-hero" style="border-left: 6px solid ${rateColor};">
          <div class="adherence-rate-circle" style="--adherence-percent: ${rate};">
            <div class="adherence-rate-value" style="color: ${rateColor};">${rate}%</div>
          </div>

          <div class="adherence-info">
            <h4 style="font-size:1.15rem; font-weight:800; color:var(--text-main);">7-Day Medication Adherence</h4>
            <p style="font-size:0.92rem; color:var(--text-muted); margin: 6px 0;">
              <strong>${confirmed}</strong> confirmed on-time doses out of <strong>${scheduled}</strong> scheduled doses over the past 7 days.
            </p>
            <div class="adherence-formula" style="font-size:0.85rem; background:#f1f5f9; padding:6px 12px; border-radius:6px; display:inline-block; margin-top:4px;">
              Formula: (${confirmed} Confirmed ÷ ${scheduled} Scheduled) × 100 = <strong style="color:${rateColor};">${rate}%</strong>
            </div>
          </div>
        </div>

        <!-- 7-Day Visual Calendar Strip -->
        <div class="adherence-week-strip" style="display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; margin-top:16px;">
          ${breakdown
            .map((day) => {
              let dayColor = '#10b981';
              if (day.missed > 0) dayColor = '#ef4444';
              else if (day.pending > 0 && !day.isToday) dayColor = '#f59e0b';

              const takenDots = Array(Math.min(6, day.confirmed || 0))
                .fill(0)
                .map(() => `<span class="dose-dot taken" title="Confirmed Dose"></span>`)
                .join('');
              const missedDots = Array(Math.min(6, day.missed || 0))
                .fill(0)
                .map(() => `<span class="dose-dot missed" title="Missed Dose"></span>`)
                .join('');
              const pendingDots = Array(Math.min(6, day.pending || 0))
                .fill(0)
                .map(() => `<span class="dose-dot pending" title="Pending Dose"></span>`)
                .join('');

              return `
              <div class="week-day-tile ${day.isToday ? 'today' : ''}" style="text-align:center; padding:10px 4px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                <div class="day-name" style="font-size:0.8rem; font-weight:700; color:#64748b;">${day.dayName}${day.isToday ? ' (Today)' : ''}</div>
                <div class="day-rate" style="font-size:1.1rem; font-weight:800; color: ${dayColor}; margin: 4px 0;">${day.adherencePercentage}%</div>
                <div class="day-dots" style="display:flex; justify-content:center; gap:3px; flex-wrap:wrap; min-height:12px;">
                  ${takenDots}${missedDots}${pendingDots}
                </div>
              </div>
            `;
            })
            .join('')}
        </div>

        <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:12px; font-size:0.82rem; color:var(--text-muted);">
          <span style="display:flex; align-items:center; gap:5px;"><span class="dose-dot taken"></span> Confirmed</span>
          <span style="display:flex; align-items:center; gap:5px;"><span class="dose-dot missed"></span> Missed</span>
          <span style="display:flex; align-items:center; gap:5px;"><span class="dose-dot pending"></span> Pending</span>
        </div>
      `;
    }
  };

  window.AdherenceModule = AdherenceModule;
})();
