import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class IdType(str, enum.Enum):
    AADHAAR = "AADHAAR"
    PASSPORT = "PASSPORT"
    DRIVING_LICENSE = "DRIVING_LICENSE"
    VOTER_ID = "VOTER_ID"
    NATIONAL_ID = "NATIONAL_ID"
    OTHER = "OTHER"

class VIPTier(str, enum.Enum):
    STANDARD = "STANDARD"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"

class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    email = Column(String(150), nullable=True, index=True)
    phone = Column(String(50), nullable=False, index=True)
    alternate_phone = Column(String(50), nullable=True)
    
    id_type = Column(Enum(IdType), default=IdType.AADHAAR, nullable=True)
    id_number = Column(String(100), nullable=True)
    id_document_url = Column(String(255), nullable=True)
    
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    
    vip_tier = Column(Enum(VIPTier), default=VIPTier.STANDARD, nullable=False)
    dietary_preferences = Column(String(200), nullable=True)  # e.g., "Jain Veg", "Vegan", "Nut allergy"
    special_preferences = Column(Text, nullable=True)         # e.g., "Prefers quiet room near pool"
    is_blacklisted = Column(Boolean, default=False, nullable=False)
    
    total_stays = Column(Integer, default=0)
    total_spend = Column(Numeric(12, 2), default=0.00)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    bookings = relationship("Booking", back_populates="guest")
