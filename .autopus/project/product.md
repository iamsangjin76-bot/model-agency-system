# Product — Model Agency Management System

> Updated by `/auto sync` on 2026-04-15.

## Project Name
Model Agency Management System (모델 에이전시 관리 시스템)

## Description
A full-stack web + desktop application for managing a model agency's operations.
Admins can manage model profiles, castings, clients, contracts, settlements,
schedules, and perform media search (news/images/SNS analytics).
Includes an Electron wrapper for desktop deployment.

## Mode
Full-stack: Python FastAPI backend + React/TypeScript + Electron frontend.

## Core Features

| Feature | Description |
|---------|-------------|
| Auth | JWT-based login with 15-min access tokens + 7-day rotatable refresh tokens |
| Model Management | CRUD for model profiles with physical stats, career, SNS metrics, file attachments |
| Casting Management | Casting requests with status workflow (request → confirmed → completed) |
| Client Management | Client CRM with grade tiers (VIP/Gold/Silver/Normal) and industry tags |
| Contract Management | Contract lifecycle with agency/model fee tracking |
| Settlement Management | Payment settlement status tracking |
| Schedule Management | Calendar-based event scheduling |
| Media Search | News article search, image search, SNS analytics per model |
| Admin Management | Super-admin can create/update/delete admins with granular permissions |
| External Share | Share model profiles via external link (share code) |

## Key Endpoints (Backend)
- `POST /api/auth/login` — login, returns access + refresh tokens
- `POST /api/auth/refresh` — silent token refresh (unauthenticated)
- `POST /api/auth/logout` — revoke all refresh tokens
- `POST /api/auth/token` — OAuth2 endpoint (Swagger UI)
- `GET /api/health` — health check

## Deployment
- Backend: uvicorn (Python 3.11), SQLite database
- Frontend: Vite dev server or Electron desktop app
- Default ports: backend 8000, frontend 5173
