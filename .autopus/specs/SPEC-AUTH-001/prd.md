# PRD: JWT Token Refresh System

**SPEC-ID**: SPEC-AUTH-001
**Mode**: Standard
**Date**: 2026-04-15
**Status**: draft

## 1. Problem & Context

The Model Agency Management System currently issues a single JWT access token with a 24-hour expiry (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24` in `backend/app/config.py`). This creates two distinct problems:

**Security gap**: A stolen token remains valid for up to 24 hours. There is no mechanism to revoke it server-side since the system is purely stateless JWT. An attacker with a captured token has a full day of unrestricted API access.

**No session lifecycle**: The frontend (`frontend/src/services/api.ts`) handles 401 errors by clearing localStorage and redirecting to `/login`. There is no attempt to refresh the token silently, meaning users are forced to re-authenticate whenever a token expires — even during active use.

The current login endpoint (`POST /api/auth/login`) returns only `{"access_token": ..., "token_type": "bearer"}` with no refresh token. The `Token` schema in `backend/app/schemas.py` confirms this minimal structure.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Reduce token exposure window | Access token TTL | ≤ 15 minutes |
| Maintain session continuity | Refresh token TTL | ≤ 7 days |
| Zero extra logins for active users | Forced re-auth events during active session | 0 |
| Enable server-side revocation | Refresh tokens tracked in DB | 100% of issued tokens |
| Refresh latency | `POST /api/auth/refresh` p95 response time | < 200ms |

## 3. Target Users

| User Segment | Description | Impact |
|-------------|-------------|--------|
| Super Admins | System administrators managing the agency platform | Session continuity during long admin sessions |
| Regular Users | Staff with limited permissions assigned by super admins | Seamless workflow without re-login interruptions |
| API Consumers | Any client using `/api/auth/token` OAuth2 endpoint (Swagger UI) | Backward-compatible token endpoint |

## 4. User Stories / Job Stories

**US-1: Seamless re-authentication**
As a logged-in user, when my access token expires during active use, the system should silently obtain a new access token using my refresh token, so that I never see a login screen unexpectedly.

**US-2: Explicit logout revocation**
As a user who clicks "Logout", I want my refresh token to be immediately revoked on the server, so that no one can use it to obtain new access tokens after I log out.

**US-3: Stolen token mitigation**
As a super admin, the exposure window of a stolen token should be limited to 15 minutes (access token), reducing the blast radius of a stolen credential.

**JS-1 (Job Story)**: When a 401 response is received by the frontend and a valid refresh token exists, the system should queue the failed request, refresh the token, and retry — all without user intervention.

## 5. Functional Requirements

### P0 — Must Have

| ID | Requirement |
|----|-------------|
| FR-1 | THE SYSTEM SHALL return both `access_token` and `refresh_token` in the login response from `POST /api/auth/login` and `POST /api/auth/token`. |
| FR-2 | THE SYSTEM SHALL provide a `POST /api/auth/refresh` endpoint that accepts a valid, non-revoked refresh token and returns a new access token and a new refresh token (token rotation). |
| FR-3 | WHEN a refresh token is used at `POST /api/auth/refresh`, THE SYSTEM SHALL revoke the consumed refresh token and issue a new one (single-use rotation). |
| FR-4 | WHEN a user calls `POST /api/auth/logout`, THE SYSTEM SHALL revoke all refresh tokens belonging to that user. |
| FR-5 | THE SYSTEM SHALL store refresh tokens in a `refresh_tokens` database table with columns: `id`, `admin_id`, `token_hash` (SHA-256), `expires_at`, `revoked`, `created_at`, `replaced_by` (nullable). |
| FR-6 | WHILE access token TTL is configured, THE SYSTEM SHALL use `ACCESS_TOKEN_EXPIRE_MINUTES = 15` and `REFRESH_TOKEN_EXPIRE_DAYS = 7` as default values in `config.py`. |

### P1 — Should Have

| ID | Requirement |
|----|-------------|
| FR-7 | The frontend `request()` function in `api.ts` SHALL intercept 401 responses, attempt a silent token refresh, and retry the original request exactly once before redirecting to `/login`. |
| FR-8 | The frontend SHALL implement a request queue to prevent multiple concurrent refresh attempts when several API calls fail with 401 simultaneously. |
| FR-9 | The `AuthContext` SHALL store the refresh token in localStorage alongside the access token and clear both on logout. |

### P2 — Could Have

| ID | Requirement |
|----|-------------|
| FR-10 | The system SHOULD provide a `DELETE /api/auth/sessions` endpoint allowing super admins to revoke all refresh tokens for a specific user (force logout). |

## 6. Non-Functional Requirements

- **NFR-1 (Security)**: Refresh tokens MUST be stored as SHA-256 hashes in the database. The raw token value is never persisted server-side.
- **NFR-2 (Security)**: Token rotation MUST be enforced. Reuse of an already-consumed refresh token SHALL revoke the entire token family as a compromise detection mechanism.
- **NFR-3 (Performance)**: `POST /api/auth/refresh` SHALL respond within 200ms at p95 under normal load.
- **NFR-4 (Compatibility)**: Login response MUST remain backward-compatible. `access_token` and `token_type` stay unchanged; `refresh_token` is added as a new field.
- **NFR-5 (Data)**: Expired and revoked refresh tokens SHOULD be cleaned up at application startup to prevent table bloat.

## 7. Technical Constraints

| Constraint | Detail |
|-----------|--------|
| Database | SQLite — single writer. Refresh token operations must be fast to avoid lock contention. |
| JWT library | `python-jose` (already installed). Used for both access and refresh token signing. |
| Login response shape | Additive only — `access_token` and `token_type` fields must remain unchanged. |
| Frontend storage | localStorage (current approach). No httpOnly cookie infrastructure. |
| File size limit | All files must stay under 300 lines per project rules. |

## 8. Out of Scope

- Multi-device session management (no UI to view/manage sessions across devices)
- OAuth2 provider integration (Google/GitHub SSO)
- Remember-me / device trust tokens
- httpOnly cookie migration (future security enhancement)
- Rate limiting on refresh endpoint

## 9. Risks & Open Questions

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Concurrent refresh race condition | Medium | Medium | Request queue in frontend (FR-8); rotation chain detection (NFR-2) |
| Token rotation reuse detection false positives | Low | High | Track `replaced_by` chain; only revoke family on reuse after replacement |
| SQLite write contention | Low | Medium | Keep transactions minimal and single-row |
| localStorage XSS vulnerability | Medium | High | Known accepted risk; future httpOnly cookie migration recommended |

**Open question**: Refresh token format — opaque UUID4 string (recommended: simpler, forces DB validation enabling revocation) vs JWT (self-contained but can't be easily revoked without DB).

## 10. Pre-mortem

| Failure Scenario | Cause | Prevention |
|-----------------|-------|------------|
| Users logged out on every request | Frontend doesn't store new token or refresh endpoint returns wrong format | Integration test: login → refresh → verify API access |
| Infinite refresh loop | Frontend retries 401 on the refresh endpoint itself | FR-7: retry exactly once; if refresh returns 401, redirect to login immediately |
| Refresh token table grows unbounded | No cleanup of expired/revoked tokens | NFR-5: cleanup on startup |
| Legitimate session killed by rotation detection | Network retry looks like token reuse | Grace window: allow the immediately previous token for 30 seconds after replacement |
| Migration breaks existing sessions | Old tokens (no refresh token) become invalid pattern | One-time acceptable: old access tokens remain valid until their 24h expiry |
