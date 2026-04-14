# -*- coding: utf-8 -*-
"""
Token refresh and logout endpoints.

POST /api/auth/refresh — unauthenticated; identity established via refresh
                         token body only (R4).
POST /api/auth/logout  — requires valid access token.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.database import get_db
from app.models.auth import RefreshToken
from app.schemas import Token, RefreshRequest
from app.routers.auth import (
    create_access_token,
    get_current_active_user,
    Admin,
)
from app.services import token_service
from app.config import settings

router = APIRouter()


@router.post("/refresh", response_model=Token)
async def refresh_tokens(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access + refresh token pair.

    Unauthenticated endpoint — identity is established via the refresh token
    body alone. Implements token rotation (R5) and family revocation on
    reuse detection (R6).
    """
    token_hash = token_service.hash_token(request.refresh_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if rt is None:
        # Unknown token — no DB side-effects (S6 — avoid oracle attacks)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if rt.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    if rt.revoked:
        # Reuse detected — revoke entire family (R6, no grace window)
        token_service.revoke_token_family(db, rt.admin_id)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected; all sessions revoked",
        )

    # Rotate: revoke old token, issue new one
    raw_new_rt, _new_rt = token_service.rotate_refresh_token(db, rt, rt.admin_id)

    # Look up the admin to include in the new access token
    admin = db.query(Admin).filter(Admin.id == rt.admin_id).first()
    if admin is None or not admin.is_active:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(
        data={"sub": admin.username, "role": admin.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": raw_new_rt,
    }


@router.post("/logout")
async def logout(
    current_user: Admin = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Revoke all refresh tokens for the authenticated user (R8).
    The client must also discard its stored tokens.
    """
    token_service.revoke_all_user_tokens(db, current_user.id)
    db.commit()
    return {"message": "Logged out successfully"}
