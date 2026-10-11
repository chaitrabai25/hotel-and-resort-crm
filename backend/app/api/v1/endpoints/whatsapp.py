import urllib.parse
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.booking import Booking
from app.models.user import User
from app.models.tenant import Tenant
from app.api.deps import get_current_user, get_current_active_tenant

router = APIRouter()

@router.get("/booking-link/{booking_id}")
def generate_whatsapp_booking_link(
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

    guest = booking.guest
    if not guest or not guest.phone:
        raise HTTPException(status_code=400, detail="Guest phone number missing")

    phone_clean = "".join([c for c in guest.phone if c.isdigit()])
    if not phone_clean.startswith("91") and len(phone_clean) == 10:
        phone_clean = f"91{phone_clean}"

    hotel_name = tenant.name if tenant else "GrandStay Resort"
    message_text = (
        f"🏨 *Reservation Confirmed — {hotel_name}*\n\n"
        f"Dear {guest.full_name},\n"
        f"Thank you for choosing to stay with us! Here are your booking details:\n\n"
        f"📌 *Booking Ref:* {booking.booking_number}\n"
        f"📅 *Check-In:* {booking.check_in_date}\n"
        f"📅 *Check-Out:* {booking.check_out_date}\n"
        f"👥 *Guests:* {booking.adults} Adults, {booking.children} Children\n"
        f"💰 *Total Amount:* ₹{float(booking.final_amount):,.2f}\n"
        f"💳 *Paid:* ₹{float(booking.paid_amount):,.2f}\n"
        f"⚠️ *Balance at Check-In:* ₹{float(booking.balance_amount):,.2f}\n\n"
        f"📍 Address: {tenant.address or 'Resort Campus'}\n"
        f"📞 Front Desk: {tenant.contact_phone or ''}\n\n"
        f"We look forward to welcoming you!"
    )

    encoded_msg = urllib.parse.quote(message_text)
    wa_url = f"https://api.whatsapp.com/send?phone={phone_clean}&text={encoded_msg}"

    return {
        "guest_phone": phone_clean,
        "whatsapp_url": wa_url,
        "message_preview": message_text
    }
