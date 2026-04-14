# -*- coding: utf-8 -*-
"""
일정 API 라우터
Schedule API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Enum as SQLEnum, ForeignKey
from typing import Optional
import math
from datetime import datetime, date
import enum

from app.models.database import get_db, Base
from app.schemas import ScheduleCreate, ScheduleUpdate, EventTypeEnum, ScheduleStatusEnum
from app.routers.auth import require_permission

router = APIRouter()


class EventType(enum.Enum):
    SHOOTING = "shooting"
    MEETING = "meeting"
    EVENT = "event"
    AUDITION = "audition"
    FITTING = "fitting"
    OTHER = "other"


class ScheduleStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    type = Column(SQLEnum(EventType), default=EventType.OTHER)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.PENDING)
    date = Column(Date, nullable=False)
    start_time = Column(String(10))
    end_time = Column(String(10))
    location = Column(String(500))
    model_id = Column(Integer, ForeignKey("models.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    casting_id = Column(Integer, ForeignKey("castings.id"))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


def _schedule_to_dict(s) -> dict:
    """Schedule 객체를 프론트엔드 호환 dict로 변환"""
    # start_datetime / end_datetime 조합
    start_dt = None
    end_dt = None
    if s.date:
        date_str = s.date.isoformat()
        start_time = s.start_time or "00:00"
        start_dt = f"{date_str}T{start_time}:00"
        if s.end_time:
            end_dt = f"{date_str}T{s.end_time}:00"

    return {
        "id": s.id,
        "title": s.title,
        "schedule_type": s.type.value if s.type else None,
        "type": s.type.value if s.type else None,
        "status": s.status.value if s.status else None,
        "start_datetime": start_dt,
        "end_datetime": end_dt,
        "date": s.date.isoformat() if s.date else None,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "location": s.location,
        "model_id": s.model_id,
        "model_name": None,
        "client_id": s.client_id,
        "memo": s.description,
        "description": s.description,
        "created_at": s.created_at,
    }


@router.get("")
async def list_schedules(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    year: Optional[int] = None,
    month: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[EventTypeEnum] = None,
    model_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """일정 목록 조회"""
    Schedule.__table__.create(db.get_bind(), checkfirst=True)

    query = db.query(Schedule)

    # year/month 필터 (기존 방식 유지)
    if year and month:
        from sqlalchemy import extract
        query = query.filter(
            extract('year', Schedule.date) == year,
            extract('month', Schedule.date) == month
        )
    # start_date / end_date 범위 필터 (프론트 신규 방식)
    elif start_date or end_date:
        if start_date:
            try:
                query = query.filter(Schedule.date >= date.fromisoformat(start_date))
            except ValueError:
                pass
        if end_date:
            try:
                query = query.filter(Schedule.date <= date.fromisoformat(end_date))
            except ValueError:
                pass

    if type:
        query = query.filter(Schedule.type == EventType(type.value))

    if model_id:
        query = query.filter(Schedule.model_id == model_id)

    total = query.count()

    schedules = query.order_by(Schedule.date.asc())\
                     .offset((page - 1) * page_size)\
                     .limit(page_size)\
                     .all()

    # 프론트가 배열을 직접 기대하는 경우도 있으므로 배열로 반환
    return [_schedule_to_dict(s) for s in schedules]


@router.get("/date/{date_str}")
async def get_schedules_by_date_prefix(
    date_str: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """특정 날짜 일정 조회 (라우팅 우선순위 확보)"""
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 날짜 형식입니다")

    Schedule.__table__.create(db.get_bind(), checkfirst=True)
    schedules = db.query(Schedule).filter(Schedule.date == target_date).all()
    return [_schedule_to_dict(s) for s in schedules]


@router.get("/{schedule_id}")
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """일정 상세 조회"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다")

    return _schedule_to_dict(schedule)


@router.post("")
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """일정 등록"""
    Schedule.__table__.create(db.get_bind(), checkfirst=True)

    # start_datetime 파싱 (프론트가 ISO datetime 문자열로 보낼 경우)
    sched_date = schedule_data.date
    start_time = schedule_data.start_time
    end_time = schedule_data.end_time

    if schedule_data.start_datetime and not sched_date:
        try:
            dt = datetime.fromisoformat(schedule_data.start_datetime.replace('Z', '+00:00'))
            sched_date = dt.date()
            start_time = dt.strftime('%H:%M')
        except Exception:
            pass

    if schedule_data.end_datetime and not end_time:
        try:
            dt = datetime.fromisoformat(schedule_data.end_datetime.replace('Z', '+00:00'))
            end_time = dt.strftime('%H:%M')
        except Exception:
            pass

    # schedule_type 우선, 없으면 type 사용
    event_type_val = schedule_data.schedule_type or schedule_data.type
    resolved_type = EventType(event_type_val.value) if event_type_val else EventType.OTHER

    # description/memo 병합
    desc = schedule_data.description or schedule_data.memo

    db_schedule = Schedule(
        title=schedule_data.title,
        type=resolved_type,
        date=sched_date or date.today(),
        start_time=start_time,
        end_time=end_time,
        location=schedule_data.location,
        model_id=schedule_data.model_id,
        client_id=schedule_data.client_id,
        casting_id=schedule_data.casting_id,
        description=desc,
    )

    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)

    return {"message": "일정이 등록되었습니다", "id": db_schedule.id}


@router.put("/{schedule_id}")
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """일정 수정"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다")
    
    update_data = schedule_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            setattr(schedule, key, ScheduleStatus(value.value))
        elif key == "type" and value:
            setattr(schedule, key, EventType(value.value))
        elif value is not None:
            setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    return {"message": "일정이 수정되었습니다", "id": schedule_id}


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """일정 삭제"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "일정이 삭제되었습니다"}


