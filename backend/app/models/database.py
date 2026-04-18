# -*- coding: utf-8 -*-
"""
모델 에이전시 관리 시스템 - 데이터베이스 모델
Model Agency Management System - Database Models
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Enum, Date, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

# 데이터베이스 설정
DATABASE_URL = "sqlite:///./model_agency.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============ ENUMS ============

class AdminRole(enum.Enum):
    """관리자 등급"""
    SUPER_ADMIN = "super_admin"      # 최고 관리자: 모든 권한
    USER = "user"                     # 사용자: 최고관리자가 설정한 권한만


class ModelType(enum.Enum):
    """모델 유형"""
    NEW_MODEL = "new_model"           # 신인 모델
    INFLUENCER = "influencer"         # 인플루언서
    FOREIGN_MODEL = "foreign_model"   # 외국인 모델
    CELEBRITY = "celebrity"           # 연예인


class Gender(enum.Enum):
    """성별"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


# ============ MODELS ============

class Admin(Base):
    """관리자 테이블"""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    role = Column(Enum(AdminRole), default=AdminRole.USER)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 권한 설정 (JSON으로 세부 권한 저장)
    permissions = Column(JSON, default={})


class Model(Base):
    """모델 테이블"""
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 기본 정보
    name = Column(String(100), nullable=False, index=True)
    name_english = Column(String(100))  # 영문 이름
    birth_date = Column(Date)
    gender = Column(Enum(Gender))
    model_type = Column(Enum(ModelType), default=ModelType.NEW_MODEL)
    
    # 신체 정보
    height = Column(Integer)  # cm
    weight = Column(Float)    # kg
    bust = Column(Integer)    # cm
    waist = Column(Integer)   # cm
    hip = Column(Integer)     # cm
    shoe_size = Column(Integer)  # mm
    
    # 소속사 정보
    agency_name = Column(String(100))
    agency_phone = Column(String(20))
    agency_fax = Column(String(20))
    has_agency = Column(Boolean, default=False)
    has_manager = Column(Boolean, default=False)
    
    # 연락처
    contact1 = Column(String(20))
    contact2 = Column(String(20))
    contact3 = Column(String(20))
    contact4 = Column(String(20))
    personal_contact = Column(String(20))
    home_phone = Column(String(20))
    contact_note = Column(Text)  # 연락시 유의점
    
    # 개인 정보
    school = Column(String(100))  # 출신학교
    debut = Column(String(100))   # 데뷔
    hobby = Column(Text)          # 취미/특기
    nationality = Column(String(50))  # 국적
    passport_no = Column(String(50))  # 여권번호
    visa_type = Column(String(50))    # 비자
    languages = Column(Text)          # 외국어 능력
    
    # 외국인 모델 전용
    career_years = Column(Integer)    # 경력 년수
    entry_date = Column(Date)         # 입국일
    departure_date = Column(Date)     # 출국일
    
    # 경력 정보
    career_broadcast = Column(Text)   # 방송
    career_movie = Column(Text)       # 영화
    career_commercial = Column(Text)  # 광고
    career_print_ad = Column(Text)    # 지면광고
    career_theater = Column(Text)     # 연극
    career_album = Column(Text)       # 앨범
    career_musical = Column(Text)     # 뮤지컬
    career_fashion_show = Column(Text)  # 패션쇼
    career_music_video = Column(Text)   # 뮤직비디오
    career_other = Column(Text)       # 기타
    
    # 연예인 전용 - 모델료
    model_fee_6month = Column(Integer)  # 6개월 모델료
    model_fee_1year = Column(Integer)   # 1년 모델료
    current_works = Column(Text)        # 현재 진행 작품
    current_ads = Column(Text)          # 현재 광고
    
    # SNS 정보
    instagram_id = Column(String(100))
    instagram_followers = Column(Integer)
    youtube_id = Column(String(100))
    youtube_subscribers = Column(Integer)
    tiktok_id = Column(String(100))
    tiktok_followers = Column(Integer)
    
    # 키워드 및 메모
    keywords = Column(Text)
    memo = Column(Text)
    
    # 폴더 경로 (뉴스, 이미지 저장 위치)
    folder_path = Column(String(500))
    
    # 메타 정보
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("admins.id"))
    
    # 관계
    files = relationship("ModelFile", back_populates="model")
    news_articles = relationship("NewsArticle", back_populates="model")
    sns_data = relationship("SNSData", back_populates="model")
    saved_news = relationship("ModelNews", back_populates="model")
    search_images = relationship("ModelSearchImage", back_populates="model")


class ModelFile(Base):
    """모델 첨부파일 테이블"""
    __tablename__ = "model_files"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))  # image, document, video
    file_size = Column(Integer)
    is_profile_image = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    model = relationship("Model", back_populates="files")


class NewsArticle(Base):
    """뉴스 기사 테이블"""
    __tablename__ = "news_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text)
    source = Column(String(200))  # 출처
    url = Column(String(1000))
    published_date = Column(DateTime)
    saved_path = Column(String(500))  # 로컬 저장 경로
    created_at = Column(DateTime, default=datetime.utcnow)
    
    model = relationship("Model", back_populates="news_articles")


class SNSData(Base):
    """SNS 데이터 테이블"""
    __tablename__ = "sns_data"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    platform = Column(String(50))  # instagram, youtube, tiktok
    followers = Column(Integer)
    posts_count = Column(Integer)
    avg_views = Column(Integer)
    avg_likes = Column(Integer)
    engagement_rate = Column(Float)
    
    # 팔로워 분석 데이터 (JSON)
    follower_demographics = Column(JSON)  # 연령, 성별, 국가별 분포
    
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    model = relationship("Model", back_populates="sns_data")


class ShareLink(Base):
    """외부 공유 링크 테이블"""
    __tablename__ = "share_links"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    share_code = Column(String(50), unique=True, nullable=False)
    share_type = Column(String(20))  # profile, portfolio
    expires_at = Column(DateTime)
    view_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("admins.id"))


# ============ 권한 설정 ============

# 사용 가능한 모든 권한 목록
ALL_PERMISSIONS = {
    "model": "모델 관리",
    "news": "뉴스 검색",
    "image": "이미지 검색",
    "profile": "프로필 다운로드",
    "sns": "SNS 분석",
    "casting": "캐스팅 관리",
    "client": "고객 관리",
    "schedule": "일정 관리",
    "contract": "계약 관리",
    "settlement": "정산 관리",
    "share": "외부 공유",
    "settings": "시스템 설정",
}

# 최고관리자 기본 권한 (모든 권한)
SUPER_ADMIN_PERMISSIONS = list(ALL_PERMISSIONS.keys()) + ["admin"]

# 일반 사용자 기본 권한 (없음 - 최고관리자가 설정)
DEFAULT_USER_PERMISSIONS = []

ROLE_PERMISSIONS = {
    AdminRole.SUPER_ADMIN: {
        "model": ["create", "read", "update", "delete", "export"],
        "admin": ["create", "read", "update", "delete"],
        "news": ["search", "save", "delete"],
        "image": ["search", "save", "delete"],
        "profile": ["generate", "download", "share"],
        "sns": ["fetch", "view"],
        "casting": ["create", "read", "update", "delete"],
        "client": ["create", "read", "update", "delete"],
        "schedule": ["create", "read", "update", "delete"],
        "contract": ["create", "read", "update", "delete"],
        "settlement": ["create", "read", "update", "delete"],
        "share": ["create", "read", "delete"],
        "settings": ["view", "modify"],
    },
    AdminRole.USER: {
        # 기본값은 비어있음, 최고관리자가 개별 설정
    },
}


def init_db():
    """데이터베이스 초기화"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """데이터베이스 세션 반환"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")

class ActivityLog(Base):
    """활동 로그 테이블"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    action = Column(String(50), nullable=False)  # create, update, delete, login, logout
    target_type = Column(String(50))  # model, client, casting, contract, etc.
    target_id = Column(Integer)
    target_name = Column(String(200))  # 이름이나 타이틀
    details = Column(Text)  # 상세 내용
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    """알림 테이블"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text)
    notification_type = Column(String(50))  # casting, contract, settlement, system
    is_read = Column(Boolean, default=False)
    link_url = Column(String(200))  # link URL navigated on click
    target_type = Column(String(50), nullable=True)   # entity type: casting, settlement, model
    target_id = Column(Integer, nullable=True)         # entity ID for dedup and linking
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_notifications_admin_unread", "admin_id", "is_read"),
        Index("idx_notifications_admin_created", "admin_id", "created_at"),
        Index("idx_notifications_target", "target_type", "target_id"),
    )
