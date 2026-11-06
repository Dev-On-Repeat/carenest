# CareNest AI — Production Cloud Deployment Guide

This guide explains how to deploy **CareNest AI** to the cloud for 24/7 access:
- **Database**: Supabase PostgreSQL (with Row Level Security)
- **Backend API**: Render (FastAPI Web Service)
- **Frontend SPA**: Vercel (React + Vite)

---

## 1. Cloud Database Setup (Supabase)

1. Sign up for a free account at [supabase.com](https://supabase.com).
2. Click **New Project**, choose a project name (e.g., `carenest-db`), and set a strong database password.
3. Once the database is provisioned, go to **Project Settings** -> **Database** -> **Connection String**.
4. Copy the URI string (starts with `postgresql://postgres:[YOUR-PASSWORD]@db...supabase.co:5432/postgres`).
5. In the Supabase **SQL Editor**, open and execute the schema file located in:
   ```
   database/schema.sql
   ```
   This creates all tables, indexes, and Row Level Security policies.

---

## 2. Cloud Backend Deployment (Render)

1. Sign up for a free account at [render.com](https://render.com).
2. Connect your GitHub repository containing the `carenest-ai` codebase.
3. Click **New +** -> **Web Service**.
4. Configure the service settings:
   - **Name**: `carenest-api`
   - **Region**: Singapore or your nearest region
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. In the **Environment Variables** section, add:
   - `DATABASE_URL`: `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres`
   - `SECRET_KEY`: `[generate a 64-char random string]`
   - `ALGORITHM`: `HS256`
   - `BACKEND_CORS_ORIGINS`: `["*"]` (or your Vercel frontend URL)
6. Click **Deploy Web Service**. Render will build and deploy the FastAPI backend.
7. Copy your assigned backend URL (e.g., `https://carenest-api.onrender.com`).

---

## 3. Cloud Frontend Deployment (Vercel)

1. Sign up for a free account at [vercel.com](https://vercel.com).
2. Click **Add New** -> **Project**, and import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In `frontend/vite.config.ts`, or via Vercel proxy rewrite:
   - Set the API proxy target to your Render URL: `https://carenest-api.onrender.com`.
   - Or create a `vercel.json` in `frontend/`:
     ```json
     {
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "https://carenest-api.onrender.com/api/:path*"
         },
         {
           "source": "/(.*)",
           "destination": "/index.html"
         }
       ]
     }
     ```
5. Click **Deploy**. Vercel will build the React TypeScript application and provide a global CDN URL (e.g., `https://carenest-ai.vercel.app`).

---

## 4. Verification Checklist

- [ ] Visit `https://carenest-beta.vercel.app/api/health` -> returns `{"status":"healthy","service":"CareNest AI"}`
- [ ] Visit `https://carenest-beta.vercel.app/#/login` -> loads CareNest login screen
- [ ] Click "1-Click Demo Elderly" -> logs in successfully and displays Ramakrishna's schedule
- [ ] Mark medication as TAKEN -> verifies instant cloud database update

