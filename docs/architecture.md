# CareNest AI — System Architecture & Technical Specification

**Project Title**: CareNest AI — AI-Powered Smart Healthcare Companion  
**Domain**: HealthTech, Ambient Assisted Living (AAL), Edge & Cloud Computing, Computer Vision OCR  

---

## 1. Executive Summary & Problem Statement

Elderly adults, particularly those aged 65 and above, frequently suffer from chronic age-related ailments (e.g., Type 2 Diabetes, Hypertension, Coronary Artery Disease) requiring polypharmacy regimens (3 to 8 distinct prescription medications taken at varying intervals throughout the day).

Cognitive decline, age-related vision impairment (presbyopia), memory slips, complex prescription handwriting, and isolated living conditions frequently result in:
1. **Medication Non-Adherence**: Omitted doses causing dangerous therapeutic troughs.
2. **Double Dosing / Accidental Overdose**: Elderly forgetting whether they took a morning dose and repeating it.
3. **Emergency Caregiver Blind Spots**: Family caregivers residing remotely having zero visibility into whether morning doses were taken or if an emergency fall has occurred.

**CareNest AI** resolves these challenges through an elderly-accessible smart healthcare ecosystem combining tactile digital interaction, automated prescription OCR parsing, offline-first IndexedDB resilience, conversational context-aware guidance, remote caregiver monitoring, and a Hardware Abstraction Layer for physical Raspberry Pi smart-box integration.

---

## 2. Multi-Tier System Architecture

CareNest AI is organized as a decoupled, multi-tier architecture:

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (FRONTEND)                          |
|                                                                                   |
|  [ React 18 SPA + Vite + TypeScript + Tailwind CSS + Framer Motion ]              |
|                                                                                   |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   Elderly Dashboard   |  |  Prescription Scanner |  |  Caregiver Portal     |  |
|  |   - Tactile Dose Ring |  |  - Camera Preview     |  |  - Remote Compliance  |  |
|  |   - Big TAKEN Button  |  |  - OCR Text Extraction|  |  - Live Schedule Feed |  |
|  |   - Web Audio Chimes  |  |  - Entity Validation  |  |  - SOS Alert Feed     |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   Ask CareNest AI     |  |  Pill ID Assistant    |  |  Bilingual i18n       |  |
|  |   - Web Speech API STT|  |  - Color/Shape Inspect|  |  - English & Telugu   |  |
|  |   - TTS Voice Readout |  |  - Reference Match    |  |  - 3-Level Text Scale |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|                                                                                   |
|  [ IndexedDB Local Cache & Offline Sync Queue (idb) ]                             |
+-----------------------------------------------------------------------------------+
                                        | (HTTPS / REST API / JSON)
                                        v
+-----------------------------------------------------------------------------------+
|                              LOGIC TIER (FASTAPI REST API)                        |
|                                                                                   |
|  [ FastAPI Framework + Python 3.13 + Pydantic v2 + JWT Auth + CORS Middleware ]   |
|                                                                                   |
|  +-------------------+  +-------------------+  +-------------------------------+  |
|  |  Auth & RBAC      |  |  Medication &     |  |  Computer Vision & OCR        |  |
|  |  - Elderly Role   |  |  Schedule Engine  |  |  - PIL Image Enhancement      |  |
|  |  - Caregiver Link |  |  - Dose Calculator|  |  - Tesseract / Heuristic Match|  |
|  |  - JWT Bearer     |  |  - Event History  |  |  - Pill Feature Classifier    |  |
|  +-------------------+  +-------------------+  +-------------------------------+  |
|  +-------------------+  +-------------------+  +-------------------------------+  |
|  |  Caregiver Hub    |  |  Hardware HAL     |  |  CareNest AI Advisor Engine   |  |
|  |  - Patient Stats  |  |  - Mock GPIO Mode |  |  - Grounded Patient Schedule  |  |
|  |  - SOS Dispatch   |  |  - RPi Button In  |  |  - Bilingual Knowledge Engine |  |
|  |  - Remote Audit   |  |  - RGB LED Out    |  |  - Optional Gemini/OpenAI API |  |
|  +-------------------+  +-------------------+  +-------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
                  +---------------------+---------------------+
                  |                                           |
                  v                                           v
+-----------------------------------+     +-----------------------------------------+
|     LOCAL / CLOUD DATABASE        |     |      FUTURE PHYSICAL HARDWARE (RPI)     |
|                                   |     |                                         |
|  - SQLite (Local zero-setup demo) |     |  - Raspberry Pi 4 Model B               |
|  - Supabase PostgreSQL (Cloud)    |     |  - GPIO 17: Green Tactile TAKEN Button  |
|  - Row Level Security (RLS)       |     |  - GPIO 27: Yellow REMIND LATER Button  |
|  - 8 Relational Tables            |     |  - GPIO 22: Red SOS Emergency Button    |
|  - Private Uploads Storage        |     |  - GPIO 23/24: Dual-Channel RGB LED     |
+-----------------------------------+     |  - GPIO 25: Active Piezo Buzzer         |
                                          |  - Raspberry Pi Camera Module v2 / USB  |
                                          +-----------------------------------------+
```

---

## 3. Data Flow Diagrams

### 3.1 Medication Taken Workflow
```
[Elderly User] ---> Sees Due Dose Card on Dashboard
       |
       +---> Taps Big Green "TAKEN" Button (or presses GPIO_17 physical pushbutton)
                |
                +---> Web Audio Synthesizer plays success chime
                |
                +---> Check Network Status:
                        |
                        +--[ ONLINE ]--> POST /api/events/taken
                        |                  |-> Database stores event (timestamp, status='taken')
                        |                  |-> Dashboard updates adherence circle
                        |                  |-> Caregiver portal updates instantly
                        |
                        +--[ OFFLINE ]-> Save event in IndexedDB 'sync_queue'
                                           |-> Optimistically updates local screen to 'Taken'
                                           |-> When window 'online' event fires -> POST /api/sync/batch
```

### 3.2 Prescription OCR Scanner Workflow
```
[User] ---> Captures / Uploads Prescription Image
   |
   v
[Frontend] ---> POST /api/prescriptions/upload (multipart/form-data)
   |
   v
[FastAPI Backend]
   |-> Preprocesses image (Grayscale conversion, 1.8x contrast enhancement, sharpening)
   |-> Tesseract OCR / Heuristic regex pipeline extracts:
         - Medicine names
         - Potencies (e.g., 500mg, 40mg)
         - Frequencies (OD, BD, TDS, Twice daily)
         - Meal relations (before/after meals)
   |-> Injects Mandatory Medical Disclaimer:
         "Prescription information may contain OCR errors. Please verify all details..."
   |
   v
[Frontend Review Screen]
   |-> User reviews each detected medicine in an editable card
   |-> User confirms correctness and taps "Confirm & Add to My Medicines"
   |-> POST /api/prescriptions/confirm commits records to database
```

---

## 4. Hardware Abstraction Layer (HAL) Specification

To enable flexible testing on development environments while facilitating immediate deployment to a physical Raspberry Pi enclosure:

1. **Software Abstraction**: All hardware interactions are routed through `backend/app/services/hardware_service.py`.
2. **Simulation Mode**: When running in a development environment without physical GPIO pins, the mock hardware simulator exposes `/api/hardware/status` and `/api/hardware/button` endpoints, enabling verification of physical button presses, LED feedback, and buzzer alarms directly from the UI.
3. **GPIO Pin Assignment**:
   - `GPIO 17`: Input, Pull-up resistor -> Tactile Green Pushbutton ("TAKEN")
   - `GPIO 27`: Input, Pull-up resistor -> Tactile Yellow Pushbutton ("REMIND LATER")
   - `GPIO 22`: Input, Pull-up resistor -> Tactile Red Pushbutton ("SOS EMERGENCY")
   - `GPIO 23`: Output -> Green LED (Idle / Normal state)
   - `GPIO 24`: Output -> Red / Yellow LED (Dose Due / SOS Flash)
   - `GPIO 25`: Output -> Piezo Buzzer (Chime / Alarm pulses)

