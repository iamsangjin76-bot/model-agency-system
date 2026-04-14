# -*- coding: utf-8 -*-
"""
인증 API 라우터
Authentication API Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

from app.config import settings
from app.models.database import get_db, Admin, AdminRole, ROLE_PERMISSIONS
from app.schemas import (
    Token, TokenData, LoginRequest, 
    AdminCreate, AdminUpdate, AdminResponse
)
import bcrypt

router = APIRouter()

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_user_by_username(db: Session, username: str) -> Optional[Admin]:
    """사용자명으로 관리자 조회"""
    return db.query(Admin).filter(Admin.username == username).first()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Admin:
    """현재 로그인한 사용자 반환"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    return user


async def get_current_active_user(
    current_user: Admin = Depends(get_current_user)
) -> Admin:
    """활성화된 현재 사용자 반환"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    return current_user


def check_permission(user: Admin, resource: str, action: str) -> bool:
    """권한 확인"""
    # 최고관리자는 모든 권한
    if user.role == AdminRole.SUPER_ADMIN:
        return True
    
    # 일반 사용자는 개별 설정된 권한 확인
    user_perms = user.permissions or {}
    
    # 권한이 리스트로 저장된 경우 (예: ["model", "news", "image"])
    if isinstance(user_perms, list):
        return resource in user_perms
    
    # 권한이 딕셔너리로 저장된 경우
    resource_perms = user_perms.get(resource, [])
    if isinstance(resource_perms, bool):
        return resource_perms
    return action in resource_perms if resource_perms else False


def require_permission(resource: str, action: str):
    """권한 요구 데코레이터"""
    def permission_checker(current_user: Admin = Depends(get_current_active_user)):
        if not check_permission(current_user, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="해당 작업에 대한 권한이 없습니다"
            )
        return current_user
    return permission_checker


# ============ ENDPOINTS ============

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """로그인"""
    user = get_user_by_username(db, request.username)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    
    # 마지막 로그인 시간 업데이트
    user.last_login = datetime.utcnow()
    db.commit()
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 토큰 발급 (Swagger UI용)"""
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=AdminResponse)
async def get_current_user_info(current_user: Admin = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보"""
    return current_user


@router.post("/register", response_model=AdminResponse)
async def register_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_permission("admin", "create"))
):
    """관리자 등록 (SUPER_ADMIN만 가능)"""
    # 중복 체크
    if get_user_by_username(db, admin.username):
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다")
    
    # 역할에 따른 권한 설정
    role = AdminRole(admin.role)
    if role == AdminRole.SUPER_ADMIN:
        permissions = ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {})
    else:
        # 일반 사용자는 전달받은 권한 사용 (없으면 빈 리스트)
        permissions = admin.permissions if hasattr(admin, 'permissions') and admin.permissions else []
    
    # 관리자 생성
    db_admin = Admin(
        username=admin.username,
        password_hash=get_password_hash(admin.password),
        name=admin.name,
        email=admin.email,
        phone=admin.phone,
        role=role,
        permissions=permissions
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    
    return db_admin


@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_permission("admin", "read"))
):
    """관리자 목록 조회"""
    admins = db.query(Admin).all()
    return admins


@router.put("/admins/{admin_id}", response_model=AdminResponse)
async def update_admin(
    admin_id: int,
    admin_update: AdminUpdate,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_permission("admin", "update"))
):
    """관리자 정보 수정"""
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")
    
    update_data = admin_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "role" and value:
            new_role = AdminRole(value) if isinstance(value, str) else AdminRole(value.value)
            setattr(admin, key, new_role)
            # 최고관리자로 변경 시 모든 권한 부여
            if new_role == AdminRole.SUPER_ADMIN:
                admin.permissions = ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {})
        elif key == "permissions":
            # 권한 리스트 직접 설정
            setattr(admin, key, value)
        else:
            setattr(admin, key, value)
    
    db.commit()
    db.refresh(admin)
    return admin


@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(require_permission("admin", "delete"))
):
    """관리자 삭제 (SUPER_ADMIN만 가능)"""
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")
    
    # 자기 자신은 삭제 불가
    if admin.id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다")
    
    # 최고관리자는 삭제 불가
    if admin.role == AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="최고 관리자는 삭제할 수 없습니다")
    
    db.delete(admin)
    db.commit()
    return {"message": "관리자가 삭제되었습니다"}


@router.post("/init-super-admin")
async def init_super_admin(db: Session = Depends(get_db)):
    """초기 슈퍼 관리자 생성 (최초 1회만)"""
    # 이미 관리자가 있는지 확인
    existing = db.query(Admin).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 관리자가 존재합니다")
    
    # 슈퍼 관리자 생성
    super_admin = Admin(
        username="admin",
        password_hash=get_password_hash("admin123"),
        name="시스템 관리자",
        email="admin@agency.com",
        role=AdminRole.SUPER_ADMIN,
        permissions=ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {})
    )
    db.add(super_admin)
    db.commit()
    
    return {"message": "슈퍼 관리자가 생성되었습니다", "username": "admin", "password": "admin123"}
