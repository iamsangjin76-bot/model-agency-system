# SPEC-AUTH-001 Research

## Existing Code Analysis

### Authentication Flow (current)

**`backend/app/routers/auth.py`** (303 lines):
- `create_access_token(data, expires_delta)` — generates JWT with `python-jose`. Encodes `sub` (username) and `role` into payload. Uses `settings.SECRET_KEY` and `settings.ALGORITHM` ("HS256").
- `get_current_user(token, db)` — decodes JWT, looks up `Admin` by username, checks `is_active`. This is the standard FastAPI dependency used across all routers.
- `login()` (line 126) — validates credentials, updates `last_login`, calls `create_access_token()`, returns `{"access_token": ..., "token_type": "bearer"}`.
- `login_for_access_token()` (line 153) — OAuth2-compatible endpoint for Swagger UI. Same logic, uses `OAuth2PasswordRequestForm`.
- Additional endpoints: `/me`, `/register`, `/admins`, `/admins/{id}` (CRUD), `/init-super-admin`.

**Key observation**: `auth.py` is at 303 lines — already over the 300-line limit. Adding refresh/logout endpoints here would push it to ~350+. A separate router file is required.

### Configuration (`backend/app/config.py`, 66 lines)

- `ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24` (line 30) — needs to change to `15`.
- `SECRET_KEY`, `ALGORITHM` already defined and used by `auth.py`.
- `REFRESH_TOKEN_EXPIRE_DAYS` does not exist — needs to be added.

### Database Models (`backend/app/models/database.py`, 320 lines)

- `Admin` model (line 45): has `id`, `username`, `password_hash`, `role`, `is_active`, etc.
- No existing relationship field for refresh tokens on `Admin`.
- Other models: `Model`, `ModelFile`, `NewsArticle`, `SNSData`, `ShareLink`, `ActivityLog`, `Notification`.
- `init_db()` (line 277) calls `Base.metadata.create_all()` — new `RefreshToken` model will be auto-created on next startup.
- File is 320 lines. Adding `RefreshToken` (~15 lines) pushes to ~335, but `database.py` contains only model definitions (excluded from the 300-line limit by being declarative data, though technically it is `.py`). Consider: the model is small enough that this is acceptable; if needed, models could be split into `models/auth.py` and `models/agency.py` in a future refactor.

### Schemas (`backend/app/schemas.py`, 546 lines)

- `Token` (line 34): `access_token: str`, `token_type: str = "bearer"`. Adding `refresh_token: Optional[str] = None` preserves backward compat.
- `TokenData` (line 39): `username`, `role` — unchanged.
- `LoginRequest` (line 44): `username`, `password`, `server_ip` — unchanged.

### Frontend API Client (`frontend/src/services/api.ts`, 414 lines)

- `accessToken` (line 8): module-level variable, initialized from `localStorage.getItem('access_token')`.
- `setToken()` / `clearToken()` / `getToken()` (lines 10-20): manage single token.
- `request<T>()` (line 23): generic fetch wrapper. On 401: `clearToken()` + `window.location.href = '/login'` (line 42-45). This is where the refresh interceptor must be inserted.
- `authAPI.login()` (line 87): returns `{ access_token, token_type }`. Needs to also extract `refresh_token`.

**Key observation**: The 401 handler on lines 42-45 is a simple clear-and-redirect. Replacing this with a refresh interceptor + request queue is the largest frontend change.

### Frontend AuthContext (`frontend/src/contexts/AuthContext.tsx`, 98 lines)

- `login()` (line 48): calls `authAPI.login()`, then `setToken(result.access_token)`, then `authAPI.me()`. Needs to also call `setRefreshToken(result.refresh_token)`.
- `logout()` (line 55): calls `clearToken()` and `setUser(null)`. Needs to also: (1) call `POST /api/auth/logout`, (2) clear refresh token.

### App Startup (`backend/app/main.py`, 79 lines)

- `lifespan()` (line 14): calls `init_db()`. Token cleanup should be added here after `init_db()`.
- Auth router mounted at line 43: `app.include_router(auth.router, prefix="/api/auth", tags=["auth"])`. The new `token_refresh.router` should be mounted similarly with the same prefix.

## Design Decisions

### Opaque UUID4 vs JWT for refresh token

**Chosen: Opaque UUID4.**
- Forces server-side validation on every refresh, which enables instant revocation.
- Simpler implementation — no JWT encoding/decoding for refresh tokens.
- The refresh token is never decoded client-side; it is only sent back to the server.
- A JWT refresh token would add complexity (separate signing key? same key?) with no benefit since we must check the DB anyway for revocation.

### SHA-256 hashing for storage

**Chosen: SHA-256 of raw token stored in DB.**
- If the database is compromised, the attacker cannot reconstruct valid refresh tokens.
- SHA-256 is fast enough for single-row lookups (no bcrypt needed — refresh tokens are high-entropy UUIDs, not user-chosen passwords).
- Lookup: `WHERE token_hash = SHA256(presented_token)` with an index on `token_hash`.

### Token rotation with family revocation

**Chosen: Single-use rotation + family revocation on reuse detection.**
- Each refresh consumes the current token and issues a new one.
- `replaced_by` column creates a chain: RT-A → RT-B → RT-C.
- If RT-A is presented again after being replaced, all tokens for that `admin_id` are revoked (compromise signal).
- PRD mentions a 30-second grace window for the previous token. This is deferred to implementation — the SPEC requires reuse detection but the executor may implement a short grace period if network retry scenarios warrant it.

### Separate router file for new endpoints

**Chosen: `token_refresh.py` instead of adding to `auth.py`.**
- `auth.py` is at 303 lines — already over the 300-line hard limit.
- Adding refresh + logout endpoints would add ~60-80 lines.
- A separate file keeps both under the limit and provides cleaner separation of concerns (credential-based auth vs. token lifecycle management).

### Service layer extraction

**Chosen: `token_service.py` for token business logic.**
- Both `auth.py` (login) and `token_refresh.py` (refresh) need to create refresh tokens.
- Extracting to a service avoids circular imports and code duplication.
- Service handles: generation, hashing, DB storage, rotation, revocation, cleanup.

### Frontend request queue pattern

**Chosen: Promise-based queue with a single `refreshPromise`.**
- When the first 401 triggers a refresh, `refreshPromise` is set to the refresh API call.
- Subsequent 401s check `isRefreshing` flag and await the same `refreshPromise`.
- Once resolved, all queued requests retry with the new token.
- This is a well-established pattern (axios interceptor equivalent for fetch).

## References

- PRD: `.autopus/specs/SPEC-AUTH-001/prd.md`
- OWASP Token Best Practices: refresh token rotation, secure storage
- FastAPI OAuth2 docs: `OAuth2PasswordBearer`, dependency injection pattern
