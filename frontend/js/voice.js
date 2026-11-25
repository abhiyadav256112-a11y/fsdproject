/**
 * PillPing: CareCircle - Voice Assistance & Audio Chimes
 * Built with Web Speech Synthesis API & Web Audio API (Zero external audio dependencies)
 */

(function () {
  'use strict';

  const LanguageDict = {
    en: {
      greetingMorning: 'Good Morning!',
      greetingAfternoon: 'Good Afternoon!',
      greetingEvening: 'Good Evening!',
      nextReminder: 'Your next medicine reminder',
      allDoneTitle: 'All Done For Today!',
      allDoneSub: 'You have taken all scheduled medications today. Wonderful job!',
      morning: 'Morning',
      afternoon: 'Afternoon',
      night: 'Night',
      takeWithWater: 'Take with a glass of water',
      takeWithFood: 'Take with food or breakfast',
      takeAfterFood: 'Take after meals',
      btnConfirm: 'I TOOK MY MEDICINE',
      btnSnooze: 'SNOOZE 15 MINS',
      btnAlready: '✓ Already Took It',
      readAloud: '🔊 Read Aloud',
      listening: 'Playing Voice Instructions...',
      emergencySos: 'EMERGENCY SOS',
      emergencyCalling: 'Alerting Caregiver Immediately...',
      todaySchedule: "Today's Medication Schedule",
      statusTaken: 'Taken',
      statusPending: 'Pending',
      statusMissed: 'Missed',
      statusSnoozed: 'Snoozed (15m)',
      goodJobTitle: 'Good Job, Dad!',
      goodJobSub: 'Medicine confirmed taken. Caregiver notified.',
      voiceText: (name, dosage, instruction) =>
        `Attention please! It is time for your medication: ${name}, ${dosage}. Instructions: ${instruction}. Please take it now and press the green button.`
    },
    te: {
      greetingMorning: 'శుభోదయం!',
      greetingAfternoon: 'శుభ మధ్యాహ్నం!',
      greetingEvening: 'శుభ సాయంత్రం!',
      nextReminder: 'మీ తదుపరి మందుల సమయం',
      allDoneTitle: 'నేటి మందులన్నీ పూర్తయ్యాయి!',
      allDoneSub: 'మీరు నేటి అన్ని మందులను వేసుకున్నారు. చాలా మంచిది!',
      morning: 'ఉదయం',
      afternoon: 'మధ్యాహ్నం',
      night: 'రాత్రి',
      takeWithWater: 'ఒక గ్లాసు నీళ్లతో తీసుకోండి',
      takeWithFood: 'అల్పాహారంతో లేదా భోజనంతో తీసుకోండి',
      takeAfterFood: 'భోజనం చేసిన తర్వాత తీసుకోండి',
      btnConfirm: 'నేను మందు వేసుకున్నాను',
      btnSnooze: '15 నిమిషాలు ఆపండి',
      btnAlready: '✓ ఇప్పటికే వేసుకున్నాను',
      readAloud: '🔊 వినండి (చదవండి)',
      listening: 'సూచనలు వినిపిస్తున్నాయి...',
      emergencySos: 'అత్యవసర సహాయం (SOS)',
      emergencyCalling: 'సంరక్షకుడికి అత్యవసర సమాచారం పంపుతోంది...',
      todaySchedule: 'నేటి మందుల సమయ పట్టిక',
      statusTaken: 'పూర్తయింది',
      statusPending: 'వేసుకోవాలి',
      statusMissed: 'తప్పింది',
      statusSnoozed: 'ఆపబడింది (15ని)',
      goodJobTitle: 'చాలా మంచిది, నాన్నగారు!',
      goodJobSub: 'మందులు వేసుకున్నట్లు సమాచారం సంరక్షకుడికి అందింది.',
      voiceText: (name, dosage, instruction) =>
        `నమస్కారం! మీ మందుల సమయం అయింది. మందు పేరు: ${name}, డోస్: ${dosage}. సూచన: ${instruction}. దయచేసి మందు వేసుకొని ఆకుపచ్చ బటన్ నొక్కండి.`
    },
    hi: {
      greetingMorning: 'शुभ प्रभात!',
      greetingAfternoon: 'शुभ दोपहर!',
      greetingEvening: 'शुभ संध्या!',
      nextReminder: 'आपकी अगली दवाई का समय',
      allDoneTitle: 'आज की सभी दवाइयाँ पूरी हुईं!',
      allDoneSub: 'आपने आज की सभी निर्धारित दवाइयाँ ले ली हैं। बहुत बढ़िया!',
      morning: 'सुबह',
      afternoon: 'दोपहर',
      night: 'रात',
      takeWithWater: 'एक गिलास पानी के साथ लें',
      takeWithFood: 'नाश्ते या भोजन के साथ लें',
      takeAfterFood: 'भोजन करने के बाद लें',
      btnConfirm: 'मैंने दवाई ले ली है',
      btnSnooze: '15 मिनट के लिए रोकें',
      btnAlready: '✓ पहले ही ले ली',
      readAloud: '🔊 सुनें (आवाज़)',
      listening: 'निर्देश सुनाए जा रहे हैं...',
      emergencySos: 'आपातकालीन सहायता (SOS)',
      emergencyCalling: 'देखभालकर्ता को आपातकालीन सूचना भेजी जा रही है...',
      todaySchedule: 'आज का दवाई समय-सारिणी',
      statusTaken: 'ले ली',
      statusPending: 'बाकी है',
      statusMissed: 'छूट गई',
      statusSnoozed: 'स्नूज़ (15 मिनट)',
      goodJobTitle: 'शाबाश, पिताजी!',
      goodJobSub: 'दवाई लेने की पुष्टि देखभालकर्ता को भेज दी गई है।',
      voiceText: (name, dosage, instruction) =>
        `नमस्ते! आपकी दवाई लेने का समय हो गया है. दवाई का नाम: ${name}, ख़ुराक: ${dosage}. निर्देश: ${instruction}. कृपया दवाई लें और हरा बटन दबाएं.`
    }
  };

  let currentLanguage = localStorage.getItem('pillping_lang') || 'en';
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const VoiceService = {
    get currentLanguage() {
      return currentLanguage;
    },

    setLanguage(lang) {
      if (LanguageDict[lang]) {
        currentLanguage = lang;
        localStorage.setItem('pillping_lang', lang);
      }
    },

    getTranslation(key) {
      const dict = LanguageDict[currentLanguage] || LanguageDict.en;
      return dict[key] || LanguageDict.en[key] || key;
    },

    // Speaks medication prompt aloud using Web Speech Synthesis
    speakMedicationPrompt(name, dosage, instruction, onEnd) {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser.');
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel(); // Stop any pending speech

      const dict = LanguageDict[currentLanguage] || LanguageDict.en;
      const textToSpeak = dict.voiceText(name, dosage, instruction);

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9; // Clear, comfortable tempo for elderly
      utterance.pitch = 1.0;

      // Map language tags
      const langMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
      utterance.lang = langMap[currentLanguage] || 'en-US';

      // Pick matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.startsWith(currentLanguage));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    },

    // Synthesizes pleasant musical chime on dose taken
    playSuccessChime() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major arpeggio)
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.5);
        });
      } catch (err) {
        console.warn('Audio chime error:', err);
      }
    },

    // Attention reminder chime for scheduled dose
    playReminderChime() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        [440, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.25);

          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.25 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + idx * 0.25);
          osc.stop(ctx.currentTime + idx * 0.25 + 0.45);
        });
      } catch (err) {
        console.warn('Reminder audio chime error:', err);
      }
    },

    // Emergency Siren for SOS button
    playEmergencySiren() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        const now = ctx.currentTime;

        // Oscillate between 700Hz and 1200Hz
        for (let i = 0; i < 4; i++) {
          osc.frequency.setValueAtTime(700, now + i * 0.4);
          osc.frequency.linearRampToValueAtTime(1200, now + i * 0.4 + 0.2);
          osc.frequency.linearRampToValueAtTime(700, now + i * 0.4 + 0.4);
        }

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.8);
      } catch (err) {
        console.warn('Emergency siren audio error:', err);
      }
    }
  };

  // Preload voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  window.VoiceService = VoiceService;
})();
