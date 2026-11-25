/**
 * PillPing: CareCircle - Authentication & Profile Switcher Module
 * 100% Client-Side Pure Frontend Role & Profile Management
 */

(function () {
  'use strict';

  const AuthService = {
    getCurrentUser() {
      const userStr = localStorage.getItem('pillping_user');
      return userStr
        ? JSON.parse(userStr)
        : { role: 'caregiver', name: 'Ananya Rao', email: 'ananya.rao@carecircle.org' };
    },

    setCurrentUser(user) {
      localStorage.setItem('pillping_user', JSON.stringify(user));
    },

    logout() {
      localStorage.removeItem('pillping_user');
      window.location.href = './login.html';
    },

    login(role, credentials = {}) {
      let user = null;

      if (role === 'patient') {
        const patientId = Number(credentials.patientId) || 1;
        window.PillPingStore.setActivePatientId(patientId);
        const patient = window.PillPingStore.getCurrentPatient();
        user = {
          role: 'patient',
          patientId: patient.id,
          name: patient.name,
          caregiver_name: patient.caregiver_name
        };
        this.setCurrentUser(user);
        window.location.href = './patient.html';
      } else {
        // Caregiver login
        user = {
          role: 'caregiver',
          name: 'Ananya Rao',
          email: credentials.email || 'caregiver@pillping.com'
        };
        this.setCurrentUser(user);
        window.location.href = './caregiver.html';
      }

      return { success: true, user };
    },

    // 1-Click Quick Demo Login for Hackathon Judges & Evaluators
    quickLogin(role, patientId = 1) {
      if (role === 'patient') {
        this.login('patient', { patientId });
      } else {
        this.login('caregiver', { email: 'caregiver@pillping.com' });
      }
    }
  };

  window.AuthService = AuthService;
})();
