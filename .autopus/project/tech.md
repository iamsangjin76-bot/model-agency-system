# Tech Stack — Model Agency Management System

> Updated by `/auto sync` on 2026-04-15.

## Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.11 |
| Web Framework | FastAPI | 0.109.0 |
| ASGI Server | uvicorn[standard] | 0.27.0 |
| ORM | SQLAlchemy | 2.0.25 |
| Database | SQLite | (bundled) |
| Auth / JWT | python-jose[cryptography] | 3.3.0 |
| Password Hashing | passlib[bcrypt] | 1.7.4 |
| Settings | pydantic-settings | 2.1.0 |
| File Uploads | python-multipart | 0.0.6 |
| Async File IO | aiofiles | 23.2.1 |

### Backend Structure
```
backend/app/
  config.py              # Settings (pydantic-settings, reads .env)
  main.py                # FastAPI app, CORS, lifespan startup
  models/
    database.py          # Original 320-line models (Admin, Model, etc.) — kept for backward compat
    auth.py              # RefreshToken model + re-exports from database.py
    agency.py            # Re-exports of agency models from database.py
    __init__.py          # Package re-exports (database.py symbols only)
  schemas/
    auth.py              # Token, RefreshRequest, Admin schemas
    agency.py            # Model/Client/Casting schemas
    agency_financial.py  # Contract/Settlement/Schedule schemas
    __init__.py          # Full re-export for backward compat
  schemas.py             # Original monolithic schemas file (kept for backward compat)
  routers/
    auth.py              # Login, me, admins CRUD (208 lines)
    token_refresh.py     # POST /refresh, POST /logout (99 lines)
    models.py, clients.py, castings.py, contracts.py
    settlements.py, schedules.py, files.py, media.py
    stats.py, activity_logs.py, notifications.py
  services/
    token_service.py     # Refresh token lifecycle (generate, hash, rotate, revoke, cleanup)
  utils/
    activity_log.py
```

### Auth Architecture (SPEC-AUTH-001)
- Access token: JWT, 15-minute TTL (down from 24 hours)
- Refresh token: opaque UUID4, 7-day TTL, SHA-256 hashed in DB
- Single-use rotation: consuming a token issues a new one and marks the old as revoked
- Family revocation: reuse of a consumed token triggers full session revocation for the user
- Startup cleanup: expired tokens deleted on app start

## Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | 5.x |
| Framework | React | 18.2 |
| Build Tool | Vite | 5.x |
| Routing | react-router-dom | 6.20 |
| State (auth) | React Context | — |
| HTTP | fetch (custom wrapper) | — |
| Desktop | Electron | — |
| Charts | recharts | 2.10 |
| Forms | react-hook-form + zod | 7.48 / 3.22 |
| Styling | Tailwind CSS + clsx | — |

### Frontend Structure
```
frontend/src/
  App.tsx                # Router setup
  main.tsx               # App entry point
  contexts/
    AuthContext.tsx       # Auth state, login/logout with refresh token lifecycle
  services/
    auth-api.ts          # Token storage, request() with silent refresh interceptor, authAPI
    domain-api.ts        # modelsAPI, clientsAPI, castingsAPI, contractsAPI, etc.
    api.ts               # Barrel re-export (backward compat)
  pages/                 # 14 page components (Dashboard, Login, Model*, Casting*, etc.)
  components/            # Shared UI components
  hooks/, utils/, types/ # Utilities
```

### Auth Architecture (Frontend)
- Tokens stored in localStorage (`access_token`, `refresh_token`)
- 401 interceptor: auto-calls `/api/auth/refresh`, retries original request once
- `refreshPromise` singleton prevents concurrent refresh storms
- AuthContext clears both tokens on logout and calls `POST /api/auth/logout`

## Build & Run

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build
npm run electron:dev # Electron + Vite concurrent
```

## Testing
- Backend: no formal test suite yet (manual integration testing)
- Frontend: TypeScript type checking via `tsc --noEmit`

## File Size Policy
All source files must stay under 300 lines (target: under 200).
Excluded: *.md, *.yaml, *.json config files.
