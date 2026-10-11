import io
import random
from typing import Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.billing import BillingFolio, FolioItem, Payment, FolioCategory, FolioStatus, PaymentMethod
from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.billing import BillingFolioResponse, FolioItemCreate, FolioItemResponse, PaymentCreate, PaymentResponse
from app.api.deps import get_current_user, get_current_active_tenant
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter()

def generate_payment_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(1000, 9999)
    return f"REC-{now.strftime('%y%m')}-{rand_suffix}"

@router.get("/booking/{booking_id}", response_model=BillingFolioResponse)
def get_booking_folio(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    folio = db.query(BillingFolio).filter(
        BillingFolio.booking_id == booking_id,
        BillingFolio.tenant_id == current_user.tenant_id
    ).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found for this reservation")

    items_resp = [FolioItemResponse.model_validate(it) for it in folio.items]
    payments_resp = [PaymentResponse.model_validate(p) for p in folio.payments]

    booking = folio.booking
    guest_name = booking.guest.full_name if booking and booking.guest else "Unknown"
    guest_phone = booking.guest.phone if booking and booking.guest else None

    return BillingFolioResponse(
        id=folio.id,
        tenant_id=folio.tenant_id,
        booking_id=folio.booking_id,
        booking_number=booking.booking_number if booking else "",
        guest_name=guest_name,
        guest_phone=guest_phone,
        folio_number=folio.folio_number,
        total_charges=float(folio.total_charges),
        total_tax=float(folio.total_tax),
        total_discount=float(folio.total_discount),
        net_amount=float(folio.net_amount),
        total_paid=float(folio.total_paid),
        balance_due=float(folio.balance_due),
        status=folio.status,
        notes=folio.notes,
        created_at=folio.created_at,
        items=items_resp,
        payments=payments_resp
    )

@router.post("/{folio_id}/items", response_model=FolioItemResponse)
def add_folio_charge(
    folio_id: int,
    item_in: FolioItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    folio = db.query(BillingFolio).filter(
        BillingFolio.id == folio_id,
        BillingFolio.tenant_id == current_user.tenant_id
    ).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")

    subtotal = float(item_in.unit_price) * item_in.quantity
    tax_amount = round(subtotal * (float(item_in.tax_percent) / 100.0), 2)
    total_amount = round(subtotal + tax_amount, 2)

    new_item = FolioItem(
        tenant_id=current_user.tenant_id,
        folio_id=folio.id,
        category=item_in.category,
        description=item_in.description,
        quantity=item_in.quantity,
        unit_price=item_in.unit_price,
        tax_percent=item_in.tax_percent,
        tax_amount=tax_amount,
        total_amount=total_amount,
        reference_id=item_in.reference_id
    )
    db.add(new_item)

    # Recalculate folio
    folio.total_charges = float(folio.total_charges) + subtotal
    folio.total_tax = float(folio.total_tax) + tax_amount
    folio.net_amount = float(folio.net_amount) + total_amount
    folio.balance_due = float(folio.balance_due) + total_amount

    # Update booking
    if folio.booking:
        folio.booking.final_amount = float(folio.booking.final_amount) + total_amount
        folio.booking.balance_amount = float(folio.booking.balance_amount) + total_amount

    db.commit()
    db.refresh(new_item)
    return new_item

@router.post("/{folio_id}/payments", response_model=PaymentResponse)
def record_folio_payment(
    folio_id: int,
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    folio = db.query(BillingFolio).filter(
        BillingFolio.id == folio_id,
        BillingFolio.tenant_id == current_user.tenant_id
    ).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")

    new_payment = Payment(
        tenant_id=current_user.tenant_id,
        folio_id=folio.id,
        booking_id=folio.booking_id,
        payment_number=generate_payment_number(current_user.tenant_id),
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference,
        notes=payment_in.notes,
        recorded_by_id=current_user.id
    )
    db.add(new_payment)

    # Update balances
    folio.total_paid = float(folio.total_paid) + float(payment_in.amount)
    folio.balance_due = round(float(folio.net_amount) - float(folio.total_paid), 2)
    if folio.balance_due <= 0:
        folio.balance_due = 0.0

    if folio.booking:
        folio.booking.paid_amount = float(folio.booking.paid_amount) + float(payment_in.amount)
        folio.booking.balance_amount = round(float(folio.booking.final_amount) - float(folio.booking.paid_amount), 2)
        if folio.booking.balance_amount <= 0:
            folio.booking.balance_amount = 0.0
            folio.booking.payment_status = PaymentStatus.PAID
        else:
            folio.booking.payment_status = PaymentStatus.PARTIAL

    db.commit()
    db.refresh(new_payment)
    return new_payment

@router.get("/{folio_id}/invoice-pdf")
def generate_invoice_pdf(
    folio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    folio = db.query(BillingFolio).filter(
        BillingFolio.id == folio_id,
        BillingFolio.tenant_id == current_user.tenant_id
    ).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")

    booking = folio.booking
    guest_name = booking.guest.full_name if booking and booking.guest else "Valued Guest"
    guest_phone = booking.guest.phone if booking and booking.guest else "N/A"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    story = []

    # Title & Header
    title_style = ParagraphStyle(name="HotelTitle", parent=styles["Heading1"], fontSize=22, textColor=colors.HexColor("#0f172a"), spaceAfter=4)
    sub_style = ParagraphStyle(name="SubHeader", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#64748b"))
    
    hotel_name = tenant.name if tenant else "GrandStay Resort & Hotel"
    story.append(Paragraph(f"<b>{hotel_name}</b>", title_style))
    story.append(Paragraph(f"{tenant.address or 'Luxury Hospitality'} | Phone: {tenant.contact_phone or ''} | GSTIN: {tenant.tax_id_gstin or 'N/A'}", sub_style))
    story.append(Spacer(1, 16))

    # Invoice Details Grid
    meta_data = [
        [Paragraph(f"<b>TAX INVOICE / FOLIO:</b> {folio.folio_number}", styles["Normal"]), Paragraph(f"<b>Date:</b> {datetime.now().strftime('%d %b %Y')}", styles["Normal"])],
        [Paragraph(f"<b>Guest Name:</b> {guest_name}", styles["Normal"]), Paragraph(f"<b>Booking Ref:</b> {booking.booking_number if booking else 'N/A'}", styles["Normal"])],
        [Paragraph(f"<b>Phone:</b> {guest_phone}", styles["Normal"]), Paragraph(f"<b>Stay Dates:</b> {booking.check_in_date} to {booking.check_out_date}", styles["Normal"])],
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 20))

    # Items Table
    table_data = [["Category", "Description", "Qty", "Rate (₹)", "Tax %", "Total (₹)"]]
    for it in folio.items:
        table_data.append([
            it.category.value,
            it.description[:35],
            str(it.quantity),
            f"{float(it.unit_price):,.2f}",
            f"{float(it.tax_percent)}%",
            f"{float(it.total_amount):,.2f}"
        ])

    t_items = Table(table_data, colWidths=[80, 200, 40, 75, 55, 90])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 16))

    # Totals Summary
    summary_data = [
        ["Subtotal Charges:", f"₹ {float(folio.total_charges):,.2f}"],
        ["GST / Taxes:", f"₹ {float(folio.total_tax):,.2f}"],
        ["Discount Applied:", f"- ₹ {float(folio.total_discount):,.2f}"],
        ["Net Invoice Amount:", f"₹ {float(folio.net_amount):,.2f}"],
        ["Total Paid:", f"₹ {float(folio.total_paid):,.2f}"],
        ["Balance Due:", f"₹ {float(folio.balance_due):,.2f}"],
    ]
    t_sum = Table(summary_data, colWidths=[400, 140])
    t_sum.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
        ('FONTNAME', (0,5), (-1,5), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,5), (-1,5), colors.HexColor("#b91c1c") if folio.balance_due > 0 else colors.HexColor("#15803d")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 24))

    # Footer note
    story.append(Paragraph("<i>Thank you for choosing to stay with us. We hope you had a memorable hospitality experience!</i>", sub_style))

    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice-{folio.folio_number}.pdf"}
    )
