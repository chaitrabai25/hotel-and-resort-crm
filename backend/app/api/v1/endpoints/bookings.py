from typing import Any, List, Optional
from datetime import date, datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.booking import Booking, BookingRoom, BookingStatus, PaymentStatus
from app.models.property import Property, Room, RoomType, RoomStatus
from app.models.guest import Guest, VIPTier
from app.models.billing import BillingFolio, FolioItem, Payment, FolioCategory, FolioStatus, PaymentMethod
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.booking import (
    BookingCreate, BookingResponse, BookingRoomResponse,
    BookingUpdate, CheckInRequest, CheckOutRequest
)
from app.api.deps import get_current_user, get_current_active_tenant

router = APIRouter()

def generate_booking_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(100, 999)
    return f"BK-{now.strftime('%y%m')}-{tenant_id}{rand_suffix}"

def generate_folio_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(100, 999)
    return f"INV-{now.strftime('%y%m')}-{tenant_id}{rand_suffix}"

def generate_payment_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(1000, 9999)
    return f"REC-{now.strftime('%y%m')}-{rand_suffix}"

@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    status: Optional[BookingStatus] = None,
    property_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=100, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(Booking).filter(Booking.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(Booking.status == status)
    if property_id:
        query = query.filter(Booking.property_id == property_id)
    if start_date:
        query = query.filter(Booking.check_in_date >= start_date)
    if end_date:
        query = query.filter(Booking.check_out_date <= end_date)
    if search:
        term = f"%{search}%"
        query = query.join(Guest).filter(
            or_(
                Booking.booking_number.ilike(term),
                Guest.full_name.ilike(term),
                Guest.phone.ilike(term)
            )
        )

    bookings = query.order_by(Booking.created_at.desc()).limit(limit).all()
    results = []
    for b in bookings:
        room_list = []
        for br in b.booking_rooms:
            room_list.append(BookingRoomResponse(
                id=br.id,
                room_id=br.room_id,
                room_number=br.room.room_number if br.room else "N/A",
                room_type_name=br.room_type.name if br.room_type else "Standard",
                rate_per_night=float(br.rate_per_night),
                nights=br.nights,
                total_rate=float(br.total_rate)
            ))

        results.append(BookingResponse(
            id=b.id,
            tenant_id=b.tenant_id,
            property_id=b.property_id,
            property_name=b.property.name if hasattr(b, "property") and b.property else "Property",
            booking_number=b.booking_number,
            guest_id=b.guest_id,
            guest_name=b.guest.full_name if b.guest else "Unknown",
            guest_phone=b.guest.phone if b.guest else "",
            guest_email=b.guest.email if b.guest else None,
            source=b.source,
            status=b.status,
            check_in_date=b.check_in_date,
            check_out_date=b.check_out_date,
            actual_check_in=b.actual_check_in,
            actual_check_out=b.actual_check_out,
            adults=b.adults,
            children=b.children,
            total_room_rate=float(b.total_room_rate),
            tax_amount=float(b.tax_amount),
            discount_amount=float(b.discount_amount),
            final_amount=float(b.final_amount),
            paid_amount=float(b.paid_amount),
            balance_amount=float(b.balance_amount),
            payment_status=b.payment_status,
            special_requests=b.special_requests,
            notes=b.notes,
            rooms=room_list,
            created_at=b.created_at
        ))
    return results

@router.post("/", response_model=BookingResponse)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    if booking_in.check_out_date <= booking_in.check_in_date:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")

    nights = (booking_in.check_out_date - booking_in.check_in_date).days
    if nights < 1:
        nights = 1

    # 1. Resolve or Create Guest
    guest = None
    if booking_in.guest_id:
        guest = db.query(Guest).filter(
            Guest.id == booking_in.guest_id,
            Guest.tenant_id == current_user.tenant_id
        ).first()

    if not guest:
        if not booking_in.guest_name or not booking_in.guest_phone:
            raise HTTPException(status_code=400, detail="Guest name and phone number are required")
        
        # Check if phone already belongs to a guest in this tenant
        guest = db.query(Guest).filter(
            Guest.tenant_id == current_user.tenant_id,
            Guest.phone == booking_in.guest_phone
        ).first()

        if not guest:
            guest = Guest(
                tenant_id=current_user.tenant_id,
                full_name=booking_in.guest_name,
                phone=booking_in.guest_phone,
                email=booking_in.guest_email,
                city=booking_in.guest_city,
                vip_tier=VIPTier.STANDARD
            )
            db.add(guest)
            db.flush()

    # 2. Check for Room Overlap
    room_ids = [r.room_id for r in booking_in.rooms]
    overlapping = db.query(BookingRoom).join(Booking).filter(
        Booking.tenant_id == current_user.tenant_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
        BookingRoom.room_id.in_(room_ids),
        Booking.check_in_date < booking_in.check_out_date,
        Booking.check_out_date > booking_in.check_in_date
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=400,
            detail=f"Room {overlapping.room.room_number if overlapping.room else ''} is already booked for these dates."
        )

    # 3. Calculate Rates
    total_room_rate = 0.0
    for r in booking_in.rooms:
        total_room_rate += r.rate_per_night * nights

    tax_rate = 0.12  # 12% standard hotel GST
    tax_amount = round(total_room_rate * tax_rate, 2)
    final_amount = round(total_room_rate + tax_amount - booking_in.discount_amount, 2)
    if final_amount < 0:
        final_amount = 0.0

    paid_amount = float(booking_in.advance_paid)
    balance_amount = round(final_amount - paid_amount, 2)
    if balance_amount <= 0:
        pay_status = PaymentStatus.PAID
        balance_amount = 0.0
    elif paid_amount > 0:
        pay_status = PaymentStatus.PARTIAL
    else:
        pay_status = PaymentStatus.PENDING

    # 4. Create Booking
    booking_number = generate_booking_number(current_user.tenant_id)
    new_booking = Booking(
        tenant_id=current_user.tenant_id,
        property_id=booking_in.property_id,
        booking_number=booking_number,
        guest_id=guest.id,
        source=booking_in.source,
        status=BookingStatus.CONFIRMED,
        check_in_date=booking_in.check_in_date,
        check_out_date=booking_in.check_out_date,
        adults=booking_in.adults,
        children=booking_in.children,
        total_room_rate=total_room_rate,
        tax_amount=tax_amount,
        discount_amount=booking_in.discount_amount,
        final_amount=final_amount,
        paid_amount=paid_amount,
        balance_amount=balance_amount,
        payment_status=pay_status,
        special_requests=booking_in.special_requests,
        notes=booking_in.notes,
        created_by_id=current_user.id
    )
    db.add(new_booking)
    db.flush()

    # 5. Create Booking Rooms
    created_rooms_resp = []
    for r in booking_in.rooms:
        room_subtotal = r.rate_per_night * nights
        br = BookingRoom(
            tenant_id=current_user.tenant_id,
            booking_id=new_booking.id,
            room_id=r.room_id,
            room_type_id=r.room_type_id,
            rate_per_night=r.rate_per_night,
            nights=nights,
            total_rate=room_subtotal
        )
        db.add(br)
        db.flush()
        
        # update room status to reserved
        room_obj = db.query(Room).filter(Room.id == r.room_id).first()
        if room_obj and room_obj.status == RoomStatus.AVAILABLE:
            room_obj.status = RoomStatus.RESERVED

        created_rooms_resp.append(BookingRoomResponse(
            id=br.id,
            room_id=br.room_id,
            room_number=room_obj.room_number if room_obj else "",
            room_type_name=room_obj.room_type.name if room_obj and room_obj.room_type else "Room",
            rate_per_night=float(r.rate_per_night),
            nights=nights,
            total_rate=float(room_subtotal)
        ))

    # 6. Create Billing Folio
    folio_num = generate_folio_number(current_user.tenant_id)
    folio = BillingFolio(
        tenant_id=current_user.tenant_id,
        booking_id=new_booking.id,
        folio_number=folio_num,
        total_charges=total_room_rate,
        total_tax=tax_amount,
        total_discount=booking_in.discount_amount,
        net_amount=final_amount,
        total_paid=paid_amount,
        balance_due=balance_amount,
        status=FolioStatus.OPEN
    )
    db.add(folio)
    db.flush()

    # 7. Add Room Charge Folio Item
    folio_item = FolioItem(
        tenant_id=current_user.tenant_id,
        folio_id=folio.id,
        category=FolioCategory.ROOM,
        description=f"Room Tariff ({nights} Nights stay)",
        quantity=nights,
        unit_price=round(total_room_rate / nights, 2),
        tax_percent=12.00,
        tax_amount=tax_amount,
        total_amount=round(total_room_rate + tax_amount, 2),
        reference_id=booking_number
    )
    db.add(folio_item)

    # 8. Record Advance Payment if any
    if paid_amount > 0:
        pay_rec = Payment(
            tenant_id=current_user.tenant_id,
            folio_id=folio.id,
            booking_id=new_booking.id,
            payment_number=generate_payment_number(current_user.tenant_id),
            amount=paid_amount,
            payment_method=PaymentMethod(booking_in.advance_payment_method) if booking_in.advance_payment_method else PaymentMethod.CASH,
            transaction_reference=booking_in.advance_transaction_ref,
            notes="Advance deposit paid during reservation",
            recorded_by_id=current_user.id
        )
        db.add(pay_rec)

    # 9. Update Guest Stats
    guest.total_stays += 1
    guest.total_spend = float(guest.total_spend) + final_amount

    db.commit()
    db.refresh(new_booking)

    return BookingResponse(
        id=new_booking.id,
        tenant_id=new_booking.tenant_id,
        property_id=new_booking.property_id,
        property_name="",
        booking_number=new_booking.booking_number,
        guest_id=guest.id,
        guest_name=guest.full_name,
        guest_phone=guest.phone,
        guest_email=guest.email,
        source=new_booking.source,
        status=new_booking.status,
        check_in_date=new_booking.check_in_date,
        check_out_date=new_booking.check_out_date,
        actual_check_in=new_booking.actual_check_in,
        actual_check_out=new_booking.actual_check_out,
        adults=new_booking.adults,
        children=new_booking.children,
        total_room_rate=float(new_booking.total_room_rate),
        tax_amount=float(new_booking.tax_amount),
        discount_amount=float(new_booking.discount_amount),
        final_amount=float(new_booking.final_amount),
        paid_amount=float(new_booking.paid_amount),
        balance_amount=float(new_booking.balance_amount),
        payment_status=new_booking.payment_status,
        special_requests=new_booking.special_requests,
        notes=new_booking.notes,
        rooms=created_rooms_resp,
        created_at=new_booking.created_at
    )

@router.post("/{booking_id}/check-in", response_model=BookingResponse)
def check_in_guest(
    booking_id: int,
    check_in_data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tenant_id == current_user.tenant_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.CHECKED_IN
    booking.actual_check_in = datetime.now(timezone.utc)
    if check_in_data.notes:
        booking.notes = (booking.notes or "") + f"\nCheck-in notes: {check_in_data.notes}"

    # Update ID document on Guest if provided
    if check_in_data.id_number and booking.guest:
        booking.guest.id_number = check_in_data.id_number
    if check_in_data.id_document_url and booking.guest:
        booking.guest.id_document_url = check_in_data.id_document_url

    # Update assigned room(s) to OCCUPIED
    for br in booking.booking_rooms:
        if br.room:
            br.room.status = RoomStatus.OCCUPIED

    db.commit()
    db.refresh(booking)
    return list_bookings(search=booking.booking_number, db=db, current_user=current_user, tenant=tenant)[0]

@router.post("/{booking_id}/check-out", response_model=BookingResponse)
def check_out_guest(
    booking_id: int,
    check_out_data: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tenant_id == current_user.tenant_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    folio = booking.folio
    if folio and folio.balance_due > 0:
        # Record settlement payment
        pay = Payment(
            tenant_id=current_user.tenant_id,
            folio_id=folio.id,
            booking_id=booking.id,
            payment_number=generate_payment_number(current_user.tenant_id),
            amount=folio.balance_due,
            payment_method=PaymentMethod(check_out_data.payment_method) if check_out_data.payment_method else PaymentMethod.CASH,
            transaction_reference=check_out_data.transaction_ref,
            notes="Checkout final settlement",
            recorded_by_id=current_user.id
        )
        db.add(pay)
        folio.total_paid = float(folio.total_paid) + float(folio.balance_due)
        booking.paid_amount = float(booking.paid_amount) + float(folio.balance_due)
        booking.balance_amount = 0.0
        folio.balance_due = 0.0
        booking.payment_status = PaymentStatus.PAID
        folio.status = FolioStatus.CLOSED

    booking.status = BookingStatus.CHECKED_OUT
    booking.actual_check_out = datetime.now(timezone.utc)

    # Set assigned rooms to CLEANING
    for br in booking.booking_rooms:
        if br.room:
            br.room.status = RoomStatus.CLEANING

    db.commit()
    db.refresh(booking)
    return list_bookings(search=booking.booking_number, db=db, current_user=current_user, tenant=tenant)[0]

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tenant_id == current_user.tenant_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.CANCELLED
    
    # Release rooms
    for br in booking.booking_rooms:
        if br.room:
            br.room.status = RoomStatus.AVAILABLE

    db.commit()
    return {"message": "Booking successfully cancelled and rooms released"}
