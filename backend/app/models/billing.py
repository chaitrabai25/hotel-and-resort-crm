import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FolioCategory(str, enum.Enum):
    ROOM = "ROOM"
    RESTAURANT = "RESTAURANT"
    LAUNDRY = "LAUNDRY"
    SPA = "SPA"
    TRANSPORT = "TRANSPORT"
    MINIBAR = "MINIBAR"
    MISC = "MISC"

class FolioStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    NETBANKING = "NETBANKING"
    ROOM_CHARGE = "ROOM_CHARGE"

class BillingFolio(Base):
    __tablename__ = "billing_folios"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    folio_number = Column(String(50), nullable=False, index=True)
    
    total_charges = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_tax = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_discount = Column(Numeric(10, 2), default=0.00, nullable=False)
    net_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_paid = Column(Numeric(10, 2), default=0.00, nullable=False)
    balance_due = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    status = Column(Enum(FolioStatus), default=FolioStatus.OPEN, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="folio")
    items = relationship("FolioItem", back_populates="folio", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="folio", cascade="all, delete-orphan")

class FolioItem(Base):
    __tablename__ = "folio_items"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    folio_id = Column(Integer, ForeignKey("billing_folios.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(Enum(FolioCategory), default=FolioCategory.ROOM, nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_percent = Column(Numeric(5, 2), default=12.00, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    item_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reference_id = Column(String(100), nullable=True)  # e.g., POS Order Number or Room Night Date
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    folio = relationship("BillingFolio", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    folio_id = Column(Integer, ForeignKey("billing_folios.id", ondelete="CASCADE"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_number = Column(String(50), nullable=False, index=True)
    
    amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    folio = relationship("BillingFolio", back_populates="payments")
    recorded_by = relationship("User")
