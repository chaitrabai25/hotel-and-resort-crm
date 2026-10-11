import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    BLOCKED = "BLOCKED"

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=True)  # e.g., "MUM-RES-01"
    property_type = Column(String(50), default="Resort")
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    check_in_time = Column(String(10), default="14:00")
    check_out_time = Column(String(10), default="11:00")
    tax_gstin = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="properties")
    room_types = relationship("RoomType", back_populates="property", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    dining_tables = relationship("DiningTable", back_populates="property", cascade="all, delete-orphan")

class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Luxury Pool Villa"
    code = Column(String(30), nullable=True)   # e.g., "LPV"
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    weekend_price = Column(Numeric(10, 2), default=0.00, nullable=True)
    extra_bed_price = Column(Numeric(10, 2), default=0.00, nullable=True)
    max_adults = Column(Integer, default=2, nullable=False)
    max_children = Column(Integer, default=1, nullable=False)
    amenities_json = Column(Text, nullable=True)  # JSON array: ["WiFi", "Jacuzzi", "King Bed", "Sea View"]
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="room_types")
    rooms = relationship("Room", back_populates="room_type")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="CASCADE"), nullable=False, index=True)
    room_number = Column(String(50), nullable=False)  # e.g., "101", "Villa 4"
    floor = Column(String(20), nullable=True)        # e.g., "1st Floor", "Ground"
    wing = Column(String(50), nullable=True)         # e.g., "East Wing", "Beachfront"
    status = Column(Enum(RoomStatus), default=RoomStatus.AVAILABLE, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="rooms")
    room_type = relationship("RoomType", back_populates="rooms")
    housekeeping_tasks = relationship("HousekeepingTask", back_populates="room")
