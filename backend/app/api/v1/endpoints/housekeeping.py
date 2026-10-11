from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.housekeeping import (
    HousekeepingTask, MaintenanceTicket,
    TaskStatus, MaintenanceStatus, TaskType, PriorityLevel
)
from app.models.property import Room, RoomStatus
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.housekeeping import (
    HousekeepingTaskCreate, HousekeepingTaskUpdate, HousekeepingTaskResponse,
    MaintenanceTicketCreate, MaintenanceTicketUpdate, MaintenanceTicketResponse
)
from app.api.deps import get_current_user, get_current_active_tenant

router = APIRouter()

# ----------------- HOUSEKEEPING TASKS -----------------

@router.get("/tasks", response_model=List[HousekeepingTaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(HousekeepingTask).filter(HousekeepingTask.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(HousekeepingTask.status == status)
    if property_id:
        query = query.filter(HousekeepingTask.property_id == property_id)
    
    tasks = query.order_by(HousekeepingTask.created_at.desc()).all()
    res = []
    for t in tasks:
        res.append(HousekeepingTaskResponse(
            id=t.id,
            tenant_id=t.tenant_id,
            property_id=t.property_id,
            room_id=t.room_id,
            room_number=t.room.room_number if t.room else "",
            task_type=t.task_type,
            status=t.status,
            priority=t.priority,
            assigned_to_id=t.assigned_to_id,
            assigned_to_name=t.assigned_to.full_name if t.assigned_to else None,
            notes=t.notes,
            created_at=t.created_at,
            started_at=t.started_at,
            completed_at=t.completed_at
        ))
    return res

@router.post("/tasks", response_model=HousekeepingTaskResponse)
def create_task(
    task_in: HousekeepingTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    room = db.query(Room).filter(
        Room.id == task_in.room_id,
        Room.tenant_id == current_user.tenant_id
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    new_task = HousekeepingTask(
        tenant_id=current_user.tenant_id,
        property_id=task_in.property_id,
        room_id=task_in.room_id,
        task_type=task_in.task_type,
        status=TaskStatus.PENDING,
        priority=task_in.priority,
        assigned_to_id=task_in.assigned_to_id,
        notes=task_in.notes
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return HousekeepingTaskResponse(
        id=new_task.id,
        tenant_id=new_task.tenant_id,
        property_id=new_task.property_id,
        room_id=new_task.room_id,
        room_number=room.room_number,
        task_type=new_task.task_type,
        status=new_task.status,
        priority=new_task.priority,
        assigned_to_id=new_task.assigned_to_id,
        notes=new_task.notes,
        created_at=new_task.created_at
    )

@router.put("/tasks/{task_id}", response_model=HousekeepingTaskResponse)
def update_task(
    task_id: int,
    task_in: HousekeepingTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    task = db.query(HousekeepingTask).filter(
        HousekeepingTask.id == task_id,
        HousekeepingTask.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_in.status:
        task.status = task_in.status
        if task_in.status == TaskStatus.IN_PROGRESS and not task.started_at:
            task.started_at = datetime.now(timezone.utc)
        elif task_in.status == TaskStatus.COMPLETED or task_in.status == TaskStatus.INSPECTED:
            task.completed_at = datetime.now(timezone.utc)
            # If inspected or completed, set room back to AVAILABLE if not occupied
            if task.room and task.room.status == RoomStatus.CLEANING:
                task.room.status = RoomStatus.AVAILABLE

    if task_in.priority:
        task.priority = task_in.priority
    if task_in.assigned_to_id is not None:
        task.assigned_to_id = task_in.assigned_to_id
    if task_in.notes:
        task.notes = task_in.notes

    db.commit()
    db.refresh(task)

    return HousekeepingTaskResponse(
        id=task.id,
        tenant_id=task.tenant_id,
        property_id=task.property_id,
        room_id=task.room_id,
        room_number=task.room.room_number if task.room else "",
        task_type=task.task_type,
        status=task.status,
        priority=task.priority,
        assigned_to_id=task.assigned_to_id,
        assigned_to_name=task.assigned_to.full_name if task.assigned_to else None,
        notes=task.notes,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at
    )

# ----------------- MAINTENANCE TICKETS -----------------

@router.get("/maintenance", response_model=List[MaintenanceTicketResponse])
def list_maintenance_tickets(
    status: Optional[MaintenanceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(MaintenanceTicket).filter(MaintenanceTicket.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(MaintenanceTicket.status == status)
        
    tickets = query.order_by(MaintenanceTicket.created_at.desc()).all()
    res = []
    for tk in tickets:
        res.append(MaintenanceTicketResponse(
            id=tk.id,
            tenant_id=tk.tenant_id,
            property_id=tk.property_id,
            room_id=tk.room_id,
            room_number=tk.room.room_number if tk.room else None,
            title=tk.title,
            description=tk.description,
            category=tk.category,
            priority=tk.priority,
            status=tk.status,
            reported_by_name=tk.reported_by.full_name if tk.reported_by else None,
            assigned_to_name=tk.assigned_to.full_name if tk.assigned_to else None,
            resolution_notes=tk.resolution_notes,
            created_at=tk.created_at
        ))
    return res

@router.post("/maintenance", response_model=MaintenanceTicketResponse)
def create_maintenance_ticket(
    ticket_in: MaintenanceTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    ticket = MaintenanceTicket(
        tenant_id=current_user.tenant_id,
        property_id=ticket_in.property_id,
        room_id=ticket_in.room_id,
        title=ticket_in.title,
        description=ticket_in.description,
        category=ticket_in.category,
        priority=ticket_in.priority,
        status=MaintenanceStatus.REPORTED,
        reported_by_id=current_user.id,
        assigned_to_id=ticket_in.assigned_to_id
    )
    db.add(ticket)
    
    # If room is specified, put it in MAINTENANCE status
    if ticket_in.room_id:
        room = db.query(Room).filter(Room.id == ticket_in.room_id).first()
        if room and room.status != RoomStatus.OCCUPIED:
            room.status = RoomStatus.MAINTENANCE

    db.commit()
    db.refresh(ticket)

    return MaintenanceTicketResponse(
        id=ticket.id,
        tenant_id=ticket.tenant_id,
        property_id=ticket.property_id,
        room_id=ticket.room_id,
        room_number=ticket.room.room_number if ticket.room else None,
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        reported_by_name=current_user.full_name,
        created_at=ticket.created_at
    )

@router.put("/maintenance/{ticket_id}", response_model=MaintenanceTicketResponse)
def update_maintenance_ticket(
    ticket_id: int,
    ticket_in: MaintenanceTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    ticket = db.query(MaintenanceTicket).filter(
        MaintenanceTicket.id == ticket_id,
        MaintenanceTicket.tenant_id == current_user.tenant_id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket_in.status:
        ticket.status = ticket_in.status
        if ticket_in.status in [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED]:
            # release room if under maintenance
            if ticket.room and ticket.room.status == RoomStatus.MAINTENANCE:
                ticket.room.status = RoomStatus.AVAILABLE

    if ticket_in.priority:
        ticket.priority = ticket_in.priority
    if ticket_in.assigned_to_id is not None:
        ticket.assigned_to_id = ticket_in.assigned_to_id
    if ticket_in.resolution_notes:
        ticket.resolution_notes = ticket_in.resolution_notes

    db.commit()
    db.refresh(ticket)

    return MaintenanceTicketResponse(
        id=ticket.id,
        tenant_id=ticket.tenant_id,
        property_id=ticket.property_id,
        room_id=ticket.room_id,
        room_number=ticket.room.room_number if ticket.room else None,
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        resolution_notes=ticket.resolution_notes,
        created_at=ticket.created_at
    )
