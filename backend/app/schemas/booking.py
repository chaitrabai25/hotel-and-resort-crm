from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
from app.models.booking import BookingSource, BookingStatus, PaymentStatus

class BookingRoomItemCreate(BaseModel):
    room_id: int
    room_type_id: int
    rate_per_night: float

class BookingCreate(BaseModel):
    property_id: int
    guest_id: Optional[int] = None
    # If guest_id is not provided, create a new guest inline
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_email: Optional[str] = None
    guest_city: Optional[str] = None
    
    source: BookingSource = BookingSource.DIRECT
    check_in_date: date
    check_out_date: date
    adults: int = 2
    children: int = 0
    rooms: List[BookingRoomItemCreate]
    
    discount_amount: float = 0.0
    advance_paid: float = 0.0
    advance_payment_method: Optional[str] = "CASH"
    advance_transaction_ref: Optional[str] = None
    special_requests: Optional[str] = None
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    discount_amount: Optional[float] = None

class CheckInRequest(BaseModel):
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    id_document_url: Optional[str] = None
    notes: Optional[str] = None

class CheckOutRequest(BaseModel):
    payment_method: str = "CASH"
    transaction_ref: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    notes: Optional[str] = None

class BookingRoomResponse(BaseModel):
    id: int
    room_id: int
    room_number: str
    room_type_name: str
    rate_per_night: float
    nights: int
    total_rate: float

class BookingResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    property_name: Optional[str] = None
    booking_number: str
    guest_id: int
    guest_name: str
    guest_phone: str
    guest_email: Optional[str] = None
    source: BookingSource
    status: BookingStatus
    check_in_date: date
    check_out_date: date
    actual_check_in: Optional[datetime] = None
    actual_check_out: Optional[datetime] = None
    adults: int
    children: int
    total_room_rate: float
    tax_amount: float
    discount_amount: float
    final_amount: float
    paid_amount: float
    balance_amount: float
    payment_status: PaymentStatus
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    rooms: List[BookingRoomResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
