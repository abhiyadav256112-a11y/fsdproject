# PillPing: CareCircle 💊⏰🩺

> **Senior-Friendly Medication Management & Real-Time Remote Adherence Monitoring**  
> Pure Frontend Implementation — Clean, Minimal, Accessible, and 100% Self-Contained.

---

## 🌟 Overview
**PillPing: CareCircle** is a senior-friendly medication management web application that bridges the gap between elderly patients and their family caregivers. It empowers seniors to stay on track with their medications through high-contrast, large-button, multi-language voice-assisted reminders, while providing family caregivers with an executive real-time adherence dashboard, automatic missed-dose escalations, and low-refill alerts.

The application is built **100% on the frontend** using native browser APIs (`localStorage`, `BroadcastChannel`, Web Audio API, Web Speech Synthesis). It runs instantly in any modern web browser with **zero backend server dependencies**.

---

## 🏗️ Architecture & Real-Time Sync

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PURE FRONTEND LAYER                          │
│  [ Elderly Patient Interface ]     [ Caregiver Live Dashboard ] │
│  - Extra-Large 64px+ Buttons       - Instant Cross-Window Sync  │
│  - 1-Tap "I Took My Medicine"       - 7-Day Adherence Scorecard │
│  - Calming Green Success State     - 30-Min Missed Escalations  │
│  - Web Audio Chimes & Siren        - Low Refill Inventory Alert │
│  - Telugu, Hindi & English Speech  - Schedule Configurator      │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               UNIFIED REACTIVE STORE (store.js)                 │
│  - BroadcastChannel ('pillping_sync_channel') + Storage Events  │
│  - LocalStorage State Persistence (Patients, Meds, Logs, Alerts)│
│  - Exact Adherence Formula: (Confirmed / Scheduled) × 100       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Core Features (Must-Have Implemented)

1. **Elderly-Friendly High-Contrast UI**: Extra-large typography ($24\text{px} - 38\text{px}$), WCAG AAA contrast ratio, tactile pill color-coding, and $\ge 64\text{px} \times 64\text{px}$ tap targets designed for seniors with tremors or visual limitations.
2. **Medication Schedule Configurator**: Allows setting medicine name, dosage, frequency (Morning, Afternoon, Night, Twice Daily), with/without food instructions, and refill counts via a clean caregiver modal.
3. **One-Tap Dose Confirmation**: Oversized tactile **"I TOOK MY MEDICINE"** button with Web Audio musical chime, immediate pill count decrement, and screen transition to a calming green state: *"Good Job, Dad! Medicine taken at 10:01 AM"*. Includes **"SNOOZE 15 MINS"** and **"✓ Already Took It"** retroactive options.
4. **Caregiver Oversight Portal**: Real-time view of daily adherence, completed doses, pending medications, and pill inventory counts. Synchronized live across windows using `BroadcastChannel`.
5. **Missed Dose Escalation Alert**: 30-minute grace window timer and 1-click simulation trigger that highlights unconfirmed doses in red on the caregiver portal with urgent alerts and warnings.
6. **Weekly Adherence Scorecard**: Computes medication compliance percentage:
   $$\text{Adherence \%} = \left(\frac{\text{Confirmed Doses}}{\text{Scheduled Doses}}\right) \times 100$$
   Accompanied by a 7-day visual calendar strip with color-coded compliance dots.

---

## 🚀 Stretch Features (Included)

- **Voice Read-Aloud Prompt**: Spoken announcements in **English**, **తెలుగు (Telugu)**, and **हिन्दी (Hindi)** using the browser's native **Web Speech Synthesis API**.
- **Pill Bottle / Pill Photo Identifier**: Clear visual SVG pill diagrams (Amlodipine, Metformin, Aspirin, Atorvastatin) indicating pill shape, color, and dosage.
- **Prescription Refill Warning**: Automatically warns caregivers when medication falls $\le 5$ pills, with an instant **"+ Refill 30 Pills"** action.
- **Emergency SOS Quick Dial**: Prominent red emergency SOS button that triggers an audible audio siren and sends an urgent high-priority red alert banner to the caregiver portal.
- **Live Side-by-Side Split Demo View**: Built-in dual-view screen (`split-demo.html`) displaying the Senior view and Caregiver view side-by-side in one tab for seamless hackathon presentations.

---

## 🖥️ Screen Navigation

| Page | Relative Path | Description |
| :--- | :--- | :--- |
| **Live Split-Screen Demo** | [`./frontend/split-demo.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/split-demo.html) | Side-by-side dual view for instant presentation |
| **Home Portal** | [`./frontend/index.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/index.html) | Main landing page & feature walkthrough |
| **Elderly Patient Interface** | [`./frontend/patient.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/patient.html) | High-contrast, tactile reminder screen |
| **Caregiver Dashboard** | [`./frontend/caregiver.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/caregiver.html) | Real-time adherence scorecard & schedule configurator |
| **Profile Switcher** | [`./frontend/login.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/login.html) | 1-Click demo logins for Patients and Caregiver |

---

## 🎯 Hackathon Live Demonstration Walkthrough

To demonstrate the full bidirectional workflow to judges:

1. **Option A: Side-by-Side Dual View (Easiest)**
   - Open [`frontend/split-demo.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/split-demo.html) in your browser.
2. **Option B: Two Separate Windows**
   - Window 1: [`frontend/patient.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/patient.html)
   - Window 2: [`frontend/caregiver.html`](file:///c:/Users/abhiy/OneDrive/Desktop/fsd%20project/frontend/caregiver.html)

### Demonstration Steps:
1. **One-Tap Confirmation & Real-Time Sync**:
   - On the Senior Screen, click **"I TOOK MY MEDICINE"** for Amlodipine.
   - **Observe**: An audible musical chime sounds, the card turns calming green (*"Good Job, Dad!"*), and the Caregiver Dashboard on the other screen immediately updates the **Completed** count and checkmarks the dose with a timestamp!
2. **Multi-Language Voice Read-Aloud**:
   - Switch language to **తెలుగు (Telugu)** or **हिन्दी (Hindi)**.
   - Click **"🔊 Read Aloud"**. The Web Speech API speaks the instructions clearly in the selected language.
3. **Missed Dose Escalation**:
   - In the Caregiver Dashboard's **Hackathon Live Demo Bar**, click **"⚠️ Simulate 30-Min Missed Escalation"**.
   - **Observe**: The pending dose turns red as "Potentially Missed", an urgent alert banner appears in the caregiver feed, and an audio notification sounds.
4. **Low Refill Warning & Restock**:
   - Notice Amlodipine highlighted in red with 4 pills remaining ($\le 5$ pills threshold).
   - Click **"+ Refill"** to immediately add 30 pills to inventory and dismiss the alert.
5. **Emergency SOS Siren**:
   - On the Senior Screen, click **"🚨 SOS"**.
   - An emergency audio siren sounds and an urgent alert modal notifies the caregiver immediately.
6. **Medication Schedule Configurator**:
   - In Caregiver Portal, click **"+ Add Medication"**, fill in name, dosage, frequency, reminder time, and submit.
   - The new medication appears immediately in today's timetable and inventory!

---

## 🛠️ Technology Stack
- **Frontend Architecture**: Vanilla HTML5, CSS3 Custom Properties, ES6+ JavaScript
- **State Management & Multi-Window Sync**: Native `BroadcastChannel` API + `localStorage`
- **Audio & Speech Engine**: Native HTML5 Web Audio API (Oscillator Synthesizer) & Web Speech Synthesis API
- **Accessibility**: WCAG AAA high-contrast colors, 64px+ tactile tap targets, zero swipe/pinch requirements
