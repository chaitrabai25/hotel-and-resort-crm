from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
from app.models.lead import LeadStatus, LeadType, QuotationStatus

class LeadCreate(BaseModel):
    guest_name: str
    phone: str
    email: Optional[str] = None
    lead_type: LeadType = LeadType.ROOM_STAY
    expected_check_in: Optional[date] = None
    expected_check_out: Optional[date] = None
    guest_count: int = 2
    estimated_budget: Optional[float] = None
    source: str = "Website"
    notes: Optional[str] = None
    assigned_to_id: Optional[int] = None

class LeadUpdate(BaseModel):
    guest_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    lead_type: Optional[LeadType] = None
    status: Optional[LeadStatus] = None
    expected_check_in: Optional[date] = None
    expected_check_out: Optional[date] = None
    guest_count: Optional[int] = None
    estimated_budget: Optional[float] = None
    notes: Optional[str] = None
    assigned_to_id: Optional[int] = None

class LeadResponse(BaseModel):
    id: int
    tenant_id: int
    guest_name: str
    phone: str
    email: Optional[str] = None
    lead_type: LeadType
    status: LeadStatus
    expected_check_in: Optional[date] = None
    expected_check_out: Optional[date] = None
    guest_count: int
    estimated_budget: Optional[float] = None
    source: str
    notes: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuotationCreate(BaseModel):
    lead_id: Optional[int] = None
    guest_name: str
    guest_phone: str
    guest_email: Optional[str] = None
    package_title: str
    valid_until: Optional[date] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    terms_conditions: Optional[str] = None
    subtotal: float
    tax_amount: float
    discount_amount: float = 0.0
    total_amount: float

class QuotationResponse(BaseModel):
    id: int
    tenant_id: int
    quotation_number: str
    lead_id: Optional[int] = None
    guest_name: str
    guest_phone: str
    guest_email: Optional[str] = None
    package_title: str
    valid_until: Optional[date] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    terms_conditions: Optional[str] = None
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    status: QuotationStatus
    created_at: datetime

    class Config:
        from_attributes = True
