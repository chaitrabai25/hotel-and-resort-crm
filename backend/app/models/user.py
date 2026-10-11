import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TENANT_ADMIN = "TENANT_ADMIN"
    GENERAL_MANAGER = "GENERAL_MANAGER"
    RECEPTIONIST = "RECEPTIONIST"
    POS_CASHIER = "POS_CASHIER"
    POS_WAITER = "POS_WAITER"
    HOUSEKEEPING_SUPERVISOR = "HOUSEKEEPING_SUPERVISOR"
    HOUSEKEEPING_STAFF = "HOUSEKEEPING_STAFF"
    ACCOUNTANT = "ACCOUNTANT"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.TENANT_ADMIN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    avatar_url = Column(String(255), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="users")
