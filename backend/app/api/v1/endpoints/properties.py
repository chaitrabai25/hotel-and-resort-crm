from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.property import Property
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.schemas.property import PropertyCreate, PropertyResponse
from app.api.deps import get_current_user, get_current_active_tenant, require_roles

router = APIRouter()

@router.get("/", response_model=List[PropertyResponse])
def list_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    return db.query(Property).filter(Property.tenant_id == current_user.tenant_id).all()

@router.post("/", response_model=PropertyResponse)
def create_property(
    prop_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN, UserRole.GENERAL_MANAGER])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    # Check max properties limit
    current_count = db.query(Property).filter(Property.tenant_id == current_user.tenant_id).count()
    if current_count >= tenant.max_properties:
        raise HTTPException(
            status_code=400,
            detail=f"Property limit reached ({tenant.max_properties}). Please upgrade your subscription plan."
        )

    new_prop = Property(
        tenant_id=current_user.tenant_id,
        name=prop_in.name,
        code=prop_in.code,
        property_type=prop_in.property_type,
        address=prop_in.address,
        city=prop_in.city,
        state=prop_in.state,
        country=prop_in.country,
        phone=prop_in.phone,
        email=prop_in.email,
        check_in_time=prop_in.check_in_time,
        check_out_time=prop_in.check_out_time,
        tax_gstin=prop_in.tax_gstin
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return new_prop
