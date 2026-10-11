import io
import random
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.lead import Lead, Quotation, LeadStatus, LeadType, QuotationStatus
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse,
    QuotationCreate, QuotationResponse
)
from app.api.deps import get_current_user, get_current_active_tenant
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter()

def generate_quotation_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(100, 999)
    return f"QT-{now.strftime('%y%m')}-{rand_suffix}"

@router.get("/", response_model=List[LeadResponse])
def list_leads(
    status: Optional[LeadStatus] = None,
    lead_type: Optional[LeadType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(Lead).filter(Lead.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(Lead.status == status)
    if lead_type:
        query = query.filter(Lead.lead_type == lead_type)
        
    leads = query.order_by(Lead.created_at.desc()).all()
    res = []
    for l in leads:
        res.append(LeadResponse(
            id=l.id,
            tenant_id=l.tenant_id,
            guest_name=l.guest_name,
            phone=l.phone,
            email=l.email,
            lead_type=l.lead_type,
            status=l.status,
            expected_check_in=l.expected_check_in,
            expected_check_out=l.expected_check_out,
            guest_count=l.guest_count,
            estimated_budget=float(l.estimated_budget) if l.estimated_budget else None,
            source=l.source,
            notes=l.notes,
            assigned_to_name=l.assigned_to.full_name if l.assigned_to else None,
            created_at=l.created_at
        ))
    return res

@router.post("/", response_model=LeadResponse)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    lead = Lead(
        tenant_id=current_user.tenant_id,
        guest_name=lead_in.guest_name,
        phone=lead_in.phone,
        email=lead_in.email,
        lead_type=lead_in.lead_type,
        status=LeadStatus.NEW,
        expected_check_in=lead_in.expected_check_in,
        expected_check_out=lead_in.expected_check_out,
        guest_count=lead_in.guest_count,
        estimated_budget=lead_in.estimated_budget,
        source=lead_in.source,
        notes=lead_in.notes,
        assigned_to_id=lead_in.assigned_to_id or current_user.id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return LeadResponse(
        id=lead.id,
        tenant_id=lead.tenant_id,
        guest_name=lead.guest_name,
        phone=lead.phone,
        email=lead.email,
        lead_type=lead.lead_type,
        status=lead.status,
        expected_check_in=lead.expected_check_in,
        expected_check_out=lead.expected_check_out,
        guest_count=lead.guest_count,
        estimated_budget=float(lead.estimated_budget) if lead.estimated_budget else None,
        source=lead.source,
        notes=lead.notes,
        assigned_to_name=current_user.full_name,
        created_at=lead.created_at
    )

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.tenant_id == current_user.tenant_id
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, val in lead_in.model_dump(exclude_unset=True).items():
        setattr(lead, field, val)

    db.commit()
    db.refresh(lead)

    return LeadResponse(
        id=lead.id,
        tenant_id=lead.tenant_id,
        guest_name=lead.guest_name,
        phone=lead.phone,
        email=lead.email,
        lead_type=lead.lead_type,
        status=lead.status,
        expected_check_in=lead.expected_check_in,
        expected_check_out=lead.expected_check_out,
        guest_count=lead.guest_count,
        estimated_budget=float(lead.estimated_budget) if lead.estimated_budget else None,
        source=lead.source,
        notes=lead.notes,
        assigned_to_name=lead.assigned_to.full_name if lead.assigned_to else None,
        created_at=lead.created_at
    )

# ----------------- QUOTATIONS -----------------

@router.get("/quotations", response_model=List[QuotationResponse])
def list_quotations(
    lead_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(Quotation).filter(Quotation.tenant_id == current_user.tenant_id)
    if lead_id:
        query = query.filter(Quotation.lead_id == lead_id)
    return query.order_by(Quotation.created_at.desc()).all()

@router.post("/quotations", response_model=QuotationResponse)
def create_quotation(
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    quotation_number = generate_quotation_number(current_user.tenant_id)
    quote = Quotation(
        tenant_id=current_user.tenant_id,
        quotation_number=quotation_number,
        lead_id=quote_in.lead_id,
        guest_name=quote_in.guest_name,
        guest_phone=quote_in.guest_phone,
        guest_email=quote_in.guest_email,
        package_title=quote_in.package_title,
        valid_until=quote_in.valid_until,
        inclusions=quote_in.inclusions,
        exclusions=quote_in.exclusions,
        terms_conditions=quote_in.terms_conditions,
        subtotal=quote_in.subtotal,
        tax_amount=quote_in.tax_amount,
        discount_amount=quote_in.discount_amount,
        total_amount=quote_in.total_amount,
        status=QuotationStatus.SENT,
        created_by_id=current_user.id
    )
    db.add(quote)

    # If linked to lead, update lead status to QUOTED
    if quote_in.lead_id:
        lead = db.query(Lead).filter(Lead.id == quote_in.lead_id).first()
        if lead and lead.status == LeadStatus.NEW:
            lead.status = LeadStatus.QUOTED

    db.commit()
    db.refresh(quote)
    return quote

@router.get("/quotations/{quotation_id}/pdf")
def generate_quotation_pdf(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    quote = db.query(Quotation).filter(
        Quotation.id == quotation_id,
        Quotation.tenant_id == current_user.tenant_id
    ).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    story = []
    hotel_name = tenant.name if tenant else "GrandStay Resort & Hotel"
    story.append(Paragraph(f"<b>{hotel_name}</b>", ParagraphStyle(name="Title", parent=styles["Heading1"], fontSize=22, textColor=colors.HexColor("#0f172a"))))
    story.append(Paragraph(f"Luxury Accommodation, Banquets & Hospitality Proposals", ParagraphStyle(name="Sub", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#64748b"))))
    story.append(Spacer(1, 14))

    meta_data = [
        [Paragraph(f"<b>PROPOSAL REF:</b> {quote.quotation_number}", styles["Normal"]), Paragraph(f"<b>Date:</b> {quote.created_at.strftime('%d %b %Y')}", styles["Normal"])],
        [Paragraph(f"<b>Guest / Company:</b> {quote.guest_name}", styles["Normal"]), Paragraph(f"<b>Phone:</b> {quote.guest_phone}", styles["Normal"])],
        [Paragraph(f"<b>Package Title:</b> {quote.package_title}", styles["Normal"]), Paragraph(f"<b>Valid Until:</b> {quote.valid_until or '15 Days'}", styles["Normal"])],
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 18))

    story.append(Paragraph("<b>Inclusions:</b>", styles["Heading3"]))
    story.append(Paragraph(quote.inclusions or "Accommodation, Welcome Drinks, Buffet Breakfast, Free High-Speed WiFi, Pool Access", styles["Normal"]))
    story.append(Spacer(1, 10))

    if quote.exclusions:
        story.append(Paragraph("<b>Exclusions:</b>", styles["Heading3"]))
        story.append(Paragraph(quote.exclusions, styles["Normal"]))
        story.append(Spacer(1, 10))

    summary_data = [
        ["Package Subtotal:", f"₹ {float(quote.subtotal):,.2f}"],
        ["GST / Taxes:", f"₹ {float(quote.tax_amount):,.2f}"],
        ["Special Discount:", f"- ₹ {float(quote.discount_amount):,.2f}"],
        ["Total Investment:", f"₹ {float(quote.total_amount):,.2f}"],
    ]
    t_sum = Table(summary_data, colWidths=[380, 160])
    t_sum.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,3), (-1,3), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 20))

    story.append(Paragraph("<b>Terms & Conditions:</b>", styles["Heading4"]))
    story.append(Paragraph(quote.terms_conditions or "Advance deposit of 50% is required to secure the reservation dates. Rates are subject to standard resort policies.", styles["Normal"]))

    doc.build(story)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Quotation-{quote.quotation_number}.pdf"}
    )
