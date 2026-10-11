import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUOTED = "QUOTED"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"

class LeadType(str, enum.Enum):
    ROOM_STAY = "ROOM_STAY"
    BANQUET = "BANQUET"
    WEDDING = "WEDDING"
    CORPORATE_RETREAT = "CORPORATE_RETREAT"
    PARTY_EVENT = "PARTY_EVENT"

class QuotationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_name = Column(String(120), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(150), nullable=True)
    
    lead_type = Column(Enum(LeadType), default=LeadType.ROOM_STAY, nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False, index=True)
    
    expected_check_in = Column(Date, nullable=True)
    expected_check_out = Column(Date, nullable=True)
    guest_count = Column(Integer, default=2)
    estimated_budget = Column(Numeric(10, 2), nullable=True)
    
    source = Column(String(100), default="Website")
    notes = Column(Text, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assigned_to = relationship("User")
    quotations = relationship("Quotation", back_populates="lead", cascade="all, delete-orphan")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    quotation_number = Column(String(50), nullable=False, index=True)  # e.g., "QT-2026-001"
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    
    guest_name = Column(String(120), nullable=False)
    guest_phone = Column(String(50), nullable=False)
    guest_email = Column(String(150), nullable=True)
    
    package_title = Column(String(200), nullable=False)
    valid_until = Column(Date, nullable=True)
    
    items_json = Column(Text, nullable=True)  # JSON list of included items/services
    inclusions = Column(Text, nullable=True)
    exclusions = Column(Text, nullable=True)
    terms_conditions = Column(Text, nullable=True)
    
    subtotal = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    status = Column(Enum(QuotationStatus), default=QuotationStatus.DRAFT, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    lead = relationship("Lead", back_populates="quotations")
    created_by = relationship("User")
