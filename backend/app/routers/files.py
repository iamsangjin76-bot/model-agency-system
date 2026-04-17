"""
파일 업로드/다운로드 API
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from typing import Optional
import os
import uuid
import shutil

from app.models.database import get_db, Base, ModelFile, Model
from app.config import settings
from app.routers.auth import get_current_user

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


# ============== 계약서 파일 모델 ==============
class ContractFile(Base):
    __tablename__ = "contract_files"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, nullable=False)
    file_type = Column(String(50))
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)


# ============== 유틸리티 ==============
def ensure_upload_dirs():
    dirs = [settings.UPLOAD_DIR, f"{settings.UPLOAD_DIR}/models", f"{settings.UPLOAD_DIR}/contracts"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def save_upload_file(upload_file: UploadFile, sub_dir: str) -> dict:
    ensure_upload_dirs()
    ext = os.path.splitext(upload_file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_dir = os.path.join(settings.UPLOAD_DIR, sub_dir)
    os.makedirs(save_dir, exist_ok=True)
    abs_path = os.path.join(save_dir, unique_name)
    # Store relative path (relative to UPLOAD_DIR) so /uploads/ prefix is not doubled
    rel_path = "/".join([sub_dir.replace("\\", "/"), unique_name])

    with open(abs_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return {
        "file_name": unique_name,
        "original_name": upload_file.filename,
        "file_path": rel_path,
        "abs_path": abs_path,
        "file_size": os.path.getsize(abs_path),
        "mime_type": upload_file.content_type
    }


# ============== 모델 파일 API ==============
@router.post("/model/{model_id}")
async def upload_model_file(
    model_id: int,
    file: UploadFile = File(...),
    file_type: str = Form("portfolio"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")

    # Validate MIME type and file size
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="이미지 파일(JPEG, PNG, WebP)만 업로드 가능합니다")
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다")
    await file.seek(0)

    # Clear old profile flag before setting a new one (Bug C)
    if file_type == "profile":
        db.query(ModelFile).filter(
            ModelFile.model_id == model_id,
            ModelFile.is_profile_image == True
        ).update({"is_profile_image": False})

    sub_dir = model.folder_path if model.folder_path else f"models/{model_id}"
    file_info = save_upload_file(file, sub_dir)

    db_file = ModelFile(
        model_id=model_id,
        file_type=file_type,
        file_name=file_info["file_name"],
        file_path=file_info["file_path"],
        file_size=file_info["file_size"],
        is_profile_image=(file_type == "profile"),  # Bug A fix
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {"id": db_file.id, "file_name": file_info["original_name"], "file_size": db_file.file_size}


@router.get("/model/{model_id}")
async def get_model_files(model_id: int, file_type: Optional[str] = None, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = db.query(ModelFile).filter(ModelFile.model_id == model_id)
    if file_type:
        query = query.filter(ModelFile.file_type == file_type)
    return [{"id": f.id, "file_type": f.file_type, "file_name": f.file_name, "file_size": f.file_size} for f in query.all()]


@router.get("/download/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    file = db.query(ModelFile).filter(ModelFile.id == file_id).first()
    abs_path = os.path.join(settings.UPLOAD_DIR, file.file_path) if file else None
    if not file or not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    return FileResponse(path=abs_path, filename=file.file_name)


@router.delete("/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    file = db.query(ModelFile).filter(ModelFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    abs_path = os.path.join(settings.UPLOAD_DIR, file.file_path)
    if os.path.exists(abs_path):
        os.remove(abs_path)
    db.delete(file)
    db.commit()
    return {"message": "파일이 삭제되었습니다"}


# ============== 계약서 파일 API ==============
@router.post("/contract/{contract_id}")
async def upload_contract_file(
    contract_id: int,
    file: UploadFile = File(...),
    file_type: str = Form("contract"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    ContractFile.__table__.create(db.get_bind(), checkfirst=True)
    file_info = save_upload_file(file, f"contracts/{contract_id}")
    
    db_file = ContractFile(
        contract_id=contract_id, file_type=file_type,
        file_name=file_info["file_name"], original_name=file_info["original_name"],
        file_path=file_info["file_path"], file_size=file_info["file_size"],
        mime_type=file_info["mime_type"], uploaded_by=current_user["id"]
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"id": db_file.id, "file_name": db_file.original_name}


@router.get("/contract/{contract_id}")
async def get_contract_files(contract_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    ContractFile.__table__.create(db.get_bind(), checkfirst=True)
    files = db.query(ContractFile).filter(ContractFile.contract_id == contract_id).all()
    return [{"id": f.id, "file_type": f.file_type, "file_name": f.original_name, "file_size": f.file_size} for f in files]
