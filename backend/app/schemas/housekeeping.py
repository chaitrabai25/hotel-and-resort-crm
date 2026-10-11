from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.housekeeping import TaskType, TaskStatus, PriorityLevel, MaintenanceCategory, MaintenanceStatus

class HousekeepingTaskCreate(BaseModel):
    property_id: int
    room_id: int
    task_type: TaskType = TaskType.CLEANING
    priority: PriorityLevel = PriorityLevel.NORMAL
    assigned_to_id: Optional[int] = None
    notes: Optional[str] = None

class HousekeepingTaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    priority: Optional[PriorityLevel] = None
    assigned_to_id: Optional[int] = None
    notes: Optional[str] = None

class HousekeepingTaskResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    room_id: int
    room_number: str
    task_type: TaskType
    status: TaskStatus
    priority: PriorityLevel
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MaintenanceTicketCreate(BaseModel):
    property_id: int
    room_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: MaintenanceCategory = MaintenanceCategory.OTHER
    priority: PriorityLevel = PriorityLevel.NORMAL
    assigned_to_id: Optional[int] = None

class MaintenanceTicketUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[PriorityLevel] = None
    assigned_to_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class MaintenanceTicketResponse(BaseModel):
    id: int
    tenant_id: int
    property_id: int
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: MaintenanceCategory
    priority: PriorityLevel
    status: MaintenanceStatus
    reported_by_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
