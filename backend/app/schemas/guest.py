from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.guest import IdType, VIPTier

class GuestCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    alternate_phone: Optional[str] = None
    id_type: Optional[IdType] = IdType.AADHAAR
    id_number: Optional[str] = None
    id_document_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    vip_tier: VIPTier = VIPTier.STANDARD
    dietary_preferences: Optional[str] = None
    special_preferences: Optional[str] = None

class GuestUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    id_type: Optional[IdType] = None
    id_number: Optional[str] = None
    id_document_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    vip_tier: Optional[VIPTier] = None
    dietary_preferences: Optional[str] = None
    special_preferences: Optional[str] = None
    is_blacklisted: Optional[bool] = None

class GuestResponse(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    alternate_phone: Optional[str] = None
    id_type: Optional[IdType] = None
    id_number: Optional[str] = None
    id_document_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    vip_tier: VIPTier
    dietary_preferences: Optional[str] = None
    special_preferences: Optional[str] = None
    is_blacklisted: bool
    total_stays: int
    total_spend: float
    created_at: datetime

    class Config:
        from_attributes = True
