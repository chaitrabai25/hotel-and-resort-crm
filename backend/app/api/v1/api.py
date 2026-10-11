from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, superadmin, properties, rooms, bookings,
    guests, pos, folios, housekeeping, leads, staff,
    reports, whatsapp, settings
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["Super Admin"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms & Tape Chart"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings & Front Desk"])
api_router.include_router(guests.router, prefix="/guests", tags=["Guest CRM"])
api_router.include_router(pos.router, prefix="/pos", tags=["Restaurant POS & KOT"])
api_router.include_router(folios.router, prefix="/folios", tags=["Billing & Folios"])
api_router.include_router(housekeeping.router, prefix="/housekeeping", tags=["Housekeeping & Maintenance"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads & Quotations"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])
api_router.include_router(reports.router, prefix="/reports", tags=["Analytics & Reports"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
api_router.include_router(settings.router, prefix="/settings", tags=["Tenant Settings"])
