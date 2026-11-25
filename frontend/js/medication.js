/**
 * PillPing: CareCircle - Medication Service (Client-Side Wrapper)
 * Backwards-compatible service proxy mapping to PillPingStore.
 */

(function () {
  'use strict';

  const MedicationService = {
    getTodayDoses(patientId = null) {
      return { doses: window.PillPingStore.getTodayDoses(patientId) };
    },

    getAllMedications(patientId = null) {
      return { medications: window.PillPingStore.getMedications(patientId) };
    },

    addMedication(medData) {
      return { success: true, medication: window.PillPingStore.addMedication(medData) };
    },

    updateMedication(id, updateData) {
      return { success: true, medication: window.PillPingStore.updateMedication(id, updateData) };
    },

    deleteMedication(id) {
      window.PillPingStore.deleteMedication(id);
      return { success: true };
    },

    refillPills(id, amount = 30) {
      return { success: true, medication: window.PillPingStore.refillPills(id, amount) };
    },

    getPatientProfile(patientId = null) {
      return { patient: window.PillPingStore.getCurrentPatient() };
    },

    triggerPatientSOS() {
      return { success: true, alert: window.PillPingStore.triggerEmergencySOS() };
    }
  };

  window.MedicationService = MedicationService;
})();
