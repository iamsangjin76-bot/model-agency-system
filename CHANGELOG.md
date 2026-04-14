# Changelog — Model Agency Management System

> Auto-managed by `/auto sync`. Entries follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [0.2.0] — 2026-04-15

### SPEC-AUTH-001: JWT Token Refresh System

**Summary**: Replaced single 24-hour static JWT with a dual-token architecture —
short-lived access token (15 min) + rotatable opaque refresh token (7 days).
Reduces the stolen-token attack window from 24 hours to 15 minutes and enables
seamless session continuity without forced re-logins.

#### Added

- `backend/app/services/token_service.py` — Refresh token lifecycle: generate (UUID4), hash (SHA-256), rotate (single-use), revoke-family (compromise detection), cleanup (startup pruning)
- `backend/app/routers/token_refresh.py` — `POST /api/auth/refresh` (unauthenticated, R4) and `POST /api/auth/logout` (revoke all user tokens)
- `backend/app/models/auth.py` — `RefreshToken` ORM model (`refresh_tokens` table: id, admin_id, token_hash, expires_at, revoked, created_at, replaced_by)
- `backend/app/models/agency.py` — Re-export of agency models from `database.py`
- `backend/app/models/__init__.py` — Package with backward-compat re-exports
- `backend/app/schemas/` package — Split from monolithic `schemas.py`: `auth.py`, `agency.py`, `agency_financial.py`, `__init__.py`
- `backend/app/services/__init__.py` — Services package init
- `frontend/src/services/auth-api.ts` — Token storage, `request()` with 401 interceptor + silent refresh + request queue (`refreshPromise` singleton, R13)
- `frontend/src/services/domain-api.ts` — Domain API split from former `api.ts`

#### Changed

- `backend/app/config.py` — `ACCESS_TOKEN_EXPIRE_MINUTES` reduced from 1440 (24 h) to 15; `REFRESH_TOKEN_EXPIRE_DAYS = 7` added
- `backend/.env` — Token TTL values updated to match config defaults
- `backend/app/routers/auth.py` — `login()` and `login_for_access_token()` now issue refresh tokens alongside access tokens
- `backend/app/main.py` — Mounts `token_refresh` router; calls `cleanup_expired_tokens()` on startup
- `frontend/src/services/api.ts` — Reduced to barrel re-export (~20 lines); logic moved to `auth-api.ts` and `domain-api.ts`
- `frontend/src/contexts/AuthContext.tsx` — Stores/clears `refresh_token` in localStorage on login/logout; fires `POST /api/auth/logout` on logout

#### Security

- Raw refresh tokens are never persisted server-side — only the SHA-256 hash is stored (R11)
- Token reuse detection: presenting a previously consumed refresh token triggers full session (family) revocation (R6)
- Startup cleanup removes expired tokens to prevent table bloat (R9)

---

## [0.1.0] — Initial Release

- Core model agency management features: Model CRUD, Casting, Client CRM, Contract, Settlement, Schedule, Media Search, Admin Management, External Share
- JWT-based authentication (single 24-hour access token — superseded by v0.2.0)
