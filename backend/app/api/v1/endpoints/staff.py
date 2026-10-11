from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.schemas.auth import UserCreate, UserResponse, UserUpdate
from app.api.deps import get_current_user, get_current_active_tenant, require_roles

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def list_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    users = db.query(User).filter(
        User.tenant_id == current_user.tenant_id
    ).order_by(User.full_name.asc()).all()
    
    res = []
    for u in users:
        res.append(UserResponse(
            id=u.id,
            tenant_id=u.tenant_id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            role=u.role,
            is_active=u.is_active,
            tenant_name=tenant.name
        ))
    return res

@router.post("/", response_model=UserResponse)
def create_staff(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN, UserRole.GENERAL_MANAGER])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    # Check max staff limit from subscription plan
    current_staff_count = db.query(User).filter(User.tenant_id == current_user.tenant_id).count()
    if current_staff_count >= tenant.max_staff:
        raise HTTPException(
            status_code=400,
            detail=f"Staff user limit reached ({tenant.max_staff}). Upgrade your subscription plan."
        )

    # Check if email taken
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        tenant_id=current_user.tenant_id,
        email=user_in.email,
        password_hash=hashed_pw,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        tenant_id=new_user.tenant_id,
        email=new_user.email,
        full_name=new_user.full_name,
        phone=new_user.phone,
        role=new_user.role,
        is_active=new_user.is_active,
        tenant_name=tenant.name
    )

@router.put("/{user_id}", response_model=UserResponse)
def update_staff(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN, UserRole.GENERAL_MANAGER])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_user.tenant_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    for field, val in user_in.model_dump(exclude_unset=True).items():
        if field == "password" and val:
            user.password_hash = get_password_hash(val)
        else:
            setattr(user, field, val)

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        tenant_name=tenant.name
    )
