from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.pos import TableStatus, DiningArea, POSOrderType, POSOrderStatus

class DiningTableCreate(BaseModel):
    property_id: int
    table_number: str
    area: DiningArea = DiningArea.INDOOR
    capacity: int = 4

class DiningTableResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    table_number: str
    area: DiningArea
    capacity: int
    status: TableStatus
    active_order_id: Optional[int] = None

    class Config:
        from_attributes = True

class MenuCategoryCreate(BaseModel):
    name: str
    display_order: int = 0

class MenuCategoryResponse(BaseModel):
    id: int
    name: str
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True

class MenuItemCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    tax_percent: float = 5.0
    is_veg: bool = True
    preparation_time_minutes: int = 15

class MenuItemResponse(BaseModel):
    id: int
    category_id: int
    category_name: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    tax_percent: float
    is_veg: bool
    is_available: bool
    preparation_time_minutes: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class POSOrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    special_notes: Optional[str] = None

class POSOrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    quantity: int
    unit_price: float
    tax_percent: float
    tax_amount: float
    total_price: float
    special_notes: Optional[str] = None
    kot_status: str

    class Config:
        from_attributes = True

class POSOrderCreate(BaseModel):
    property_id: int
    table_id: Optional[int] = None
    booking_id: Optional[int] = None
    room_number: Optional[str] = None
    guest_name: Optional[str] = None
    order_type: POSOrderType = POSOrderType.DINE_IN
    notes: Optional[str] = None
    items: List[POSOrderItemCreate]

class SettleOrderRequest(BaseModel):
    transfer_to_room: bool = False
    payment_method: Optional[str] = "CASH"  # CASH, UPI, CARD, ROOM_CHARGE
    discount_amount: float = 0.0

class POSOrderResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    order_number: str
    table_id: Optional[int] = None
    table_number: Optional[str] = None
    booking_id: Optional[int] = None
    room_number: Optional[str] = None
    guest_name: Optional[str] = None
    order_type: POSOrderType
    status: POSOrderStatus
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    is_room_charged: bool
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[POSOrderItemResponse] = []

    class Config:
        from_attributes = True
