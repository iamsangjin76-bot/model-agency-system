# -*- coding: utf-8 -*-
"""
Database seed script — inserts 17 sample records across 7 tables.
Run with: python -m app.seed  (from the backend/ directory)
"""

from datetime import date
import bcrypt

from app.models.database import SessionLocal, Admin, Model, AdminRole, ModelType, Gender
from app.routers.clients import Client, ClientGrade, Industry
from app.routers.castings import Casting, CastingType, CastingStatus
from app.routers.contracts import Contract, ContractType, ContractStatus
from app.routers.schedules import Schedule, EventType, ScheduleStatus
from app.routers.settlements import Settlement, SettlementType, SettlementStatus


def _hash(password: str) -> str:
    """Hash a plaintext password using bcrypt (matches auth.py)."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def seed_admins(db) -> dict:
    """Insert admin records; return {username: id}."""
    records = [
        dict(username="admin", name="시스템 관리자", role=AdminRole.SUPER_ADMIN, password="admin1234"),
        dict(username="manager1", name="김매니저", role=AdminRole.USER, password="manager1234"),
    ]
    ids = {}
    inserted = skipped = 0
    for r in records:
        existing = db.query(Admin).filter(Admin.username == r["username"]).first()
        if existing:
            ids[r["username"]] = existing.id
            skipped += 1
        else:
            obj = Admin(
                username=r["username"],
                name=r["name"],
                role=r["role"],
                password_hash=_hash(r["password"]),
                is_active=True,
            )
            db.add(obj)
            db.flush()
            ids[r["username"]] = obj.id
            inserted += 1
    return ids, inserted, skipped


def seed_clients(db) -> dict:
    """Insert client records; return {name: id}."""
    records = [
        dict(name="아모레퍼시픽", industry=Industry.COSMETICS, grade=ClientGrade.VIP,
             contact_name="이담당", phone="02-1234-5678"),
        dict(name="삼성전자", industry=Industry.ELECTRONICS, grade=ClientGrade.GOLD,
             contact_name="박담당", phone="02-2345-6789"),
        dict(name="무신사", industry=Industry.FASHION, grade=ClientGrade.NORMAL,
             contact_name="최담당", phone="02-3456-7890"),
    ]
    ids = {}
    inserted = skipped = 0
    for r in records:
        existing = db.query(Client).filter(Client.name == r["name"]).first()
        if existing:
            ids[r["name"]] = existing.id
            skipped += 1
        else:
            obj = Client(**r)
            db.add(obj)
            db.flush()
            ids[r["name"]] = obj.id
            inserted += 1
    return ids, inserted, skipped


def seed_models(db, admin_ids: dict) -> dict:
    """Insert model records; return {name: id}."""
    admin_id = next(iter(admin_ids.values()), None)
    records = [
        dict(name="김민지", model_type=ModelType.NEW_MODEL, gender=Gender.FEMALE,
             height=172, weight=50.0),
        dict(name="이현", model_type=ModelType.INFLUENCER, gender=Gender.MALE,
             height=182, weight=70.0),
        dict(name="Sarah Johnson", model_type=ModelType.FOREIGN_MODEL, gender=Gender.FEMALE,
             height=175, nationality="미국"),
        dict(name="박서준", model_type=ModelType.CELEBRITY, gender=Gender.MALE,
             height=180, weight=68.0),
    ]
    ids = {}
    inserted = skipped = 0
    for r in records:
        existing = db.query(Model).filter(Model.name == r["name"]).first()
        if existing:
            ids[r["name"]] = existing.id
            skipped += 1
        else:
            obj = Model(**r, created_by=admin_id, is_active=True)
            db.add(obj)
            db.flush()
            ids[r["name"]] = obj.id
            inserted += 1
    return ids, inserted, skipped


def seed_castings(db, client_ids: dict) -> dict:
    """Insert casting records; return {title: id}."""
    records = [
        dict(title="봄 화장품 CF 캐스팅", type=CastingType.CF,
             status=CastingStatus.CONFIRMED, client_id=client_ids["아모레퍼시픽"]),
        dict(title="패션 매거진 화보", type=CastingType.MAGAZINE,
             status=CastingStatus.REQUEST, client_id=client_ids["무신사"]),
    ]
    ids = {}
    inserted = skipped = 0
    for r in records:
        existing = db.query(Casting).filter(Casting.title == r["title"]).first()
        if existing:
            ids[r["title"]] = existing.id
            skipped += 1
        else:
            obj = Casting(**r)
            db.add(obj)
            db.flush()
            ids[r["title"]] = obj.id
            inserted += 1
    return ids, inserted, skipped


def seed_contracts(db, model_ids: dict, client_ids: dict) -> dict:
    """Insert contract records; return {contract_number: id}."""
    records = [
        dict(contract_number="2026-001", title="김민지 전속 계약",
             type=ContractType.EXCLUSIVE, status=ContractStatus.ACTIVE,
             model_id=model_ids["김민지"], client_id=client_ids["아모레퍼시픽"],
             amount=12000000, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31)),
        dict(contract_number="2026-002", title="박서준 이벤트 출연",
             type=ContractType.EVENT, status=ContractStatus.DRAFT,
             model_id=model_ids["박서준"], client_id=client_ids["삼성전자"],
             amount=3000000, start_date=date(2026, 5, 1), end_date=date(2026, 5, 31)),
    ]
    ids = {}
    inserted = skipped = 0
    for r in records:
        existing = db.query(Contract).filter(
            Contract.contract_number == r["contract_number"]
        ).first()
        if existing:
            ids[r["contract_number"]] = existing.id
            skipped += 1
        else:
            obj = Contract(**r)
            db.add(obj)
            db.flush()
            ids[r["contract_number"]] = obj.id
            inserted += 1
    return ids, inserted, skipped


def seed_schedules(db, model_ids: dict, client_ids: dict, casting_ids: dict):
    """Insert schedule records."""
    records = [
        dict(title="CF 촬영 1일차", type=EventType.SHOOTING,
             date=date(2026, 5, 1), status=ScheduleStatus.PENDING,
             model_id=model_ids["김민지"], client_id=client_ids["아모레퍼시픽"],
             casting_id=casting_ids["봄 화장품 CF 캐스팅"]),
        dict(title="클라이언트 미팅", type=EventType.MEETING,
             date=date(2026, 4, 20), status=ScheduleStatus.PENDING,
             model_id=None, client_id=client_ids["삼성전자"], casting_id=None),
    ]
    inserted = skipped = 0
    for r in records:
        existing = db.query(Schedule).filter(
            Schedule.title == r["title"], Schedule.date == r["date"]
        ).first()
        if existing:
            skipped += 1
        else:
            obj = Schedule(**r)
            db.add(obj)
            db.flush()
            inserted += 1
    return inserted, skipped


def seed_settlements(db, contract_ids: dict, model_ids: dict, client_ids: dict):
    """Insert settlement records."""
    cid = contract_ids["2026-001"]
    mid = model_ids["김민지"]
    clt = client_ids["아모레퍼시픽"]
    records = [
        dict(title="Q1 에이전시 수수료", type=SettlementType.AGENCY_FEE,
             status=SettlementStatus.COMPLETED, amount=1200000,
             contract_id=cid, model_id=mid, client_id=clt,
             due_date=date(2026, 3, 31), paid_date=date(2026, 3, 28)),
        dict(title="3월 모델료", type=SettlementType.MODEL_PAYMENT,
             status=SettlementStatus.PENDING, amount=1000000,
             contract_id=cid, model_id=mid, client_id=clt,
             due_date=date(2026, 4, 30), paid_date=None),
    ]
    inserted = skipped = 0
    for r in records:
        existing = db.query(Settlement).filter(
            Settlement.title == r["title"],
            Settlement.contract_id == r["contract_id"],
        ).first()
        if existing:
            skipped += 1
        else:
            obj = Settlement(**r)
            db.add(obj)
            db.flush()
            inserted += 1
    return inserted, skipped


def run():
    """Orchestrate seeding in FK-safe order with a single transaction."""
    # Ensure all tables exist before inserting
    from app.models.database import Base, engine
    from app.routers.clients import Client
    from app.routers.castings import Casting
    from app.routers.contracts import Contract
    from app.routers.schedules import Schedule
    from app.routers.settlements import Settlement
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin_ids, a_ins, a_sk = seed_admins(db)
        client_ids, cl_ins, cl_sk = seed_clients(db)
        model_ids, m_ins, m_sk = seed_models(db, admin_ids)
        casting_ids, ca_ins, ca_sk = seed_castings(db, client_ids)
        contract_ids, co_ins, co_sk = seed_contracts(db, model_ids, client_ids)
        sc_ins, sc_sk = seed_schedules(db, model_ids, client_ids, casting_ids)
        se_ins, se_sk = seed_settlements(db, contract_ids, model_ids, client_ids)

        db.commit()

        total_ins = a_ins + cl_ins + m_ins + ca_ins + co_ins + sc_ins + se_ins
        print("=== Seed 완료 ===")
        print(f"admins:      {a_ins}건 삽입 ({a_sk}건 스킵)")
        print(f"clients:     {cl_ins}건 삽입 ({cl_sk}건 스킵)")
        print(f"models:      {m_ins}건 삽입 ({m_sk}건 스킵)")
        print(f"castings:    {ca_ins}건 삽입 ({ca_sk}건 스킵)")
        print(f"contracts:   {co_ins}건 삽입 ({co_sk}건 스킵)")
        print(f"schedules:   {sc_ins}건 삽입 ({sc_sk}건 스킵)")
        print(f"settlements: {se_ins}건 삽입 ({se_sk}건 스킵)")
        print(f"총계:        {total_ins}건 삽입")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
