# -*- coding: utf-8 -*-
"""Authentication API Router"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

from app.config import settings
from app.services.rate_limit_service import login_rate_limit
from app.models.database import get_db, Admin, AdminRole, ROLE_PERMISSIONS
from app.schemas import Token, TokenData, LoginRequest, AdminCreate, AdminUpdate, AdminResponse
from app.services import token_service
import bcrypt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_user_by_username(db: Session, username: str) -> Optional[Admin]:
    """Return the Admin row matching the given username, or None."""
    return db.query(Admin).filter(Admin.username == username).first()


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Admin:
    """Decode the JWT and return the matching Admin."""
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 정보를 확인할 수 없습니다",
                        headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise exc
    except JWTError:
        raise exc
    user = get_user_by_username(db, username=username)
    if user is None:
        raise exc
    if not user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    return user


async def get_current_active_user(current_user: Admin = Depends(get_current_user)) -> Admin:
    """Return the current user, rejecting inactive accounts."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    return current_user


def check_permission(user: Admin, resource: str, action: str) -> bool:
    """Return True when the user has the requested resource/action permission."""
    if user.role == AdminRole.SUPER_ADMIN:
        return True
    user_perms = user.permissions or {}
    if isinstance(user_perms, list):
        return resource in user_perms
    resource_perms = user_perms.get(resource, [])
    if isinstance(resource_perms, bool):
        return resource_perms
    return action in resource_perms if resource_perms else False


def require_permission(resource: str, action: str):
    """Dependency factory that raises 403 when the permission check fails."""
    def permission_checker(current_user: Admin = Depends(get_current_active_user)):
        if not check_permission(current_user, resource, action):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="해당 작업에 대한 권한이 없습니다")
        return current_user
    return permission_checker


# ============ ENDPOINTS ============

@router.post("/login", response_model=Token)
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db),
                _rl: None = Depends(login_rate_limit)):
    """Login with username/password and receive access + refresh tokens."""
    user = get_user_by_username(db, body.username)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="아이디 또는 비밀번호가 올바르지 않습니다",
                            headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 계정입니다")
    user.last_login = datetime.utcnow()
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    raw_rt = token_service.generate_refresh_token()
    token_service.create_refresh_token(db, user.id, raw_rt)
    db.commit()
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": raw_rt}


@router.post("/token", response_model=Token)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(),
                                  db: Session = Depends(get_db), _rl: None = Depends(login_rate_limit)):
    """OAuth2 token endpoint for Swagger UI compatibility."""
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    raw_rt = token_service.generate_refresh_token()
    token_service.create_refresh_token(db, user.id, raw_rt)
    db.commit()
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": raw_rt}


@router.get("/me", response_model=AdminResponse)
async def get_current_user_info(current_user: Admin = Depends(get_current_active_user)):
    """Return the currently authenticated admin's profile."""
    return current_user


@router.post("/register", response_model=AdminResponse)
async def register_admin(admin: AdminCreate, db: Session = Depends(get_db),
                         current_user: Admin = Depends(require_permission("admin", "create"))):
    """Register a new admin (SUPER_ADMIN only)."""
    if get_user_by_username(db, admin.username):
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다")
    role = AdminRole(admin.role)
    permissions = (ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {}) if role == AdminRole.SUPER_ADMIN
                   else (admin.permissions if hasattr(admin, 'permissions') and admin.permissions else []))
    db_admin = Admin(username=admin.username, password_hash=get_password_hash(admin.password),
                     name=admin.name, email=admin.email, phone=admin.phone, role=role, permissions=permissions)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(db: Session = Depends(get_db),
                      current_user: Admin = Depends(require_permission("admin", "read"))):
    """List all admin accounts."""
    return db.query(Admin).all()


@router.put("/admins/{admin_id}", response_model=AdminResponse)
async def update_admin(admin_id: int, admin_update: AdminUpdate, db: Session = Depends(get_db),
                       current_user: Admin = Depends(require_permission("admin", "update"))):
    """Update an admin account."""
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")
    for key, value in admin_update.dict(exclude_unset=True).items():
        if key == "role" and value:
            new_role = AdminRole(value) if isinstance(value, str) else AdminRole(value.value)
            setattr(admin, key, new_role)
            if new_role == AdminRole.SUPER_ADMIN:
                admin.permissions = ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {})
        else:
            setattr(admin, key, value)
    db.commit()
    db.refresh(admin)
    return admin


@router.post("/admins/{admin_id}/reset-password")
async def reset_admin_password(admin_id: int, data: dict, db: Session = Depends(get_db),
                               current_user: Admin = Depends(get_current_active_user)):
    """Reset another user's password (SUPER_ADMIN only)."""
    if current_user.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="최고 관리자만 비밀번호를 변경할 수 있습니다")
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    new_pw = data.get("new_password", "")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다")
    admin.password_hash = get_password_hash(new_pw)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다"}


@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: int, db: Session = Depends(get_db),
                       current_user: Admin = Depends(require_permission("admin", "delete"))):
    """Delete an admin account (cannot delete self or SUPER_ADMIN)."""
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="관리자를 찾을 수 없습니다")
    if admin.id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다")
    if admin.role == AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="최고 관리자는 삭제할 수 없습니다")
    db.delete(admin)
    db.commit()
    return {"message": "관리자가 삭제되었습니다"}


@router.post("/change-password")
async def change_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_active_user),
):
    """Allow the currently logged-in user to change their own password."""
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")
    if not verify_password(current_pw, current_user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다")
    current_user.password_hash = get_password_hash(new_pw)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다"}


# init-super-admin endpoint removed after initial setup
