# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rei do Óleo - Santa Terezinha** is a full-stack web application for an oil change shop in Santo André, SP, Brazil. It manages customers, vehicles, and service history, and generates WhatsApp reminder links when maintenance is due.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Express + Vite dev server on port 3000
npm run build      # Build frontend to /dist
npm run lint       # TypeScript type check (tsc --noEmit)
npm run clean      # Remove dist folder
npm run preview    # Preview production build
```

Set `GEMINI_API_KEY` and `GOOGLE_MAPS_PLATFORM_KEY` environment variables (see `.env.example`) before running.

## Architecture

This is a **single-process Express + React** app. The Express server (`server.ts`) serves both the API and the Vite dev middleware (in development) or the built static files (in production).

### Backend (`server.ts`)

- RESTful API under `/api/`
- **No real database** — all state is persisted to `data.json` using a read/write helper
- Authentication is password-only: admin uses a single shared password, customers authenticate by vehicle plate + password
- Tokens are plain strings stored in localStorage (not JWTs)

**Data model in `data.json`:**
```
users[]        # Unused — admin is a single hardcoded account
customers[]    # Name, phone, email
vehicles[]     # Plate, brand, model, year, mileage, ownerId, password hash, mustChangePassword
services[]     # Oil change records linked to vehicle + customer
settings       # { adminPasswordHash }
```

**Key endpoints:**
```
POST   /api/auth/login
POST   /api/auth/change-password
GET/POST/PUT/DELETE  /api/customers/:id
GET/POST/PUT/DELETE  /api/vehicles/:id
GET/POST/PUT/DELETE  /api/services/:id
GET    /api/reminders          # vehicles nearing maintenance due date
```

### Frontend (`src/`)

React 19 SPA with local state (no Redux/Zustand). Auth state is stored in `localStorage` and drives component rendering in `App.tsx`.

**Component flow:**
1. `Login.tsx` — customer (plate + password) or admin (password only) tabs
2. `ChangePassword.tsx` — shown on first login when `mustChangePassword` is set
3. `AdminDashboard.tsx` — full CRUD for customers/vehicles/services, reminder panel
4. `CustomerDashboard.tsx` — read-only view of the customer's vehicles and service history
5. `ServiceForm.tsx` — multi-step wizard for logging a new oil change

**API client:** `src/lib/api.ts` wraps `fetch` with `get`, `post`, `put`, `delete` helpers pointing at `/api/`.

### Reminder System

`GET /api/reminders` computes vehicles whose next oil change is within 7 days or 500 km. The admin dashboard displays these and generates `wa.me` WhatsApp links — there is no automated sending; the admin clicks the link manually.

### Environment Variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI (referenced in vite config, minimal usage) |
| `GOOGLE_MAPS_PLATFORM_KEY` | Google Maps (store location display) |
| `APP_URL` | Public URL of the deployed app |
