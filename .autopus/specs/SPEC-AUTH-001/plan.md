# SPEC-AUTH-001 Implementation Plan

## Task List

### Phase 0 — File Size Compliance (prerequisite, sequential)

Three existing files exceed the 300-line hard limit. These must be split before adding new code. See spec.md "Prerequisites" section.

- [ ] **T0a: Split database.py** — Split `backend/app/models/database.py` (320 lines) into:
  - `backend/app/models/auth.py` — `Admin`, enums (`AdminRole`), constants (`ALL_PERMISSIONS`, `SUPER_ADMIN_PERMISSIONS`, `DEFAULT_USER_PERMISSIONS`, `ROLE_PERMISSIONS`), `init_db()`, `get_db()`
  - `backend/app/models/agency.py` — `ModelType`, `Gender`, `Model`, `ModelFile`, `NewsArticle`, `SNSData`, `ShareLink`, `ActivityLog`, `Notification`, `Casting`, `Contract`, `Settlement`, `Schedule` (and any other domain models)
  - `backend/app/models/__init__.py` — re-export `Base`, `engine`, `SessionLocal`, `get_db`, `init_db` for backward compatibility; update all existing `from app.models.database import ...` imports across routers
  
- [ ] **T0b: Split schemas.py** — Split `backend/app/schemas.py` (545 lines) into:
  - `backend/app/schemas/auth.py` — `Token`, `TokenData`, `LoginRequest`, `RefreshRequest`, `AdminCreate`, `AdminUpdate`, `AdminResponse`
  - `backend/app/schemas/agency.py` — All remaining domain schemas (Model, Client, Casting, Contract, Settlement, etc.)
  - `backend/app/schemas/__init__.py` — Re-export everything for backward compatibility; update all existing `from app.schemas import ...` imports
  
- [ ] **T0c: Split api.ts** — Split `frontend/src/services/api.ts` (413 lines) into:
  - `frontend/src/services/auth-api.ts` — Token storage (`accessToken`, `refreshToken`, `setToken`, `clearToken`, `setRefreshToken`, `clearRefreshToken`), the `request()` function (will include refresh interceptor from T9), `authAPI` namespace
  - `frontend/src/services/domain-api.ts` — All domain API namespaces (`modelsAPI`, `castingsAPI`, `clientsAPI`, etc.)
  - `frontend/src/services/api.ts` — Thin re-export barrel: `export * from './auth-api'; export * from './domain-api';` (keep existing import paths working)

### Phase 1 — Backend Core (sequential)

- [ ] **T1: Config update** — Change `ACCESS_TOKEN_EXPIRE_MINUTES` from `60 * 24` to `15` in `backend/app/config.py`. Add `REFRESH_TOKEN_EXPIRE_DAYS: int = 7`.
- [ ] **T2: RefreshToken model** — Add `RefreshToken` SQLAlchemy model to `backend/app/models/database.py` with columns: `id`, `admin_id` (FK), `token_hash` (String, indexed), `expires_at`, `revoked` (Boolean, default False), `created_at`, `replaced_by` (nullable FK → self). Add `refresh_tokens` relationship to `Admin` model.
- [ ] **T3: Schema updates** — In `backend/app/schemas.py`, add `refresh_token: Optional[str] = None` to `Token` schema. Add `RefreshRequest(BaseModel)` with `refresh_token: str` field.
- [ ] **T4: Token service** — Create `backend/app/services/token_service.py` with functions: `generate_refresh_token() -> str` (uuid4), `hash_token(raw: str) -> str` (SHA-256), `create_refresh_token(db, admin_id, raw_token) -> RefreshToken`, `rotate_refresh_token(db, old_hash, admin_id) -> tuple[str, RefreshToken]`, `revoke_all_user_tokens(db, admin_id)`, `revoke_token_family(db, admin_id)`, `cleanup_expired_tokens(db)`.
- [ ] **T5: Login endpoints update** — Modify `login()` and `login_for_access_token()` in `backend/app/routers/auth.py` to generate a refresh token via `token_service`, store its hash in DB, and return both tokens in the response.
- [ ] **T6: Refresh & logout endpoints** — Create `backend/app/routers/token_refresh.py` with: `POST /refresh` (validates refresh token, rotates, returns new pair), `POST /logout` (revokes all user refresh tokens). Mount in `main.py` under `/api/auth` prefix.
- [ ] **T7: Startup cleanup** — Add token cleanup call in `main.py` lifespan startup to remove expired/revoked tokens.

### Phase 2 — Frontend (sequential, after Phase 1)

- [ ] **T8: Token storage** — Update `frontend/src/services/api.ts`: add `refreshToken` variable, `setRefreshToken()`, `clearRefreshToken()` functions mirroring the access token pattern. Update `setToken()` and `clearToken()` to handle both tokens.
- [ ] **T9: Refresh interceptor** — Replace the 401 handler in `request()` with: (1) if refresh token exists and not already refreshing, call `POST /api/auth/refresh`; (2) on success, update both tokens and retry original request; (3) on failure, clear tokens and redirect to `/login`. Implement request queue to hold concurrent 401 requests while refresh is in progress.
- [ ] **T10: AuthContext update** — Update `frontend/src/contexts/AuthContext.tsx`: store refresh token on login, clear both on logout, call `POST /api/auth/logout` before clearing local state.

### Phase 3 — Testing

- [ ] **T11: Backend tests** — Test token issuance (login returns both tokens), refresh rotation (old token revoked, new token works), reuse detection (revoked family), logout revocation, expired token rejection, startup cleanup.
- [ ] **T12: Integration test** — End-to-end: login → wait for access token expiry → refresh → verify API access continues.

## Implementation Strategy

**Approach**: Backend-first, then frontend. The existing `auth.py` is at 303 lines, so new endpoints (refresh, logout) go in a separate `token_refresh.py` router to respect the 300-line limit. Shared token logic (generation, hashing, rotation) is extracted into `token_service.py` to keep routers thin.

**Existing code reuse**: `create_access_token()` in `auth.py` is reused as-is. `get_current_user()` dependency is imported by `token_refresh.py` for the logout endpoint. The `oauth2_scheme` is shared.

**Migration**: No data migration needed. The `refresh_tokens` table is new. Existing access tokens (24h TTL) remain valid until they expire naturally. Users will simply get refresh tokens on their next login.

**Risk mitigation**: The frontend request queue (T9) is the most complex change. It uses a promise-based queue pattern: a single `refreshPromise` variable ensures only one refresh call happens at a time, and all queued requests await the same promise.
