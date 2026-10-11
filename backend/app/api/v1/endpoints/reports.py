import io
from typing import Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.booking import Booking, BookingStatus, BookingRoom
from app.models.property import Room, RoomStatus
from app.models.pos import POSOrder, POSOrderStatus
from app.models.housekeeping import HousekeepingTask, TaskStatus
from app.models.lead import Lead, LeadStatus
from app.models.billing import FolioItem, FolioCategory
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.report import DashboardOverviewResponse, HospitalityKPIMetrics, RevenueByDepartment, DailyRevenueTrend
from app.api.deps import get_current_user, get_current_active_tenant
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    today = date.today()

    total_rooms = db.query(Room).filter(Room.tenant_id == current_user.tenant_id).count()
    occupied_rooms = db.query(Room).filter(
        Room.tenant_id == current_user.tenant_id,
        Room.status == RoomStatus.OCCUPIED
    ).count()
    available_rooms = db.query(Room).filter(
        Room.tenant_id == current_user.tenant_id,
        Room.status == RoomStatus.AVAILABLE
    ).count()

    occupancy_rate = round((occupied_rooms / total_rooms * 100.0), 1) if total_rooms > 0 else 0.0

    # Calculate Total Room Revenue in last 30 days
    last_30_days = today - timedelta(days=30)
    recent_bookings = db.query(Booking).filter(
        Booking.tenant_id == current_user.tenant_id,
        Booking.check_in_date >= last_30_days,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT])
    ).all()

    total_room_rev = sum([float(b.total_room_rate) for b in recent_bookings])
    rooms_sold_count = sum([len(b.booking_rooms) for b in recent_bookings]) or 1

    adr = round(total_room_rev / rooms_sold_count, 2) if total_room_rev > 0 else 0.0
    revpar = round(total_room_rev / (total_rooms * 30), 2) if total_rooms > 0 else 0.0

    todays_check_ins = db.query(Booking).filter(
        Booking.tenant_id == current_user.tenant_id,
        Booking.check_in_date == today,
        Booking.status == BookingStatus.CONFIRMED
    ).count()

    todays_check_outs = db.query(Booking).filter(
        Booking.tenant_id == current_user.tenant_id,
        Booking.check_out_date == today,
        Booking.status == BookingStatus.CHECKED_IN
    ).count()

    active_inquiries = db.query(Lead).filter(
        Lead.tenant_id == current_user.tenant_id,
        Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUOTED])
    ).count()

    active_pos_orders = db.query(POSOrder).filter(
        POSOrder.tenant_id == current_user.tenant_id,
        POSOrder.status.in_([POSOrderStatus.ACTIVE, POSOrderStatus.KOT_SENT, POSOrderStatus.SERVED])
    ).count()

    pending_cleaning_rooms = db.query(Room).filter(
        Room.tenant_id == current_user.tenant_id,
        Room.status == RoomStatus.CLEANING
    ).count()

    kpis = HospitalityKPIMetrics(
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        available_rooms=available_rooms,
        occupancy_rate=occupancy_rate,
        adr=adr,
        revpar=revpar,
        todays_check_ins=todays_check_ins,
        todays_check_outs=todays_check_outs,
        active_inquiries=active_inquiries,
        active_pos_orders=active_pos_orders,
        pending_cleaning_rooms=pending_cleaning_rooms
    )

    # Department breakdown
    pos_revenue = sum([float(o.total_amount) for o in db.query(POSOrder).filter(
        POSOrder.tenant_id == current_user.tenant_id,
        POSOrder.status == POSOrderStatus.CLOSED
    ).all()])
    
    total_rev_sum = total_room_rev + pos_revenue
    if total_rev_sum == 0:
        total_rev_sum = 1.0

    dept_breakdown = [
        RevenueByDepartment(department="Rooms & Suites", amount=total_room_rev, percentage=round((total_room_rev / total_rev_sum) * 100, 1)),
        RevenueByDepartment(department="Restaurant & Dining", amount=pos_revenue, percentage=round((pos_revenue / total_rev_sum) * 100, 1)),
        RevenueByDepartment(department="Banquets & Events", amount=0.0, percentage=0.0)
    ]

    # Daily trend (past 7 days)
    trend = []
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_str = day_date.strftime("%b %d")
        day_bks = [b for b in recent_bookings if b.check_in_date == day_date]
        day_room_rev = sum([float(b.total_room_rate) for b in day_bks])
        trend.append(DailyRevenueTrend(
            date=day_str,
            room_revenue=round(day_room_rev, 2),
            pos_revenue=round(pos_revenue / 30.0, 2),
            total_revenue=round(day_room_rev + (pos_revenue / 30.0), 2)
        ))

    recent_bks_resp = []
    for b in recent_bookings[-5:]:
        recent_bks_resp.append({
            "id": b.id,
            "booking_number": b.booking_number,
            "guest_name": b.guest.full_name if b.guest else "Guest",
            "check_in": str(b.check_in_date),
            "check_out": str(b.check_out_date),
            "status": b.status.value,
            "amount": float(b.final_amount)
        })

    return DashboardOverviewResponse(
        kpis=kpis,
        revenue_departments=dept_breakdown,
        recent_trend=trend,
        recent_bookings=recent_bks_resp
    )

@router.get("/export-excel")
def export_bookings_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Hospitality Bookings"

    # Header Title
    ws.merge_cells("A1:I1")
    ws["A1"] = f"{tenant.name} — Comprehensive Reservation & Billing Register"
    ws["A1"].font = Font(name="Calibri", size=15, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 36

    # Column Headers
    headers = ["Booking No", "Guest Name", "Phone", "Check-In", "Check-Out", "Status", "Total Amount (₹)", "Paid (₹)", "Balance (₹)"]
    ws.append(headers)
    ws.row_dimensions[2].height = 24
    header_fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=2, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    bookings = db.query(Booking).filter(
        Booking.tenant_id == current_user.tenant_id
    ).order_by(Booking.check_in_date.desc()).all()

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    row_num = 3
    for b in bookings:
        ws.append([
            b.booking_number,
            b.guest.full_name if b.guest else "Unknown",
            b.guest.phone if b.guest else "",
            str(b.check_in_date),
            str(b.check_out_date),
            b.status.value,
            float(b.final_amount),
            float(b.paid_amount),
            float(b.balance_amount)
        ])
        for col_idx in range(1, len(headers) + 1):
            c = ws.cell(row=row_num, column=col_idx)
            c.border = thin_border
            if col_idx in [7, 8, 9]:
                c.number_format = '#,##0.00'
                c.alignment = Alignment(horizontal="right")
        row_num += 1

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Bookings_Report_{date.today()}.xlsx"}
    )
