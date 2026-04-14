# -*- coding: utf-8 -*-
"""
설정 파일
Configuration settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 앱 정보
    APP_NAME: str = "Model Agency Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./model_agency.db"
    
    # JWT 설정
    SECRET_KEY: str = "your-secret-key-change-in-production-model-agency-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS 설정
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://192.168.0.34:5173",
        "http://192.168.0.34:5174",
        "http://192.168.0.51:5173",
        "https://model-agency-app.loca.lt",
        "https://model-agency-api.loca.lt",
    ]
    
    # 파일 업로드
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_DOCUMENT_TYPES: list = ["application/pdf", "application/vnd.ms-powerpoint", 
                                     "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
    
    # 모델 폴더
    MODEL_FILES_DIR: str = "./model_files"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# 업로드 디렉토리 생성
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_FILES_DIR, exist_ok=True)
