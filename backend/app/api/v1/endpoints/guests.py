from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.guest import Guest, VIPTier
from app.models.booking import Booking
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.guest import GuestCreate, GuestUpdate, GuestResponse
from app.api.deps import get_current_user, get_current_active_tenant

router = APIRouter()

@router.get("/", response_model=List[GuestResponse])
def list_guests(
    search: Optional[str] = None,
    vip_tier: Optional[VIPTier] = None,
    limit: int = Query(default=100, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(Guest).filter(Guest.tenant_id == current_user.tenant_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Guest.full_name.ilike(term),
                Guest.phone.ilike(term),
                Guest.email.ilike(term),
                Guest.city.ilike(term)
            )
        )
    if vip_tier:
        query = query.filter(Guest.vip_tier == vip_tier)
        
    return query.order_by(Guest.updated_at.desc()).limit(limit).all()

@router.post("/", response_model=GuestResponse)
def create_guest(
    guest_in: GuestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    # Check if guest phone exists in tenant
    existing = db.query(Guest).filter(
        Guest.tenant_id == current_user.tenant_id,
        Guest.phone == guest_in.phone
    ).first()
    if existing:
        return existing

    new_guest = Guest(
        tenant_id=current_user.tenant_id,
        full_name=guest_in.full_name,
        email=guest_in.email,
        phone=guest_in.phone,
        alternate_phone=guest_in.alternate_phone,
        id_type=guest_in.id_type,
        id_number=guest_in.id_number,
        id_document_url=guest_in.id_document_url,
        address=guest_in.address,
        city=guest_in.city,
        state=guest_in.state,
        country=guest_in.country,
        vip_tier=guest_in.vip_tier,
        dietary_preferences=guest_in.dietary_preferences,
        special_preferences=guest_in.special_preferences
    )
    db.add(new_guest)
    db.commit()
    db.refresh(new_guest)
    return new_guest

@router.get("/{guest_id}")
def get_guest_detail(
    guest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    guest = db.query(Guest).filter(
        Guest.id == guest_id,
        Guest.tenant_id == current_user.tenant_id
    ).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
        
    bookings = db.query(Booking).filter(
        Booking.guest_id == guest_id,
        Booking.tenant_id == current_user.tenant_id
    ).order_by(Booking.check_in_date.desc()).all()
    
    stay_history = []
    for b in bookings:
        stay_history.append({
            "booking_id": b.id,
            "booking_number": b.booking_number,
            "check_in_date": str(b.check_in_date),
            "check_out_date": str(b.check_out_date),
            "status": b.status.value,
            "final_amount": float(b.final_amount),
            "paid_amount": float(b.paid_amount)
        })

    resp = GuestResponse.model_validate(guest)
    return {
        "guest": resp,
        "stay_history": stay_history
    }

@router.put("/{guest_id}", response_model=GuestResponse)
def update_guest(
    guest_id: int,
    guest_in: GuestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    guest = db.query(Guest).filter(
        Guest.id == guest_id,
        Guest.tenant_id == current_user.tenant_id
    ).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    for field, val in guest_in.model_dump(exclude_unset=True).items():
        setattr(guest, field, val)

    db.commit()
    db.refresh(guest)
    return guest
