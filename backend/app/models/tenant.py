import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BillingCycle(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    HALF_YEARLY = "HALF_YEARLY"
    YEARLY = "YEARLY"
    LIFETIME = "LIFETIME"

class TenantStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    TRIAL = "TRIAL"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"

class BusinessType(str, enum.Enum):
    RESORT = "RESORT"
    HOTEL = "HOTEL"
    RESTAURANT = "RESTAURANT"
    HYBRID = "HYBRID"
    HOMESTAY = "HOMESTAY"

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY, nullable=False)
    price = Column(Numeric(10, 2), default=0.00, nullable=False)
    max_rooms = Column(Integer, default=20, nullable=False)
    max_properties = Column(Integer, default=1, nullable=False)
    max_staff = Column(Integer, default=5, nullable=False)
    features_json = Column(Text, nullable=True)  # JSON encoded list of features
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenants = relationship("Tenant", back_populates="subscription_plan")

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    business_type = Column(Enum(BusinessType), default=BusinessType.RESORT, nullable=False)
    subscription_plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)
    status = Column(Enum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)
    
    max_rooms = Column(Integer, default=20)
    max_properties = Column(Integer, default=1)
    max_staff = Column(Integer, default=5)
    
    contact_name = Column(String(100), nullable=True)
    contact_email = Column(String(150), nullable=False, index=True)
    contact_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    postal_code = Column(String(20), nullable=True)
    tax_id_gstin = Column(String(50), nullable=True)
    
    currency = Column(String(10), default="INR")
    currency_symbol = Column(String(10), default="₹")
    timezone = Column(String(50), default="Asia/Kolkata")
    logo_url = Column(String(255), nullable=True)
    
    subscription_starts_at = Column(DateTime, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subscription_plan = relationship("SubscriptionPlan", back_populates="tenants")
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="tenant", cascade="all, delete-orphan")
