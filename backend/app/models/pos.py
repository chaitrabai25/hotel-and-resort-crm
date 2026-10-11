import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TableStatus(str, enum.Enum):
    VACANT = "VACANT"
    OCCUPIED = "OCCUPIED"
    BILLED = "BILLED"
    RESERVED = "RESERVED"

class DiningArea(str, enum.Enum):
    INDOOR = "INDOOR"
    LAWN = "LAWN"
    POOLSIDE = "POOLSIDE"
    TERRACE = "TERRACE"
    ROOM_SERVICE = "ROOM_SERVICE"

class POSOrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    ROOM_SERVICE = "ROOM_SERVICE"
    TAKEAWAY = "TAKEAWAY"

class POSOrderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    KOT_SENT = "KOT_SENT"
    SERVED = "SERVED"
    BILLED = "BILLED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class DiningTable(Base):
    __tablename__ = "dining_tables"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    table_number = Column(String(50), nullable=False)  # e.g., "T-1", "Poolside-04"
    area = Column(Enum(DiningArea), default=DiningArea.INDOOR, nullable=False)
    capacity = Column(Integer, default=4, nullable=False)
    status = Column(Enum(TableStatus), default=TableStatus.VACANT, nullable=False)
    active_order_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="dining_tables")
    orders = relationship("POSOrder", back_populates="table")

class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_percent = Column(Numeric(5, 2), default=5.00, nullable=False)  # F&B GST is typically 5%
    is_veg = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    preparation_time_minutes = Column(Integer, default=15)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category = relationship("MenuCategory", back_populates="items")

class POSOrder(Base):
    __tablename__ = "pos_orders"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    order_number = Column(String(50), nullable=False, index=True)
    table_id = Column(Integer, ForeignKey("dining_tables.id", ondelete="SET NULL"), nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    guest_name = Column(String(120), nullable=True)
    room_number = Column(String(50), nullable=True)
    
    order_type = Column(Enum(POSOrderType), default=POSOrderType.DINE_IN, nullable=False)
    status = Column(Enum(POSOrderStatus), default=POSOrderStatus.ACTIVE, nullable=False)
    
    subtotal = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    is_room_charged = Column(Boolean, default=False, nullable=False)
    payment_method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    table = relationship("DiningTable", back_populates="orders")
    booking = relationship("Booking", back_populates="pos_orders")
    items = relationship("POSOrderItem", back_populates="order", cascade="all, delete-orphan")

class POSOrderItem(Base):
    __tablename__ = "pos_order_items"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("pos_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(150), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    tax_percent = Column(Numeric(5, 2), default=5.00, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    special_notes = Column(String(255), nullable=True)  # e.g., "no onion, extra spicy"
    kot_status = Column(String(50), default="PENDING")  # PENDING, PREPARING, READY, SERVED

    order = relationship("POSOrder", back_populates="items")
    menu_item = relationship("MenuItem")
