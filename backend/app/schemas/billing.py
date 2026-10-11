from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.billing import FolioCategory, FolioStatus, PaymentMethod

class FolioItemCreate(BaseModel):
    category: FolioCategory
    description: str
    quantity: int = 1
    unit_price: float
    tax_percent: float = 12.0
    reference_id: Optional[str] = None

class FolioItemResponse(BaseModel):
    id: int
    folio_id: int
    category: FolioCategory
    description: str
    quantity: int
    unit_price: float
    tax_percent: float
    tax_amount: float
    total_amount: float
    item_date: datetime
    reference_id: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: float
    payment_method: PaymentMethod = PaymentMethod.CASH
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    folio_id: Optional[int] = None
    booking_id: Optional[int] = None
    payment_number: str
    amount: float
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    payment_date: datetime

    class Config:
        from_attributes = True

class BillingFolioResponse(BaseModel):
    id: int
    tenant_id: int
    booking_id: int
    booking_number: Optional[str] = None
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    folio_number: str
    total_charges: float
    total_tax: float
    total_discount: float
    net_amount: float
    total_paid: float
    balance_due: float
    status: FolioStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[FolioItemResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True
