# -*- coding: utf-8 -*-
"""
Refresh token lifecycle management.

Responsibilities:
- Generate opaque UUID4 refresh tokens
- Persist only the SHA-256 hash (never the raw token)
- Token rotation on use (old revoked, new issued)
- Family revocation on reuse detection
- Periodic cleanup of expired tokens
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.auth import RefreshToken
from app.config import settings


def generate_refresh_token() -> str:
    """Generate a cryptographically random opaque UUID4 refresh token."""
    return str(uuid.uuid4())


def hash_token(raw: str) -> str:
    """Return the SHA-256 hex digest of the raw token. Only the hash is stored server-side."""
    return hashlib.sha256(raw.encode()).hexdigest()


def create_refresh_token(db: Session, admin_id: int, raw_token: str) -> RefreshToken:
    """Persist a new refresh token (hash only) and return the ORM object."""
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(
        admin_id=admin_id,
        token_hash=hash_token(raw_token),
        expires_at=expires_at,
    )
    db.add(rt)
    db.flush()  # assign id without full commit so caller can link replaced_by
    return rt


def rotate_refresh_token(
    db: Session, old_token: RefreshToken, admin_id: int
) -> tuple[str, RefreshToken]:
    """
    Consume old_token and issue a new one (token rotation).

    Returns (raw_new_token, new_RefreshToken_orm).
    The new token is flushed but NOT committed; caller must commit.
    """
    raw_new = generate_refresh_token()
    new_rt = create_refresh_token(db, admin_id, raw_new)
    old_token.revoked = True
    old_token.replaced_by = new_rt.id
    db.flush()
    return raw_new, new_rt


def revoke_all_user_tokens(db: Session, admin_id: int) -> None:
    """Revoke all non-revoked refresh tokens for a user (normal logout)."""
    db.query(RefreshToken).filter(
        RefreshToken.admin_id == admin_id,
        RefreshToken.revoked == False,  # noqa: E712
    ).update({"revoked": True})


def revoke_token_family(db: Session, admin_id: int) -> None:
    """
    Revoke ALL tokens for a user regardless of current revocation state.

    Called on reuse detection — potential compromise response (R6).
    """
    db.query(RefreshToken).filter(
        RefreshToken.admin_id == admin_id,
    ).update({"revoked": True})


def cleanup_expired_tokens(db: Session) -> int:
    """
    Delete tokens where expires_at < now.

    Revoked-but-not-expired tokens are preserved for reuse-detection chain
    traversal. Returns the count of deleted rows.
    """
    now = datetime.utcnow()
    deleted = db.query(RefreshToken).filter(RefreshToken.expires_at < now).delete()
    db.commit()
    return deleted
