import json
from typing import Any, List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.property import Property, RoomType, Room, RoomStatus
from app.models.booking import Booking, BookingRoom, BookingStatus
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.schemas.property import (
    RoomTypeCreate, RoomTypeResponse,
    RoomCreate, RoomResponse, RoomStatusUpdate
)
from app.api.deps import get_current_user, get_current_active_tenant, require_roles

router = APIRouter()

# ----------------- ROOM TYPES -----------------

@router.get("/types", response_model=List[RoomTypeResponse])
def list_room_types(
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(RoomType).filter(RoomType.tenant_id == current_user.tenant_id)
    if property_id:
        query = query.filter(RoomType.property_id == property_id)
    return query.all()

@router.post("/types", response_model=RoomTypeResponse)
def create_room_type(
    type_in: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN, UserRole.GENERAL_MANAGER])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    amenities_json = json.dumps(type_in.amenities) if type_in.amenities else "[]"
    db_type = RoomType(
        tenant_id=current_user.tenant_id,
        property_id=type_in.property_id,
        name=type_in.name,
        code=type_in.code,
        description=type_in.description,
        base_price=type_in.base_price,
        weekend_price=type_in.weekend_price or type_in.base_price,
        extra_bed_price=type_in.extra_bed_price or 0.0,
        max_adults=type_in.max_adults,
        max_children=type_in.max_children,
        amenities_json=amenities_json
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

# ----------------- ROOMS -----------------

@router.get("/", response_model=List[RoomResponse])
def list_rooms(
    property_id: Optional[int] = None,
    status: Optional[RoomStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(Room).filter(Room.tenant_id == current_user.tenant_id)
    if property_id:
        query = query.filter(Room.property_id == property_id)
    if status:
        query = query.filter(Room.status == status)
    
    rooms = query.order_by(Room.room_number.asc()).all()
    res = []
    for r in rooms:
        resp = RoomResponse(
            id=r.id,
            tenant_id=r.tenant_id,
            property_id=r.property_id,
            room_type_id=r.room_type_id,
            room_number=r.room_number,
            floor=r.floor,
            wing=r.wing,
            status=r.status,
            notes=r.notes,
            room_type_name=r.room_type.name if r.room_type else "Standard",
            base_price=float(r.room_type.base_price) if r.room_type else 0.0
        )
        res.append(resp)
    return res

@router.post("/", response_model=RoomResponse)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TENANT_ADMIN, UserRole.GENERAL_MANAGER])),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    # Check max rooms limit
    current_count = db.query(Room).filter(Room.tenant_id == current_user.tenant_id).count()
    if current_count >= tenant.max_rooms:
        raise HTTPException(
            status_code=400,
            detail=f"Room limit reached ({tenant.max_rooms} rooms). Upgrade your subscription plan."
        )

    # Check duplicate room number in property
    existing = db.query(Room).filter(
        Room.tenant_id == current_user.tenant_id,
        Room.property_id == room_in.property_id,
        Room.room_number == room_in.room_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Room number {room_in.room_number} already exists in this property")

    new_room = Room(
        tenant_id=current_user.tenant_id,
        property_id=room_in.property_id,
        room_type_id=room_in.room_type_id,
        room_number=room_in.room_number,
        floor=room_in.floor,
        wing=room_in.wing,
        status=room_in.status,
        notes=room_in.notes
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    return RoomResponse(
        id=new_room.id,
        tenant_id=new_room.tenant_id,
        property_id=new_room.property_id,
        room_type_id=new_room.room_type_id,
        room_number=new_room.room_number,
        floor=new_room.floor,
        wing=new_room.wing,
        status=new_room.status,
        notes=new_room.notes,
        room_type_name=new_room.room_type.name if new_room.room_type else "Standard",
        base_price=float(new_room.room_type.base_price) if new_room.room_type else 0.0
    )

@router.put("/{room_id}/status", response_model=RoomResponse)
def update_room_status(
    room_id: int,
    status_in: RoomStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.tenant_id == current_user.tenant_id
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    room.status = status_in.status
    if status_in.notes:
        room.notes = status_in.notes
        
    db.commit()
    db.refresh(room)
    
    return RoomResponse(
        id=room.id,
        tenant_id=room.tenant_id,
        property_id=room.property_id,
        room_type_id=room.room_type_id,
        room_number=room.room_number,
        floor=room.floor,
        wing=room.wing,
        status=room.status,
        notes=room.notes,
        room_type_name=room.room_type.name if room.room_type else "Standard",
        base_price=float(room.room_type.base_price) if room.room_type else 0.0
    )

# ----------------- TAPE CHART CALENDAR MATRIX -----------------

@router.get("/tape-chart")
def get_tape_chart_matrix(
    start_date: date = Query(default=date.today()),
    days: int = Query(default=14, ge=7, le=31),
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    end_date = start_date + timedelta(days=days)
    
    room_query = db.query(Room).filter(Room.tenant_id == current_user.tenant_id)
    if property_id:
        room_query = room_query.filter(Room.property_id == property_id)
    rooms = room_query.order_by(Room.room_number.asc()).all()

    # Find all bookings that overlap with this window [start_date, end_date]
    active_bookings = db.query(Booking).filter(
        Booking.tenant_id == current_user.tenant_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
        Booking.check_in_date < end_date,
        Booking.check_out_date > start_date
    ).all()

    # Map room bookings
    bookings_by_room = {}
    for b in active_bookings:
        for br in b.booking_rooms:
            if br.room_id not in bookings_by_room:
                bookings_by_room[br.room_id] = []
            bookings_by_room[br.room_id].append({
                "booking_id": b.id,
                "booking_number": b.booking_number,
                "guest_name": b.guest.full_name if b.guest else "Guest",
                "guest_phone": b.guest.phone if b.guest else "",
                "status": b.status.value,
                "check_in_date": str(b.check_in_date),
                "check_out_date": str(b.check_out_date),
                "paid_amount": float(b.paid_amount),
                "balance_amount": float(b.balance_amount),
            })

    timeline_dates = [str(start_date + timedelta(days=i)) for i in range(days)]

    room_rows = []
    for r in rooms:
        room_rows.append({
            "room_id": r.id,
            "room_number": r.room_number,
            "room_type": r.room_type.name if r.room_type else "Standard",
            "floor": r.floor or "Ground",
            "current_status": r.status.value,
            "base_price": float(r.room_type.base_price) if r.room_type else 0.0,
            "bookings": bookings_by_room.get(r.id, [])
        })

    return {
        "start_date": str(start_date),
        "days": days,
        "timeline_dates": timeline_dates,
        "rooms": room_rows
    }
