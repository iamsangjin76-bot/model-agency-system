# SPEC-AUTH-001 Acceptance Criteria

## Scenarios

### S1: Login returns both tokens

- **Given**: A valid user account exists with username `admin` and password `admin123`
- **When**: The user sends `POST /api/auth/login` with correct credentials
- **Then**: The response contains `access_token` (non-empty string), `refresh_token` (UUID4 format string), and `token_type: "bearer"`
- **And**: The `access_token` JWT payload has an `exp` claim set to ~15 minutes from now
- **And**: A row exists in `refresh_tokens` table with `admin_id` matching the user and `revoked = false`

### S2: OAuth2 token endpoint returns both tokens

- **Given**: A valid user account exists
- **When**: The user sends `POST /api/auth/token` with correct form-encoded credentials
- **Then**: The response contains `access_token`, `refresh_token`, and `token_type: "bearer"` (same structure as S1)

### S3: Successful token refresh with rotation

- **Given**: A user has logged in and holds a valid refresh token `RT-A`
- **When**: The user sends `POST /api/auth/refresh` with `{"refresh_token": "RT-A"}`
- **Then**: The response contains a new `access_token` and a new `refresh_token` (`RT-B`, different from `RT-A`)
- **And**: The DB row for `RT-A` hash has `revoked = true` and `replaced_by` pointing to `RT-B` hash row
- **And**: The DB row for `RT-B` hash has `revoked = false`

### S4: Expired refresh token is rejected

- **Given**: A refresh token `RT-X` exists in DB but `expires_at` is in the past
- **When**: The user sends `POST /api/auth/refresh` with `{"refresh_token": "RT-X"}`
- **Then**: The response is `401 Unauthorized` with detail message indicating token expiry
- **And**: No new tokens are issued

### S5: Revoked refresh token is rejected

- **Given**: A refresh token `RT-A` has been used once (revoked, replaced by `RT-B`)
- **When**: The user sends `POST /api/auth/refresh` with `{"refresh_token": "RT-A"}`
- **Then**: The response is `401 Unauthorized`
- **And**: All active refresh tokens for that user are revoked (token family compromise detection)

### S6: Invalid/unknown refresh token is rejected

- **Given**: A random UUID4 string that does not exist in the database
- **When**: The user sends `POST /api/auth/refresh` with that string
- **Then**: The response is `401 Unauthorized`
- **And**: No database modifications occur

### S7: Logout revokes all refresh tokens

- **Given**: A user has 3 active (non-revoked) refresh tokens in the database
- **When**: The user sends `POST /api/auth/logout` with a valid access token in the Authorization header
- **Then**: The response is `200 OK`
- **And**: All 3 refresh token rows for that user have `revoked = true`
- **And**: Subsequent refresh attempts with any of those tokens return `401`

### S8: Startup cleanup removes stale tokens

- **Given**: The `refresh_tokens` table contains rows that are expired (`expires_at < now`), regardless of `revoked` status
- **When**: The application starts (lifespan startup)
- **Then**: Only rows where `expires_at < now` are deleted (expired tokens are safe to remove even if revoked, since a revoked-but-not-expired token's `replaced_by` chain is no longer useful once it has expired)
- **And**: Non-expired rows (including non-expired revoked tokens needed for reuse-detection chain R6) remain untouched until their natural expiry
- **Note**: Revoked-but-not-expired tokens must NOT be deleted immediately, as R6 requires the rotation chain (`replaced_by`) to be intact to detect token family reuse attempts during the active TTL window

### S9: Frontend silent refresh on 401

- **Given**: The frontend has a valid refresh token in localStorage and the access token has expired
- **When**: An API request returns 401
- **Then**: The frontend automatically calls `POST /api/auth/refresh` with the stored refresh token
- **And**: On success, both tokens in localStorage are updated and the original request is retried
- **And**: The user sees no login screen or error

### S10: Frontend concurrent 401 handling (no refresh storm)

- **Given**: The access token has expired and 3 API calls are in flight simultaneously
- **When**: All 3 receive 401 responses at roughly the same time
- **Then**: Only 1 refresh request is sent to the server
- **And**: All 3 original requests are retried with the new access token after the single refresh completes

### S11: Frontend redirect on refresh failure

- **Given**: Both the access token and refresh token are invalid/expired
- **When**: An API request returns 401 and the refresh attempt also returns 401
- **Then**: Both tokens are cleared from localStorage
- **And**: The user is redirected to `/login`

### S12: Frontend logout clears both tokens

- **Given**: The user is logged in with both tokens in localStorage
- **When**: The user clicks the logout button
- **Then**: `POST /api/auth/logout` is called with the access token
- **And**: Both `access_token` and `refresh_token` are removed from localStorage
- **And**: The user is redirected to the login page

### S13: Backward compatibility — access_token field unchanged

- **Given**: An existing API consumer expects `{"access_token": "...", "token_type": "bearer"}` from login
- **When**: The consumer calls `POST /api/auth/login`
- **Then**: The response still contains `access_token` and `token_type` with the same semantics
- **And**: The `refresh_token` field is additive and does not break existing consumers that ignore unknown fields
