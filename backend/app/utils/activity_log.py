# coding: utf-8
from sqlalchemy.orm import Session
from app.models.database import ActivityLog

def log_activity(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str = None,
    target_id: int = None,
    target_name: str = None,
    details: str = None,
    ip_address: str = None
):
    log = ActivityLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    return log
