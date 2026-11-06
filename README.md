# CareNest AI — AI-Powered Smart Healthcare Companion

[![Live Demo](https://img.shields.io/badge/Live%20Demo-carenest--beta.vercel.app-0E8A8A.svg?style=for-the-badge&logo=vercel)](https://carenest-beta.vercel.app/#/login)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> An elderly-friendly smart healthcare companion designed to assist senior adults with medication management, daily dose reminders, prescription scanning via OCR, pill identification assistance, bilingual voice interaction (English & Telugu), remote caregiver monitoring, and emergency SOS alerts.

---

## 🌐 Live Production Deployment

> 🚀 **Direct App Access**: **[https://carenest-beta.vercel.app/#/login](https://carenest-beta.vercel.app/#/login)**  
> Experience the complete, responsive web application right in your browser with zero installation!

- **Direct Live Login**: [https://carenest-beta.vercel.app/#/login](https://carenest-beta.vercel.app/#/login)
- **Official Domain**: [https://carenest-beta.vercel.app](https://carenest-beta.vercel.app)
- **Alternate Mirror**: [https://test1-plum-eight-44.vercel.app](https://test1-plum-eight-44.vercel.app)

### 🔑 Pre-configured Demo Accounts

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Elderly Patient** | Ramakrishna Varma | `ramakrishna.demo@carenest.ai` | `DemoPassword123!` | 72 yrs, Type-2 Diabetes & BP Regimen, Code: `RAMA-7890` |
| **Caregiver / Physician** | Dr. Priya Varma | `dr.priya.demo@carenest.ai` | `DemoPassword123!` | Remote patient monitoring, missed dose alerts |
| **Custom User** | New Account | [Register Form](https://carenest-beta.vercel.app/#/register) | Custom | Choose Elderly, Caregiver, or Admin |

*(Tip: On the login screen, you can also use the 1-Click Demo buttons to test immediately without typing.)*

---

## 🌟 Key Features

1. **Elderly-Centered Tactile Dashboard**:
   - Central **Dose Ring & Pill Card** showing immediate upcoming medications with meal relation indicators (*Before Food / After Food*).
   - High-contrast, tactile touch targets (minimum 56px height) with dual-tone Web Audio chimes for sensory feedback.
   - Built-in 3-level text scaling toggle (*Normal 16px, Large 18px, Extra Large 20px*).

2. **Prescription Scanner & OCR**:
   - Camera capture or photo upload of printed and handwritten prescriptions.
   - Contrast enhancement and OCR pipeline with structured entity extraction (medicines, potencies, frequencies, meal relations).
   - Mandatory medical safety disclaimer with editable cards for manual confirmation before saving.

3. **Medicine Identification Assistant**:
   - Visual inspection of tablet or capsule photos with shape and color classification against reference catalogs.
   - Transparent confidence scores with mandatory pharmacist verification warnings and manual entry fallback.

4. **Conversational Assistant ("Ask CareNest")**:
   - Context-aware healthcare assistant querying the patient's actual database schedule.
   - Speech-to-Text (Microphone voice input) and Text-to-Speech voice readout.
   - Full support for **English** and **Telugu** (`తెలుగు`).

5. **Remote Caregiver Portal**:
   - Secure pairing via unique 8-character Family Link Code (e.g. `RAMA-7890`).
   - Remote monitoring of daily adherence percentages, missed doses, and live schedules.
   - Real-time emergency SOS alert feed with resolution tracking.

6. **Offline-First Architecture**:
   - Local caching and reminder tracking via browser **IndexedDB** (`idb`).
   - Queues offline actions (*e.g. medication taken during network outage*) and automatically synchronizes when internet connectivity resumes.

7. **Emergency SOS System**:
   - Single-click emergency trigger with confirmation dialog, GPS coordinates capture, and audio alarm.
   - Displays direct emergency hotlines (108 / 112).

8. **Hardware Abstraction Layer (HAL) for IoT Devices**:
   - Ready-to-interface GPIO pin mappings for physical pushbuttons (GPIO 17, 27, 22), RGB LED, and piezo buzzer.
   - Includes a built-in software simulator for standard laptops and a standalone Python edge script (`rpi_carenest_edge.py`).

---

## 🚀 Quick Start & Local Development (Optional)

> 💡 **Tip**: If you want to test or demo the platform, you don't need to run it locally. Open the live deployment directly:  
> 👉 **[https://carenest-beta.vercel.app/#/login](https://carenest-beta.vercel.app/#/login)**

For running your own local development instance:

### 1. Start Backend API
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Local API Base: `http://127.0.0.1:8000`
- Interactive API Documentation: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### 2. Start Frontend Application
```powershell
cd frontend
npm run dev
```
- Local Web Application: `http://localhost:5173`
- Live Production Web App: [https://carenest-beta.vercel.app/#/login](https://carenest-beta.vercel.app/#/login)

---

## 🏗️ Project Architecture

```
carenest/
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Tactile UI components & modals
│   │   │   └── ui/               # Shadcn-style primitives (Button, Card, Badge)
│   │   ├── context/              # Auth & Reminder reactive context providers
│   │   ├── pages/                # Route views (Dashboard, Scan, Pill ID, Caregiver)
│   │   ├── services/             # API client & IndexedDB storage wrapper
│   │   └── i18n/                 # English and Telugu localization
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Python FastAPI REST server
│   ├── app/
│   │   ├── api/endpoints/        # REST route handlers
│   │   ├── core/                 # JWT security & pydantic-settings config
│   │   ├── database/             # SQLAlchemy session & SQLite/PostgreSQL engine
│   │   ├── models/               # Database ORM models
│   │   ├── schemas/              # Pydantic v2 validation schemas
│   │   └── services/             # OCR pipeline, Pill classifier, Assistant, HAL
│   ├── tests/                    # Pytest automated test suite (8/8 passing)
│   ├── requirements.txt
│   └── main.py
│
├── database/
│   └── schema.sql                # Relational schema for PostgreSQL & SQLite
│
├── docs/                         # Engineering documentation
│   ├── architecture.md           # System design & data flow diagrams
│   ├── installation.md           # Step-by-step local running guide
│   ├── deployment.md             # Vercel + Render + Supabase cloud deployment guide
│   ├── api.md                    # REST API endpoints & request/response samples
│   ├── testing.md                # Automated test execution report
│   └── hardware-integration.md   # Raspberry Pi 4 wiring & edge Python script
│
├── .env.example
├── docker-compose.yml
├── PROJECT_STATE.md
└── README.md
```

---

## 🧪 Automated Testing

Backend test cases cover authentication, medication CRUD, live daily schedules, bilingual assistant responses, emergency SOS triggers, and hardware HAL simulation:

```powershell
cd backend
.\venv\Scripts\python -m pytest
```

Expected result:
```
======================== 8 passed in 7.12s ========================
```

---

## 🛡️ Medical & Ethical Disclaimer

**CareNest AI is an assistive technology application designed to support medication tracking and safety.**
It is **NOT** a certified medical device and does not substitute for licensed physicians, registered pharmacists, or professional medical diagnostics. All prescription OCR extractions and pill visual matches require confirmation by a human healthcare professional.
