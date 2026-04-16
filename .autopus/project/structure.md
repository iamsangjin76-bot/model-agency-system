# Structure — Model Agency Management System

> Updated by `/auto sync` on 2026-04-15 (SPEC-AUTH-001).

## Repository Layout

```
model-agency-system/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── config.py           # Settings (pydantic-settings, reads .env)
│   │   ├── main.py             # FastAPI app, CORS, lifespan startup + token cleanup
│   │   ├── models/             # SQLAlchemy ORM models (package, split by domain)
│   │   │   ├── __init__.py     # Backward-compat re-exports from database.py
│   │   │   ├── database.py     # Core models: Admin, Model, Client, etc. (320 lines, kept intact)
│   │   │   ├── auth.py         # RefreshToken model; imports Base from database.py
│   │   │   └── agency.py       # Pure re-export of agency models from database.py
│   │   ├── schemas/            # Pydantic schemas (package, split by domain)
│   │   │   ├── __init__.py     # Full re-export for backward compat
│   │   │   ├── auth.py         # Token, RefreshRequest, Admin schemas
│   │   │   ├── agency.py       # Model, Client, Casting schemas
│   │   │   └── agency_financial.py  # Contract, Settlement, Schedule, Pagination schemas
│   │   ├── schemas.py          # Original monolithic schemas (kept for backward compat)
│   │   ├── routers/            # FastAPI route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Login, /me, admins CRUD (208 lines)
│   │   │   ├── token_refresh.py  # POST /refresh, POST /logout (99 lines) [SPEC-AUTH-001]
│   │   │   ├── models.py       # Model profile CRUD
│   │   │   ├── clients.py      # Client CRM CRUD
│   │   │   ├── castings.py     # Casting workflow CRUD
│   │   │   ├── contracts.py    # Contract management
│   │   │   ├── settlements.py  # Payment settlements
│   │   │   ├── schedules.py    # Calendar schedules
│   │   │   ├── files.py        # File upload/download
│   │   │   ├── media.py        # News/image/SNS search
│   │   │   ├── stats.py        # Dashboard statistics
│   │   │   ├── activity_logs.py
│   │   │   └── notifications.py
│   │   ├── services/           # Business logic services [SPEC-AUTH-001]
│   │   │   ├── __init__.py
│   │   │   └── token_service.py  # Refresh token lifecycle: generate, hash, rotate, revoke, cleanup
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── activity_log.py
│   ├── .env                    # Environment config (SECRET_KEY, DB URL, token TTLs)
│   ├── requirements.txt
│   └── model_agency.db         # SQLite database (runtime artifact)
│
├── frontend/                   # React + TypeScript + Electron frontend
│   ├── src/
│   │   ├── App.tsx             # Router setup (react-router-dom v6)
│   │   ├── main.tsx            # Entry point
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Auth state, login/logout with dual-token lifecycle
│   │   ├── services/
│   │   │   ├── auth-api.ts     # Token storage, request() interceptor, authAPI [SPEC-AUTH-001]
│   │   │   ├── domain-api.ts   # Domain API namespaces (modelsAPI, clientsAPI, etc.)
│   │   │   └── api.ts          # Barrel re-export (backward compat)
│   │   ├── pages/              # 14 page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ModelListPage.tsx
│   │   │   ├── ModelFormPage.tsx
│   │   │   ├── CastingPage.tsx
│   │   │   ├── ClientPage.tsx
│   │   │   ├── ContractPage.tsx
│   │   │   ├── SettlementPage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   ├── AdminManagementPage.tsx
│   │   │   ├── NewsSearchPage.tsx
│   │   │   ├── ImageSearchPage.tsx
│   │   │   ├── SNSAnalyticsPage.tsx
│   │   │   └── ProfileExportPage.tsx
│   │   └── types/
│   │       ├── auth.ts
│   │       └── model.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── ARCHITECTURE.md             # Domains, layers, dependency map
├── CLAUDE.md                   # Autopus-ADK harness configuration
├── CHANGELOG.md                # Release notes and SPEC history
├── .autopus/
│   ├── project/
│   │   ├── product.md          # Project description and features
│   │   ├── structure.md        # This file
│   │   ├── tech.md             # Tech stack details
│   │   ├── scenarios.md        # E2E test scenarios
│   │   └── canary.md           # Health check configuration
│   └── specs/
│       └── SPEC-AUTH-001/      # JWT Token Refresh System (completed)
│           ├── spec.md
│           ├── plan.md
│           └── acceptance.md
└── .claude/, .gemini/, .codex/ # AI assistant harness configs
```

## Package Roles

| Package | Role | Key Files |
|---------|------|-----------|
| `backend/app/models/` | ORM model definitions | `database.py` (core), `auth.py` (RefreshToken) |
| `backend/app/schemas/` | Request/response validation | `auth.py`, `agency.py`, `agency_financial.py` |
| `backend/app/routers/` | HTTP endpoint handlers | `auth.py`, `token_refresh.py`, domain routers |
| `backend/app/services/` | Business logic | `token_service.py` |
| `backend/app/utils/` | Shared utilities | `activity_log.py` |
| `frontend/src/services/` | API layer | `auth-api.ts` (interceptor), `domain-api.ts` |
| `frontend/src/contexts/` | Global state | `AuthContext.tsx` |
| `frontend/src/pages/` | UI pages | 14 page components |

## Entry Points

| Entry Point | Path | Description |
|-------------|------|-------------|
| Backend | `backend/app/main.py` | FastAPI app, CORS config, router registration, startup hook |
| Frontend | `frontend/src/main.tsx` | React app mount |
| Frontend Router | `frontend/src/App.tsx` | react-router-dom route definitions |

## File Size Status (Post SPEC-AUTH-001)

| File | Lines | Status |
|------|-------|--------|
| `backend/app/models/database.py` | ~320 | Legacy — over limit, kept intact for compat |
| `backend/app/schemas.py` | ~545 | Legacy — over limit, kept intact for compat |
| `backend/app/models/auth.py` | ~55 | OK |
| `backend/app/models/agency.py` | ~20 | OK |
| `backend/app/schemas/auth.py` | ~80 | OK |
| `backend/app/schemas/agency.py` | ~120 | OK |
| `backend/app/schemas/agency_financial.py` | ~140 | OK |
| `backend/app/services/token_service.py` | ~100 | OK |
| `backend/app/routers/token_refresh.py` | ~99 | OK |
| `backend/app/routers/auth.py` | ~208 | OK |
| `frontend/src/services/auth-api.ts` | ~218 | OK |
| `frontend/src/services/domain-api.ts` | ~170 | OK |
| `frontend/src/services/api.ts` | ~20 | OK (barrel re-export) |

## SPEC-AUTH-001 New Files (2026-04-15)

| File | Type | Purpose |
|------|------|---------|
| `backend/app/models/auth.py` | New | RefreshToken ORM model |
| `backend/app/models/agency.py` | New | Agency model re-exports |
| `backend/app/models/__init__.py` | New | Package backward-compat re-exports |
| `backend/app/schemas/auth.py` | New | Auth schema split |
| `backend/app/schemas/agency.py` | New | Agency schema split |
| `backend/app/schemas/agency_financial.py` | New | Financial schema split |
| `backend/app/schemas/__init__.py` | New | Schema package re-exports |
| `backend/app/services/__init__.py` | New | Services package init |
| `backend/app/services/token_service.py` | New | Token lifecycle service |
| `backend/app/routers/token_refresh.py` | New | Refresh + logout endpoints |
| `frontend/src/services/auth-api.ts` | New | Auth API + silent refresh interceptor |
| `frontend/src/services/domain-api.ts` | New | Domain API split |
