import json
from typing import Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.tenant import Tenant, SubscriptionPlan, TenantStatus
from app.models.user import User, UserRole
from app.models.property import Property, Room
from app.schemas.tenant import (
    TenantCreate, TenantResponse, TenantUpdate,
    SubscriptionPlanCreate, SubscriptionPlanResponse
)
from app.api.deps import require_roles

router = APIRouter()

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.ACTIVE).count()
    total_users = db.query(User).count()
    total_properties = db.query(Property).count()
    total_rooms = db.query(Room).count()
    
    # Calculate estimated Monthly Recurring Revenue (MRR)
    tenants_with_plans = db.query(Tenant).filter(
        Tenant.status == TenantStatus.ACTIVE,
        Tenant.subscription_plan_id.isnot(None)
    ).all()
    
    mrr = 0.0
    for t in tenants_with_plans:
        if t.subscription_plan:
            price = float(t.subscription_plan.price)
            cycle = t.subscription_plan.billing_cycle.value
            if cycle == "MONTHLY":
                mrr += price
            elif cycle == "QUARTERLY":
                mrr += price / 3.0
            elif cycle == "HALF_YEARLY":
                mrr += price / 6.0
            elif cycle == "YEARLY":
                mrr += price / 12.0
                
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_users": total_users,
        "total_properties": total_properties,
        "total_rooms": total_rooms,
        "estimated_mrr": round(mrr, 2),
    }

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]))
) -> Any:
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

@router.post("/plans", response_model=SubscriptionPlanResponse)
def create_plan(
    plan_in: SubscriptionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    features_json = json.dumps(plan_in.features) if plan_in.features else "[]"
    db_plan = SubscriptionPlan(
        name=plan_in.name,
        description=plan_in.description,
        billing_cycle=plan_in.billing_cycle,
        price=plan_in.price,
        max_rooms=plan_in.max_rooms,
        max_properties=plan_in.max_properties,
        max_staff=plan_in.max_staff,
        features_json=features_json,
        is_active=plan_in.is_active
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/tenants", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    res = []
    for t in tenants:
        plan_name = t.subscription_plan.name if t.subscription_plan else "None"
        resp_obj = TenantResponse.model_validate(t)
        resp_obj.plan_name = plan_name
        res.append(resp_obj)
    return res

@router.post("/tenants", response_model=TenantResponse)
def create_tenant(
    tenant_in: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    # Check if slug exists
    if db.query(Tenant).filter(Tenant.slug == tenant_in.slug).first():
        raise HTTPException(status_code=400, detail="Organization slug already taken")
    if db.query(User).filter(User.email == tenant_in.contact_email).first():
        raise HTTPException(status_code=400, detail="Contact email is already registered as a user")

    plan = None
    if tenant_in.subscription_plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant_in.subscription_plan_id).first()

    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=30)  # default 30 days trial/month
    
    max_rooms = plan.max_rooms if plan else 20
    max_properties = plan.max_properties if plan else 1
    max_staff = plan.max_staff if plan else 5

    tenant = Tenant(
        name=tenant_in.name,
        slug=tenant_in.slug,
        business_type=tenant_in.business_type,
        subscription_plan_id=tenant_in.subscription_plan_id,
        status=TenantStatus.ACTIVE,
        max_rooms=max_rooms,
        max_properties=max_properties,
        max_staff=max_staff,
        contact_name=tenant_in.contact_name,
        contact_email=tenant_in.contact_email,
        contact_phone=tenant_in.contact_phone,
        address=tenant_in.address,
        city=tenant_in.city,
        state=tenant_in.state,
        country=tenant_in.country,
        postal_code=tenant_in.postal_code,
        tax_id_gstin=tenant_in.tax_id_gstin,
        subscription_starts_at=now,
        subscription_expires_at=expiry
    )
    db.add(tenant)
    db.flush()

    # Create Initial Tenant Owner User
    hashed_password = get_password_hash(tenant_in.admin_password)
    owner = User(
        tenant_id=tenant.id,
        email=tenant_in.contact_email,
        password_hash=hashed_password,
        full_name=tenant_in.contact_name,
        phone=tenant_in.contact_phone,
        role=UserRole.TENANT_ADMIN,
        is_active=True
    )
    db.add(owner)
    
    # Create Default Property for the Tenant
    default_prop = Property(
        tenant_id=tenant.id,
        name=f"{tenant.name} Main Branch",
        property_type=tenant.business_type.value.capitalize(),
        city=tenant.city or "Bangalore",
        state=tenant.state or "Karnataka",
        country=tenant.country or "India",
        phone=tenant.contact_phone,
        email=tenant.contact_email,
        tax_gstin=tenant.tax_id_gstin
    )
    db.add(default_prop)

    db.commit()
    db.refresh(tenant)

    resp_obj = TenantResponse.model_validate(tenant)
    resp_obj.plan_name = plan.name if plan else "None"
    return resp_obj

@router.put("/tenants/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    for field, val in tenant_in.model_dump(exclude_unset=True).items():
        setattr(tenant, field, val)

    db.commit()
    db.refresh(tenant)
    return tenant

@router.post("/impersonate/{tenant_id}")
def impersonate_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
) -> Any:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    admin_user = db.query(User).filter(
        User.tenant_id == tenant_id,
        User.role == UserRole.TENANT_ADMIN
    ).first()
    
    if not admin_user:
        admin_user = db.query(User).filter(User.tenant_id == tenant_id).first()
        
    if not admin_user:
        raise HTTPException(status_code=404, detail="No users found for this tenant")

    extra_claims = {
        "role": admin_user.role.value,
        "tenant_id": admin_user.tenant_id,
        "is_impersonating": True,
        "impersonated_by": current_user.email
    }
    access_token = create_access_token(subject=admin_user.id, extra_claims=extra_claims)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "impersonated_user": admin_user.email,
        "tenant_name": tenant.name
    }
