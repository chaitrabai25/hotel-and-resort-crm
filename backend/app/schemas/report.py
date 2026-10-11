from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class HospitalityKPIMetrics(BaseModel):
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    occupancy_rate: float        # Percentage (0-100)
    adr: float                   # Average Daily Rate
    revpar: float                # Revenue Per Available Room
    todays_check_ins: int
    todays_check_outs: int
    active_inquiries: int
    active_pos_orders: int
    pending_cleaning_rooms: int

class RevenueByDepartment(BaseModel):
    department: str
    amount: float
    percentage: float

class DailyRevenueTrend(BaseModel):
    date: str
    room_revenue: float
    pos_revenue: float
    total_revenue: float

class DashboardOverviewResponse(BaseModel):
    kpis: HospitalityKPIMetrics
    revenue_departments: List[RevenueByDepartment]
    recent_trend: List[DailyRevenueTrend]
    recent_bookings: List[Dict[str, Any]]
