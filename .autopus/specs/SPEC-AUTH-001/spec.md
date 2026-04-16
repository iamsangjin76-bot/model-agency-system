# SPEC-AUTH-001: JWT Token Refresh System

**Status**: completed
**Created**: 2026-04-15
**Domain**: AUTH
**PRD**: prd.md

## Purpose

The Model Agency Management System uses a single JWT access token with a 24-hour expiry and no server-side revocation. A stolen token grants full API access for up to 24 hours. Users are forced to re-login whenever a token expires, even during active sessions. This SPEC introduces a short-lived access token (15 min) paired with a rotatable, server-tracked refresh token (7 days) to reduce the attack window and enable seamless session continuity.

## Requirements

### Backend — Token Issuance

- **R1** (FR-1): WHEN a user authenticates via `POST /api/auth/login` or `POST /api/auth/token`, THE SYSTEM SHALL return a response containing `access_token` (JWT, 15 min TTL), `refresh_token` (opaque UUID4, 7 day TTL), and `token_type: "bearer"`.
- **R2** (FR-6): WHILE the application is configured, THE SYSTEM SHALL use `ACCESS_TOKEN_EXPIRE_MINUTES = 15` and `REFRESH_TOKEN_EXPIRE_DAYS = 7` as defaults in `config.py`.
- **R3** (NFR-4): WHEN returning login responses, THE SYSTEM SHALL preserve backward compatibility — `access_token` and `token_type` fields remain unchanged; `refresh_token` is additive.

### Backend — Token Refresh

- **R4** (FR-2): WHEN a client sends a valid, non-revoked, non-expired refresh token to `POST /api/auth/refresh` (unauthenticated endpoint — identity is established solely via the refresh token body, no access token in Authorization header required), THE SYSTEM SHALL return a new access token and a new refresh token.
- **R5** (FR-3): WHEN a refresh token is consumed at `POST /api/auth/refresh`, THE SYSTEM SHALL revoke the consumed token (set `revoked = true`, populate `replaced_by`) and issue a replacement.
- **R6** (NFR-2): WHEN a previously consumed (revoked + replaced) refresh token is presented to `POST /api/auth/refresh`, THE SYSTEM SHALL revoke all tokens in that user's active token family as a compromise detection measure. There is NO grace window for reuse — any reuse of a consumed token triggers family revocation. Network retries that resend a valid (not yet consumed) token are safe; the attack vector is presenting a token that has already been rotated.
- **R7** (NFR-3): WHEN `POST /api/auth/refresh` is called under normal conditions, THE SYSTEM SHALL respond within 200ms at p95.

### Backend — Token Revocation

- **R8** (FR-4): WHEN a user calls `POST /api/auth/logout` with a valid access token, THE SYSTEM SHALL revoke all refresh tokens belonging to that user.
- **R9** (NFR-5): WHEN the application starts, THE SYSTEM SHALL delete expired and revoked refresh tokens from the database to prevent table bloat.

### Backend — Token Storage

- **R10** (FR-5): THE SYSTEM SHALL store refresh tokens in a `refresh_tokens` table with columns: `id` (PK), `admin_id` (FK → admins.id), `token_hash` (SHA-256 of raw token, indexed), `expires_at`, `revoked` (boolean, default false), `created_at`, `replaced_by` (nullable, FK → refresh_tokens.id).
- **R11** (NFR-1): THE SYSTEM SHALL never persist the raw refresh token value server-side; only the SHA-256 hash is stored.

### Frontend — Silent Refresh

- **R12** (FR-7): WHEN an API request receives a 401 response and a refresh token exists in localStorage, THE SYSTEM SHALL intercept the response, call `POST /api/auth/refresh`, and retry the original request exactly once with the new access token. If the refresh also fails, THE SYSTEM SHALL clear both tokens and redirect to `/login`.
- **R13** (FR-8): WHILE a token refresh is in progress and additional API requests receive 401 responses, THE SYSTEM SHALL queue those requests and resolve them with the new access token once the refresh completes (preventing concurrent refresh storms).
- **R14** (FR-9): WHEN the user logs in, THE SYSTEM SHALL store both `access_token` and `refresh_token` in localStorage. WHEN the user logs out, THE SYSTEM SHALL clear both tokens from localStorage.

## Deferred / Out of Scope

- **FR-10** (P2 from PRD): `DELETE /api/auth/sessions` super-admin force logout endpoint — deferred to a follow-up SPEC. Tracking reference: PRD section 5, P2 requirements.
- **httpOnly cookie migration**: Refresh tokens remain in localStorage for this iteration. Tracked as a future security hardening item.
- **Rate limiting on `/api/auth/refresh`**: No existing rate-limiting infrastructure; deferred.

## Files to Create or Modify

### Prerequisites (File Size Compliance)

Three existing files already exceed the 300-line hard limit. These MUST be split as part of this SPEC to remain compliant. Splitting is included in the implementation plan (T0a–T0c).

| File | Current Lines | Violation | Split Strategy |
|------|--------------|-----------|----------------|
| `backend/app/models/database.py` | ~320 | Over limit | Split into `models/auth.py` (Admin, RefreshToken) + `models/agency.py` (Model, ModelFile, NewsArticle, SNSData, ShareLink, ActivityLog, Notification, etc.) |
| `backend/app/schemas.py` | ~545 | Over limit | Split into `schemas/auth.py` (Token, LoginRequest, RefreshRequest, AdminCreate/Update/Response, etc.) + `schemas/agency.py` (Model, Client, Casting, Contract, Settlement schemas) |
| `frontend/src/services/api.ts` | ~413 | Over limit | Split into `api/auth.ts` (token management, refresh interceptor, authAPI) + `api/client.ts` (remaining domain APIs) + `api/index.ts` (re-exports for backward compatibility) |

### New Files

| File | Purpose |
|------|---------|
| `backend/app/routers/token_refresh.py` | Refresh and logout endpoints (`POST /api/auth/refresh`, `POST /api/auth/logout`) |
| `backend/app/services/token_service.py` | Refresh token generation, hashing, rotation, revocation, cleanup logic |

### Modified Files

| File | Change |
|------|--------|
| `backend/app/config.py` | Change `ACCESS_TOKEN_EXPIRE_MINUTES` to 15; add `REFRESH_TOKEN_EXPIRE_DAYS = 7` |
| `backend/app/models/database.py` | Add `RefreshToken` model; add relationship on `Admin` |
| `backend/app/schemas.py` | Update `Token` schema to include `refresh_token`; add `RefreshRequest` schema |
| `backend/app/routers/auth.py` | Modify `login()` and `login_for_access_token()` to issue refresh tokens alongside access tokens |
| `backend/app/main.py` | Mount `token_refresh.router`; call token cleanup on startup |
| `frontend/src/services/api.ts` | Add refresh interceptor with request queue; manage `refresh_token` in localStorage |
| `frontend/src/contexts/AuthContext.tsx` | Store refresh token on login; clear both tokens on logout; call `POST /api/auth/logout` |

## Open Implementation Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Grace window for reuse detection** | (A) No grace window — any reuse triggers family revocation immediately; (B) 30-second grace — the immediately previous token is accepted for 30 seconds after rotation to handle network retries | R6 specifies option A (no grace window). Implementer may choose option B as an enhancement, but acceptance criteria S5 tests option A behavior. Document the choice in a code comment. |
| **Periodic token cleanup** | (A) Startup-only (current SPEC, R9); (B) Scheduled task / background thread | Option A is sufficient for this SQLite-backed system at current token volume. Startup cleanup is the specified approach; periodic cleanup is a future improvement. |

## Constraints

- All source files must stay under 300 lines. `auth.py` is currently 303 lines — new endpoints go in `token_refresh.py` to avoid exceeding the limit.
- `database.py` is currently 320 lines — the `RefreshToken` model adds ~15 lines, which is acceptable for a model file but should be monitored.
- SQLite single-writer constraint: refresh token DB operations must use minimal, single-row transactions.
- Refresh token is an opaque UUID4 string, not a JWT. This forces server-side validation and enables revocation.
- The raw refresh token is never stored server-side; only its SHA-256 hash is persisted.
