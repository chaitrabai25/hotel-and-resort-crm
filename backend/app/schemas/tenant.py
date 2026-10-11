from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.tenant import BillingCycle, TenantStatus, BusinessType

class SubscriptionPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    price: float = 0.0
    max_rooms: int = 20
    max_properties: int = 1
    max_staff: int = 5
    features: Optional[List[str]] = None
    is_active: bool = True

class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    billing_cycle: BillingCycle
    price: float
    max_rooms: int
    max_properties: int
    max_staff: int
    features_json: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class TenantCreate(BaseModel):
    name: str
    slug: str
    business_type: BusinessType = BusinessType.RESORT
    subscription_plan_id: Optional[int] = None
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    postal_code: Optional[str] = None
    tax_id_gstin: Optional[str] = None
    admin_password: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[BusinessType] = None
    status: Optional[TenantStatus] = None
    subscription_plan_id: Optional[int] = None
    max_rooms: Optional[int] = None
    max_properties: Optional[int] = None
    max_staff: Optional[int] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    tax_id_gstin: Optional[str] = None
    logo_url: Optional[str] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str
    business_type: BusinessType
    subscription_plan_id: Optional[int] = None
    status: TenantStatus
    max_rooms: int
    max_properties: int
    max_staff: int
    contact_name: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    postal_code: Optional[str] = None
    tax_id_gstin: Optional[str] = None
    currency: str
    currency_symbol: str
    logo_url: Optional[str] = None
    subscription_starts_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None
    plan_name: Optional[str] = None

    class Config:
        from_attributes = True
