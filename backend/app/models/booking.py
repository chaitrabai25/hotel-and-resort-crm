import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BookingSource(str, enum.Enum):
    WALK_IN = "WALK_IN"
    DIRECT = "DIRECT"
    WEBSITE = "WEBSITE"
    OTA = "OTA"
    WHATSAPP = "WHATSAPP"
    CORPORATE = "CORPORATE"

class BookingStatus(str, enum.Enum):
    INQUIRY = "INQUIRY"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_number = Column(String(50), nullable=False, index=True)  # e.g., "BK-2026-001"
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source = Column(Enum(BookingSource), default=BookingSource.DIRECT, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    actual_check_in = Column(DateTime, nullable=True)
    actual_check_out = Column(DateTime, nullable=True)
    
    adults = Column(Integer, default=2, nullable=False)
    children = Column(Integer, default=0, nullable=False)
    
    total_room_rate = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    final_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    paid_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    balance_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    special_requests = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    guest = relationship("Guest", back_populates="bookings")
    booking_rooms = relationship("BookingRoom", back_populates="booking", cascade="all, delete-orphan")
    folio = relationship("BillingFolio", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    pos_orders = relationship("POSOrder", back_populates="booking")

class BookingRoom(Base):
    __tablename__ = "booking_rooms"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="CASCADE"), nullable=False)
    
    rate_per_night = Column(Numeric(10, 2), default=0.00, nullable=False)
    nights = Column(Integer, default=1, nullable=False)
    total_rate = Column(Numeric(10, 2), default=0.00, nullable=False)

    booking = relationship("Booking", back_populates="booking_rooms")
    room = relationship("Room")
    room_type = relationship("RoomType")
