# -*- coding: utf-8 -*-
"""Backup API Router — download DB + uploads as a zip archive."""

import os
import io
import zipfile
import shutil
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import get_db
from app.routers.auth import get_current_active_user, AdminRole
from app.models.database import Admin

router = APIRouter()

# Backup secret key from env (set in Railway Variables)
BACKUP_SECRET = os.environ.get("BACKUP_SECRET_KEY", "")


def _require_backup_secret(x_backup_secret: str = Header(...)):
    """Validate the backup secret key header."""
    if not BACKUP_SECRET:
        raise HTTPException(status_code=503, detail="Backup not configured")
    if x_backup_secret != BACKUP_SECRET:
        raise HTTPException(status_code=403, detail="Invalid backup secret")


@router.get("/download")
async def download_backup(
    _: None = Depends(_require_backup_secret),
):
    """
    Download a zip archive containing the SQLite DB and uploads.
    Requires X-Backup-Secret header matching BACKUP_SECRET_KEY env var.
    """
    # Resolve paths
    db_url = settings.DATABASE_URL  # e.g. sqlite:////data/model_agency.db
    if db_url.startswith("sqlite:///"):
        db_path = db_url[len("sqlite:///"):]
    else:
        db_path = None

    upload_dir = settings.UPLOAD_DIR
    model_files_dir = settings.MODEL_FILES_DIR

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"model_agency_backup_{timestamp}.zip"

    def generate_zip():
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # Add SQLite DB
            if db_path and os.path.exists(db_path):
                zf.write(db_path, arcname="model_agency.db")

            # Add uploads directory
            if os.path.exists(upload_dir):
                for root, _, files in os.walk(upload_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        arcname = os.path.relpath(full_path, os.path.dirname(upload_dir))
                        zf.write(full_path, arcname=arcname)

            # Add model files directory
            if os.path.exists(model_files_dir):
                for root, _, files in os.walk(model_files_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        arcname = os.path.relpath(full_path, os.path.dirname(model_files_dir))
                        zf.write(full_path, arcname=arcname)

        buffer.seek(0)
        yield buffer.read()

    return StreamingResponse(
        generate_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'},
    )


@router.get("/status")
async def backup_status(
    current_user: Admin = Depends(get_current_active_user),
):
    """Return backup configuration status (super admin only)."""
    if current_user.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="권한이 없습니다")
    return {
        "backup_configured": bool(BACKUP_SECRET),
        "db_path": settings.DATABASE_URL,
        "upload_dir": settings.UPLOAD_DIR,
        "model_files_dir": settings.MODEL_FILES_DIR,
    }
