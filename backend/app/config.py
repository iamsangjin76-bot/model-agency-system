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

    # Search API credentials (optional — graceful degradation when unset)
    NAVER_CLIENT_ID: Optional[str] = None
    NAVER_CLIENT_SECRET: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CX: Optional[str] = None
    SEARCH_REQUEST_TIMEOUT: int = 5
    SEARCH_IMAGE_MAX_SIZE: int = 10 * 1024 * 1024  # 10MB

    # ── Image proxy (J-8a) ────────────────────────────────────────────────
    IMAGE_PROXY_ALLOWED_DOMAINS: str = (
        "imgnews.naver.net,naver.net,blogfiles.naver.net,"
        "postfiles.pstatic.net,ssl.pstatic.net,"
        "i1.ruliweb.com,i2.ruliweb.com,i3.ruliweb.com,"
        "image.fmkorea.com,img.insight.co.kr"
    )
    IMAGE_PROXY_MAX_SIZE: int = 10_485_760   # 10 MB
    IMAGE_PROXY_TIMEOUT: float = 5.0          # seconds
    IMAGE_PROXY_CACHE_DIR: str = "proxy_cache"
    IMAGE_PROXY_CACHE_TTL: int = 604800        # 7 days (SPEC §3.2)

    @property
    def image_proxy_allowed_suffixes(self) -> list[str]:
        """Parse comma-separated domain list into a list of suffix strings."""
        return [d.strip() for d in self.IMAGE_PROXY_ALLOWED_DOMAINS.split(",") if d.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# 업로드 디렉토리 생성
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_FILES_DIR, exist_ok=True)
