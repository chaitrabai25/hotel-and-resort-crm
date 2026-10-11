from typing import Optional, List
from pydantic import BaseModel
from app.models.property import RoomStatus

class PropertyCreate(BaseModel):
    name: str
    code: Optional[str] = None
    property_type: str = "Resort"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    phone: Optional[str] = None
    email: Optional[str] = None
    check_in_time: str = "14:00"
    check_out_time: str = "11:00"
    tax_gstin: Optional[str] = None

class PropertyResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    property_type: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    phone: Optional[str] = None
    email: Optional[str] = None
    check_in_time: str
    check_out_time: str
    tax_gstin: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class RoomTypeCreate(BaseModel):
    property_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    base_price: float
    weekend_price: Optional[float] = None
    extra_bed_price: Optional[float] = None
    max_adults: int = 2
    max_children: int = 1
    amenities: Optional[List[str]] = None

class RoomTypeResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    base_price: float
    weekend_price: Optional[float] = None
    extra_bed_price: Optional[float] = None
    max_adults: int
    max_children: int
    amenities_json: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class RoomCreate(BaseModel):
    property_id: int
    room_type_id: int
    room_number: str
    floor: Optional[str] = None
    wing: Optional[str] = None
    status: RoomStatus = RoomStatus.AVAILABLE
    notes: Optional[str] = None

class RoomStatusUpdate(BaseModel):
    status: RoomStatus
    notes: Optional[str] = None

class RoomResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    room_type_id: int
    room_number: str
    floor: Optional[str] = None
    wing: Optional[str] = None
    status: RoomStatus
    notes: Optional[str] = None
    room_type_name: Optional[str] = None
    base_price: Optional[float] = None

    class Config:
        from_attributes = True
