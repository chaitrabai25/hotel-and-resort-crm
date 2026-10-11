from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.tenant import TenantResponse, TenantUpdate
from app.api.deps import get_current_user, get_current_active_tenant, require_roles

router = APIRouter()

@router.get("/current", response_model=TenantResponse)
def get_current_tenant_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    resp = TenantResponse.model_validate(tenant)
    resp.plan_name = tenant.subscription_plan.name if tenant.subscription_plan else "Enterprise"
    return resp

@router.put("/current", response_model=TenantResponse)
def update_current_tenant_settings(
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    for field, val in tenant_in.model_dump(exclude_unset=True).items():
        # Prevent tenant from modifying their own subscription plan directly
        if field not in ["subscription_plan_id", "status", "max_rooms", "max_properties", "max_staff"]:
            setattr(tenant, field, val)

    db.commit()
    db.refresh(tenant)
    resp = TenantResponse.model_validate(tenant)
    resp.plan_name = tenant.subscription_plan.name if tenant.subscription_plan else "Enterprise"
    return resp
