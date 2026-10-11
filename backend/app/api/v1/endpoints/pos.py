import random
from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pos import (
    DiningTable, MenuCategory, MenuItem, POSOrder, POSOrderItem,
    TableStatus, DiningArea, POSOrderType, POSOrderStatus
)
from app.models.booking import Booking, BookingStatus
from app.models.billing import BillingFolio, FolioItem, FolioCategory
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.pos import (
    DiningTableCreate, DiningTableResponse,
    MenuCategoryCreate, MenuCategoryResponse,
    MenuItemCreate, MenuItemResponse,
    POSOrderCreate, POSOrderResponse, SettleOrderRequest
)
from app.api.deps import get_current_user, get_current_active_tenant

router = APIRouter()

def generate_order_number(tenant_id: int) -> str:
    now = datetime.now()
    rand_suffix = random.randint(100, 999)
    return f"KOT-{now.strftime('%H%M')}-{rand_suffix}"

# ----------------- TABLES -----------------

@router.get("/tables", response_model=List[DiningTableResponse])
def list_tables(
    property_id: Optional[int] = None,
    area: Optional[DiningArea] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(DiningTable).filter(DiningTable.tenant_id == current_user.tenant_id)
    if property_id:
        query = query.filter(DiningTable.property_id == property_id)
    if area:
        query = query.filter(DiningTable.area == area)
    return query.order_by(DiningTable.table_number.asc()).all()

@router.post("/tables", response_model=DiningTableResponse)
def create_table(
    table_in: DiningTableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    table = DiningTable(
        tenant_id=current_user.tenant_id,
        property_id=table_in.property_id,
        table_number=table_in.table_number,
        area=table_in.area,
        capacity=table_in.capacity,
        status=TableStatus.VACANT
    )
    db.add(table)
    db.commit()
    db.refresh(table)
    return table

# ----------------- MENU -----------------

@router.get("/categories", response_model=List[MenuCategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    return db.query(MenuCategory).filter(MenuCategory.tenant_id == current_user.tenant_id).order_by(MenuCategory.display_order.asc()).all()

@router.post("/categories", response_model=MenuCategoryResponse)
def create_category(
    cat_in: MenuCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    cat = MenuCategory(
        tenant_id=current_user.tenant_id,
        name=cat_in.name,
        display_order=cat_in.display_order
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/menu", response_model=List[MenuItemResponse])
def list_menu_items(
    category_id: Optional[int] = None,
    is_veg: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(MenuItem).filter(MenuItem.tenant_id == current_user.tenant_id)
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    if is_veg is not None:
        query = query.filter(MenuItem.is_veg == is_veg)
    
    items = query.order_by(MenuItem.name.asc()).all()
    res = []
    for it in items:
        resp = MenuItemResponse(
            id=it.id,
            category_id=it.category_id,
            category_name=it.category.name if it.category else "",
            name=it.name,
            description=it.description,
            price=float(it.price),
            tax_percent=float(it.tax_percent),
            is_veg=it.is_veg,
            is_available=it.is_available,
            preparation_time_minutes=it.preparation_time_minutes,
            image_url=it.image_url
        )
        res.append(resp)
    return res

@router.post("/menu", response_model=MenuItemResponse)
def create_menu_item(
    item_in: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    item = MenuItem(
        tenant_id=current_user.tenant_id,
        category_id=item_in.category_id,
        name=item_in.name,
        description=item_in.description,
        price=item_in.price,
        tax_percent=item_in.tax_percent,
        is_veg=item_in.is_veg,
        preparation_time_minutes=item_in.preparation_time_minutes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return MenuItemResponse(
        id=item.id,
        category_id=item.category_id,
        category_name=item.category.name if item.category else "",
        name=item.name,
        description=item.description,
        price=float(item.price),
        tax_percent=float(item.tax_percent),
        is_veg=item.is_veg,
        is_available=item.is_available,
        preparation_time_minutes=item.preparation_time_minutes
    )

# ----------------- ORDERS & KOT -----------------

@router.get("/orders", response_model=List[POSOrderResponse])
def list_orders(
    status: Optional[POSOrderStatus] = None,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    query = db.query(POSOrder).filter(POSOrder.tenant_id == current_user.tenant_id)
    if status:
        query = query.filter(POSOrder.status == status)
    orders = query.order_by(POSOrder.created_at.desc()).limit(limit).all()
    
    res = []
    for o in orders:
        items_resp = []
        for it in o.items:
            items_resp.append({
                "id": it.id,
                "menu_item_id": it.menu_item_id,
                "item_name": it.item_name,
                "quantity": it.quantity,
                "unit_price": float(it.unit_price),
                "tax_percent": float(it.tax_percent),
                "tax_amount": float(it.tax_amount),
                "total_price": float(it.total_price),
                "special_notes": it.special_notes,
                "kot_status": it.kot_status
            })

        res.append(POSOrderResponse(
            id=o.id,
            tenant_id=o.tenant_id,
            property_id=o.property_id,
            order_number=o.order_number,
            table_id=o.table_id,
            table_number=o.table.table_number if o.table else None,
            booking_id=o.booking_id,
            room_number=o.room_number,
            guest_name=o.guest_name,
            order_type=o.order_type,
            status=o.status,
            subtotal=float(o.subtotal),
            tax_amount=float(o.tax_amount),
            discount_amount=float(o.discount_amount),
            total_amount=float(o.total_amount),
            is_room_charged=o.is_room_charged,
            payment_method=o.payment_method,
            notes=o.notes,
            created_at=o.created_at,
            items=items_resp
        ))
    return res

@router.post("/orders", response_model=POSOrderResponse)
def create_pos_order(
    order_in: POSOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cannot create an empty order")

    # If linked to booking / room
    booking = None
    if order_in.booking_id:
        booking = db.query(Booking).filter(
            Booking.id == order_in.booking_id,
            Booking.tenant_id == current_user.tenant_id
        ).first()

    table = None
    if order_in.table_id:
        table = db.query(DiningTable).filter(
            DiningTable.id == order_in.table_id,
            DiningTable.tenant_id == current_user.tenant_id
        ).first()

    order_num = generate_order_number(current_user.tenant_id)
    new_order = POSOrder(
        tenant_id=current_user.tenant_id,
        property_id=order_in.property_id,
        order_number=order_num,
        table_id=order_in.table_id,
        booking_id=booking.id if booking else None,
        guest_name=order_in.guest_name or (booking.guest.full_name if booking and booking.guest else None),
        room_number=order_in.room_number,
        order_type=order_in.order_type,
        status=POSOrderStatus.KOT_SENT,
        notes=order_in.notes,
        created_by_id=current_user.id
    )
    db.add(new_order)
    db.flush()

    subtotal = 0.0
    tax_total = 0.0
    items_resp = []

    for item_req in order_in.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_req.menu_item_id,
            MenuItem.tenant_id == current_user.tenant_id
        ).first()
        if not menu_item:
            continue

        item_subtotal = float(menu_item.price) * item_req.quantity
        item_tax = round(item_subtotal * (float(menu_item.tax_percent) / 100.0), 2)
        item_total = round(item_subtotal + item_tax, 2)

        subtotal += item_subtotal
        tax_total += item_tax

        order_item = POSOrderItem(
            tenant_id=current_user.tenant_id,
            order_id=new_order.id,
            menu_item_id=menu_item.id,
            item_name=menu_item.name,
            quantity=item_req.quantity,
            unit_price=menu_item.price,
            tax_percent=menu_item.tax_percent,
            tax_amount=item_tax,
            total_price=item_total,
            special_notes=item_req.special_notes,
            kot_status="PREPARING"
        )
        db.add(order_item)
        db.flush()

        items_resp.append({
            "id": order_item.id,
            "menu_item_id": order_item.menu_item_id,
            "item_name": order_item.item_name,
            "quantity": order_item.quantity,
            "unit_price": float(order_item.unit_price),
            "tax_percent": float(order_item.tax_percent),
            "tax_amount": float(order_item.tax_amount),
            "total_price": float(order_item.total_price),
            "special_notes": order_item.special_notes,
            "kot_status": order_item.kot_status
        })

    new_order.subtotal = round(subtotal, 2)
    new_order.tax_amount = round(tax_total, 2)
    new_order.total_amount = round(subtotal + tax_total, 2)

    if table:
        table.status = TableStatus.OCCUPIED
        table.active_order_id = new_order.id

    db.commit()
    db.refresh(new_order)

    return POSOrderResponse(
        id=new_order.id,
        tenant_id=new_order.tenant_id,
        property_id=new_order.property_id,
        order_number=new_order.order_number,
        table_id=new_order.table_id,
        table_number=table.table_number if table else None,
        booking_id=new_order.booking_id,
        room_number=new_order.room_number,
        guest_name=new_order.guest_name,
        order_type=new_order.order_type,
        status=new_order.status,
        subtotal=float(new_order.subtotal),
        tax_amount=float(new_order.tax_amount),
        discount_amount=0.0,
        total_amount=float(new_order.total_amount),
        is_room_charged=False,
        created_at=new_order.created_at,
        items=items_resp
    )

@router.post("/orders/{order_id}/settle")
def settle_pos_order(
    order_id: int,
    settle_data: SettleOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_active_tenant)
) -> Any:
    order = db.query(POSOrder).filter(
        POSOrder.id == order_id,
        POSOrder.tenant_id == current_user.tenant_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == POSOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Order already settled and closed")

    if settle_data.transfer_to_room:
        if not order.booking_id:
            raise HTTPException(status_code=400, detail="Order is not associated with an active room reservation")
        
        booking = db.query(Booking).filter(Booking.id == order.booking_id).first()
        if not booking or booking.status != BookingStatus.CHECKED_IN:
            raise HTTPException(status_code=400, detail="Associated room booking is not currently checked-in")

        folio = booking.folio
        if not folio:
            raise HTTPException(status_code=400, detail="Active booking folio not found")

        # Post charge to room folio
        folio_item = FolioItem(
            tenant_id=current_user.tenant_id,
            folio_id=folio.id,
            category=FolioCategory.RESTAURANT,
            description=f"Restaurant / F&B Order ({order.order_number})",
            quantity=1,
            unit_price=order.subtotal,
            tax_percent=5.00,
            tax_amount=order.tax_amount,
            total_amount=order.total_amount,
            reference_id=order.order_number
        )
        db.add(folio_item)

        # Update folio balances
        folio.total_charges = float(folio.total_charges) + float(order.subtotal)
        folio.total_tax = float(folio.total_tax) + float(order.tax_amount)
        folio.net_amount = float(folio.net_amount) + float(order.total_amount)
        folio.balance_due = float(folio.balance_due) + float(order.total_amount)

        # Also update booking final & balance amounts
        booking.final_amount = float(booking.final_amount) + float(order.total_amount)
        booking.balance_amount = float(booking.balance_amount) + float(order.total_amount)

        order.is_room_charged = True
        order.payment_method = "ROOM_CHARGE"
    else:
        order.payment_method = settle_data.payment_method or "CASH"

    order.status = POSOrderStatus.CLOSED

    # Release Table
    if order.table:
        order.table.status = TableStatus.VACANT
        order.table.active_order_id = None

    db.commit()
    return {"message": "Order settled successfully", "order_number": order.order_number}
