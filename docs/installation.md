# CareNest AI — Local Installation & Setup Guide

> 🌐 **Live Web App**: You can also use the live cloud deployment directly at **[https://carenest-beta.vercel.app/#/login](https://carenest-beta.vercel.app/#/login)** without installing anything locally!

This guide provides step-by-step instructions to run **CareNest AI** locally on your computer for development and offline testing.

---

## 1. Prerequisites

Make sure the following runtimes are installed on your system:
- **Python**: Version 3.10 to 3.13 (`python --version`)
- **Node.js**: Version 18 or higher (`node --version`)
- **npm**: Version 9 or higher (`npm --version`)

---

## 2. Quick Start (Run in 2 Terminals)

### Terminal 1: Start Backend (FastAPI REST API)

1. Open PowerShell or Terminal and navigate to the project root:
   ```powershell
   cd backend
   ```

2. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled on your system, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*
   - On Mac / Linux:
     ```bash
     source venv/bin/activate
     ```

3. Run the FastAPI development server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. The backend is now running at:
   - **API Root**: `http://127.0.0.1:8000`
   - **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
   - **Health Check**: `http://127.0.0.1:8000/api/health`

*(Note: On first startup, CareNest automatically creates the SQLite database `carenest.db` and auto-seeds initial demo patient data! Zero manual database setup required!)*

---

### Terminal 2: Start Frontend (React + Vite SPA)

1. Open a second terminal window and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Start the Vite development server:
   ```powershell
   npm run dev
   ```

3. Open your browser and visit:
   ```
   http://localhost:5173
   ```
   *(Or access the production deployment: https://carenest-beta.vercel.app/#/login)*

---

## 3. Running Automated Tests

To run the backend test suite and verify all API endpoints, authentication, CRUD operations, and OCR:

```powershell
cd backend
.\venv\Scripts\python -m pytest
```

Expected result:
```
collected 8 items
tests\test_backend.py ........ [100%]
8 passed in ~5s
```

To test the frontend TypeScript compilation and production bundle build:

```powershell
cd frontend
npm run build
```

Expected result:
```
✓ built in ~5s
```

---

## 4. Pre-configured Demo Accounts

When opening `http://localhost:5173`, use the **1-Click Demo Login** buttons on the login screen:

1. **Elderly Patient Demo**:
   - **Name**: Ramakrishna Varma (72 years old)
   - **Email**: `ramakrishna.demo@carenest.ai`
   - **Password**: `DemoPassword123!`
   - **Caregiver Link Code**: `RAMA-7890`

2. **Caregiver Demo**:
   - **Name**: Dr. Priya Varma (Physician & Daughter)
   - **Email**: `dr.priya.demo@carenest.ai`
   - **Password**: `DemoPassword123!`

