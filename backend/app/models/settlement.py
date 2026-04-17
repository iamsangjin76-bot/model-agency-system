# -*- coding: utf-8 -*-
"""
Settlement ORM model and related enums.
Separated to keep the router file under the 300-line limit.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, Enum as SQLEnum, ForeignKey

from app.models.database import Base


class SettlementStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SettlementType(enum.Enum):
    MODEL_PAYMENT = "model_payment"
    AGENCY_FEE = "agency_fee"
    EXPENSE = "expense"
    REFUND = "refund"


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    type = Column(SQLEnum(SettlementType), nullable=False)
    status = Column(SQLEnum(SettlementStatus), default=SettlementStatus.PENDING)
    amount = Column(Integer, nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date)
    bank_info = Column(String(200))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
