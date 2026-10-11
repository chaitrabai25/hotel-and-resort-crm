import json
from datetime import datetime, date, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.tenant import SubscriptionPlan, Tenant, BillingCycle, TenantStatus, BusinessType
from app.models.user import User, UserRole
from app.models.property import Property, RoomType, Room, RoomStatus
from app.models.guest import Guest, IdType, VIPTier
from app.models.booking import Booking, BookingRoom, BookingSource, BookingStatus, PaymentStatus
from app.models.billing import BillingFolio, FolioItem, Payment, FolioCategory, FolioStatus, PaymentMethod
from app.models.pos import DiningTable, MenuCategory, MenuItem, POSOrder, POSOrderItem, TableStatus, DiningArea, POSOrderType, POSOrderStatus
from app.models.housekeeping import HousekeepingTask, MaintenanceTicket, TaskType, TaskStatus, PriorityLevel, MaintenanceCategory, MaintenanceStatus
from app.models.lead import Lead, Quotation, LeadStatus, LeadType, QuotationStatus

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_seed():
    print("[INFO] Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Super Admin
        super_admin = db.query(User).filter(User.email == "superadmin@grandstay.com").first()
        if not super_admin:
            super_admin = User(
                email="superadmin@grandstay.com",
                password_hash=get_password_hash("Admin@12345"),
                full_name="Master SaaS Owner",
                phone="+91 99999 88888",
                role=UserRole.SUPER_ADMIN,
                is_active=True
            )
            db.add(super_admin)
        print("[OK] Created Super Admin: superadmin@grandstay.com")

        # 2. Subscription Plans
        plans_data = [
            {
                "name": "Boutique Hotel Starter",
                "cycle": BillingCycle.MONTHLY,
                "price": 3999.00,
                "max_rooms": 15,
                "max_properties": 1,
                "max_staff": 5,
                "features": ["Room Booking Engine", "Visual Tape Chart", "Basic Folios", "Standard Invoices"]
            },
            {
                "name": "Luxury Resort & Spa Suite",
                "cycle": BillingCycle.MONTHLY,
                "price": 8999.00,
                "max_rooms": 50,
                "max_properties": 3,
                "max_staff": 25,
                "features": ["All Starter Features", "Restaurant POS & KOT", "Folio Room Transfer", "Housekeeping Board", "WhatsApp Automations", "Excel Reports"]
            },
            {
                "name": "Hospitality Conglomerate Enterprise",
                "cycle": BillingCycle.YEARLY,
                "price": 79999.00,
                "max_rooms": 300,
                "max_properties": 10,
                "max_staff": 100,
                "features": ["All Resort Features", "Multi-Branch Consolidations", "Dedicated Database Option", "Custom Domain Support", "24/7 SLA Support"]
            }
        ]

        plans = {}
        for p_info in plans_data:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == p_info["name"]).first()
            if not plan:
                plan = SubscriptionPlan(
                    name=p_info["name"],
                    billing_cycle=p_info["cycle"],
                    price=p_info["price"],
                    max_rooms=p_info["max_rooms"],
                    max_properties=p_info["max_properties"],
                    max_staff=p_info["max_staff"],
                    features_json=json.dumps(p_info["features"]),
                    is_active=True
                )
                db.add(plan)
                db.flush()
            plans[p_info["name"]] = plan
        print("[OK] Created Subscription Plans")

        # 3. Demo Tenant: Serene Valley Luxury Resort
        tenant = db.query(Tenant).filter(Tenant.slug == "serene-valley").first()
        now = datetime.now(timezone.utc)
        if not tenant:
            resort_plan = plans["Luxury Resort & Spa Suite"]
            tenant = Tenant(
                name="Serene Valley Luxury Resort & Spa",
                slug="serene-valley",
                business_type=BusinessType.RESORT,
                subscription_plan_id=resort_plan.id,
                status=TenantStatus.ACTIVE,
                max_rooms=resort_plan.max_rooms,
                max_properties=resort_plan.max_properties,
                max_staff=resort_plan.max_staff,
                contact_name="Aditya Verma",
                contact_email="admin@serenevalley.com",
                contact_phone="+91 98450 12345",
                address="Hilltop Rainforest Road, Coorg, Karnataka",
                city="Coorg",
                state="Karnataka",
                country="India",
                postal_code="571201",
                tax_id_gstin="29AAACS1234P1Z8",
                currency="INR",
                currency_symbol="₹",
                subscription_starts_at=now,
                subscription_expires_at=now + timedelta(days=365)
            )
            db.add(tenant)
            db.flush()
            print("[OK] Created Tenant: Serene Valley Luxury Resort & Spa")

        # 4. Tenant Users
        users_data = [
            ("admin@serenevalley.com", "Aditya Verma (Resort General Manager)", UserRole.TENANT_ADMIN),
            ("reception@serenevalley.com", "Pooja Hegde (Front Desk Lead)", UserRole.RECEPTIONIST),
            ("pos@serenevalley.com", "Manoj Kumar (F&B Restaurant Captain)", UserRole.POS_CASHIER),
            ("housekeeping@serenevalley.com", "Raju Shinde (Housekeeping Supervisor)", UserRole.HOUSEKEEPING_SUPERVISOR),
            ("accounts@serenevalley.com", "Sunil Rao (Chief Accountant)", UserRole.ACCOUNTANT),
        ]
        for email, name, role in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    tenant_id=tenant.id,
                    email=email,
                    password_hash=get_password_hash("Admin@12345"),
                    full_name=name,
                    phone="+91 98765 43210",
                    role=role,
                    is_active=True
                )
                db.add(user)
        print("[OK] Created Tenant Staff Accounts (password: Admin@12345)")

        # 5. Property
        prop = db.query(Property).filter(Property.tenant_id == tenant.id).first()
        if not prop:
            prop = Property(
                tenant_id=tenant.id,
                name="Serene Valley Main Resort & Lagoons",
                code="SV-RES-01",
                property_type="Resort",
                address="Hilltop Rainforest Road, Coorg, Karnataka",
                city="Coorg",
                state="Karnataka",
                country="India",
                phone="+91 98450 12345",
                email="stay@serenevalley.com",
                check_in_time="14:00",
                check_out_time="11:00",
                tax_gstin="29AAACS1234P1Z8"
            )
            db.add(prop)
            db.flush()

        # 6. Room Types & Physical Rooms
        rt_types = [
            ("Royal Pool Villa", "RPV", 14500.00, 16500.00, 2, 2, ["Private Plunge Pool", "Balcony", "Jacuzzi", "King Bed", "Rain Shower", "Free WiFi"]),
            ("Executive Lakeview Suite", "ELS", 8500.00, 9800.00, 2, 1, ["Lakeview Balcony", "Bathtub", "Minibar", "High Speed WiFi", "Coffee Maker"]),
            ("Deluxe Garden Cottage", "DGC", 4800.00, 5600.00, 2, 1, ["Garden Deck", "Queen Bed", "Forest View", "Tea Station"])
        ]
        created_rt = {}
        for name, code, base, wend, adults, kids, amens in rt_types:
            rt = db.query(RoomType).filter(RoomType.tenant_id == tenant.id, RoomType.code == code).first()
            if not rt:
                rt = RoomType(
                    tenant_id=tenant.id,
                    property_id=prop.id,
                    name=name,
                    code=code,
                    description=f"Premium luxury accommodation with world-class amenities.",
                    base_price=base,
                    weekend_price=wend,
                    max_adults=adults,
                    max_children=kids,
                    amenities_json=json.dumps(amens)
                )
                db.add(rt)
                db.flush()
            created_rt[code] = rt

        # Physical Rooms
        rooms_list = [
            ("Villa 1", "Ground", "Lagoon Area", created_rt["RPV"], RoomStatus.OCCUPIED),
            ("Villa 2", "Ground", "Lagoon Area", created_rt["RPV"], RoomStatus.AVAILABLE),
            ("Villa 3", "Ground", "Lagoon Area", created_rt["RPV"], RoomStatus.RESERVED),
            ("201", "2nd Floor", "East Wing", created_rt["ELS"], RoomStatus.OCCUPIED),
            ("202", "2nd Floor", "East Wing", created_rt["ELS"], RoomStatus.AVAILABLE),
            ("203", "2nd Floor", "East Wing", created_rt["ELS"], RoomStatus.CLEANING),
            ("101", "1st Floor", "Garden Wing", created_rt["DGC"], RoomStatus.AVAILABLE),
            ("102", "1st Floor", "Garden Wing", created_rt["DGC"], RoomStatus.AVAILABLE),
            ("103", "1st Floor", "Garden Wing", created_rt["DGC"], RoomStatus.MAINTENANCE),
        ]
        for rnum, floor, wing, rtype, rstatus in rooms_list:
            room = db.query(Room).filter(Room.tenant_id == tenant.id, Room.room_number == rnum).first()
            if not room:
                room = Room(
                    tenant_id=tenant.id,
                    property_id=prop.id,
                    room_type_id=rtype.id,
                    room_number=rnum,
                    floor=floor,
                    wing=wing,
                    status=rstatus
                )
                db.add(room)
        print("[OK] Created Room Types & 9 Physical Rooms")

        # 7. Dining Tables
        tables = [
            ("T-1", DiningArea.INDOOR, 4, TableStatus.VACANT),
            ("T-2", DiningArea.INDOOR, 6, TableStatus.OCCUPIED),
            ("P-1", DiningArea.POOLSIDE, 2, TableStatus.VACANT),
            ("P-2", DiningArea.POOLSIDE, 4, TableStatus.VACANT),
            ("L-1", DiningArea.LAWN, 8, TableStatus.VACANT),
        ]
        for tnum, area, cap, stat in tables:
            tbl = db.query(DiningTable).filter(DiningTable.tenant_id == tenant.id, DiningTable.table_number == tnum).first()
            if not tbl:
                tbl = DiningTable(
                    tenant_id=tenant.id,
                    property_id=prop.id,
                    table_number=tnum,
                    area=area,
                    capacity=cap,
                    status=stat
                )
                db.add(tbl)

        # 8. Menu Categories & Items
        cats = [("Appetizers & Starters", 1), ("Main Course Delicacies", 2), ("Breads & Rice", 3), ("Desserts", 4), ("Beverages", 5)]
        cat_map = {}
        for cname, dorder in cats:
            c = db.query(MenuCategory).filter(MenuCategory.tenant_id == tenant.id, MenuCategory.name == cname).first()
            if not c:
                c = MenuCategory(tenant_id=tenant.id, name=cname, display_order=dorder)
                db.add(c)
                db.flush()
            cat_map[cname] = c

        menu_items = [
            (cat_map["Appetizers & Starters"], "Paneer Tikka Angara", "Smoky cottage cheese cubes with tandoori spices", 380.00, True),
            (cat_map["Appetizers & Starters"], "Crispy Corn & Waterchestnut", "Golden tossed sweet corn in oriental herbs", 320.00, True),
            (cat_map["Main Course Delicacies"], "Dal Makhani Grand Dum", "Slow-cooked black lentils simmered overnight with butter", 420.00, True),
            (cat_map["Main Course Delicacies"], "Paneer Butter Masala", "Rich tomato makhani gravy with soft cottage cheese", 460.00, True),
            (cat_map["Main Course Delicacies"], "Coorg Kadhai Veg Melange", "Locally sourced estate vegetables tossed in fresh spices", 440.00, True),
            (cat_map["Breads & Rice"], "Garlic Butter Naan Basket", "Assortment of fresh tandoori garlic and butter naans", 180.00, True),
            (cat_map["Breads & Rice"], "Jeera Rice with Brown Onions", "Fragrant basmati rice tempered with royal cumin", 240.00, True),
            (cat_map["Desserts"], "Gulab Jamun with Kesari Rabri", "Warm khoya dumplings immersed in saffron condensed milk", 260.00, True),
            (cat_map["Desserts"], "Sizzling Brownie with Vanilla", "Decadent walnut fudge brownie served with hot fudge", 320.00, True),
            (cat_map["Beverages"], "Fresh Mint Lime Cooler", "Chilled sparkling lime with crushed mountain mint", 160.00, True),
        ]
        for cat_obj, iname, idesc, iprice, iveg in menu_items:
            mitem = db.query(MenuItem).filter(MenuItem.tenant_id == tenant.id, MenuItem.name == iname).first()
            if not mitem:
                mitem = MenuItem(
                    tenant_id=tenant.id,
                    category_id=cat_obj.id,
                    name=iname,
                    description=idesc,
                    price=iprice,
                    tax_percent=5.00,
                    is_veg=iveg,
                    preparation_time_minutes=15
                )
                db.add(mitem)
        print("[OK] Created Restaurant Tables & Digital Menu")

        # 9. Guests
        guests_info = [
            ("Vikramaditya Sharma", "+91 98451 99999", "vikram.sharma@example.com", "Bangalore", VIPTier.PLATINUM),
            ("Priya Venkatesh", "+91 97412 88888", "priya.v@example.com", "Chennai", VIPTier.GOLD),
            ("Ananya & Rahul Mehta", "+91 99203 77777", "rahul.mehta@example.com", "Mumbai", VIPTier.SILVER)
        ]
        guest_objs = []
        for gname, gphone, gemail, gcity, gvip in guests_info:
            g = db.query(Guest).filter(Guest.tenant_id == tenant.id, Guest.phone == gphone).first()
            if not g:
                g = Guest(
                    tenant_id=tenant.id,
                    full_name=gname,
                    phone=gphone,
                    email=gemail,
                    city=gcity,
                    vip_tier=gvip,
                    total_stays=1,
                    total_spend=25000.00
                )
                db.add(g)
                db.flush()
            guest_objs.append(g)

        # 10. Sample Active Booking with Room 201
        today = date.today()
        b1 = db.query(Booking).filter(Booking.tenant_id == tenant.id, Booking.booking_number == "BK-2610-001").first()
        room_201 = db.query(Room).filter(Room.tenant_id == tenant.id, Room.room_number == "201").first()
        if not b1 and room_201:
            b1 = Booking(
                tenant_id=tenant.id,
                property_id=prop.id,
                booking_number="BK-2610-001",
                guest_id=guest_objs[0].id,
                source=BookingSource.DIRECT,
                status=BookingStatus.CHECKED_IN,
                check_in_date=today,
                check_out_date=today + timedelta(days=2),
                actual_check_in=datetime.now(timezone.utc),
                adults=2,
                children=0,
                total_room_rate=17000.00,
                tax_amount=2040.00,
                discount_amount=1000.00,
                final_amount=18040.00,
                paid_amount=10000.00,
                balance_amount=8040.00,
                payment_status=PaymentStatus.PARTIAL
            )
            db.add(b1)
            db.flush()

            br1 = BookingRoom(
                tenant_id=tenant.id,
                booking_id=b1.id,
                room_id=room_201.id,
                room_type_id=room_201.room_type_id,
                rate_per_night=8500.00,
                nights=2,
                total_rate=17000.00
            )
            db.add(br1)

            # Folio
            f1 = BillingFolio(
                tenant_id=tenant.id,
                booking_id=b1.id,
                folio_number="INV-2610-001",
                total_charges=17000.00,
                total_tax=2040.00,
                total_discount=1000.00,
                net_amount=18040.00,
                total_paid=10000.00,
                balance_due=8040.00,
                status=FolioStatus.OPEN
            )
            db.add(f1)
            db.flush()

            fi1 = FolioItem(
                tenant_id=tenant.id,
                folio_id=f1.id,
                category=FolioCategory.ROOM,
                description="Executive Lakeview Suite (2 Nights Tariff)",
                quantity=2,
                unit_price=8500.00,
                tax_percent=12.00,
                tax_amount=2040.00,
                total_amount=19040.00,
                reference_id="BK-2610-001"
            )
            db.add(fi1)

            pay1 = Payment(
                tenant_id=tenant.id,
                folio_id=f1.id,
                booking_id=b1.id,
                payment_number="REC-2610-1001",
                amount=10000.00,
                payment_method=PaymentMethod.UPI,
                transaction_reference="UPI/2610/98712984",
                notes="Advance paid via Google Pay"
            )
            db.add(pay1)

        # 11. Housekeeping Tasks & Maintenance
        room_203 = db.query(Room).filter(Room.tenant_id == tenant.id, Room.room_number == "203").first()
        if room_203:
            hk1 = db.query(HousekeepingTask).filter(HousekeepingTask.room_id == room_203.id).first()
            if not hk1:
                hk1 = HousekeepingTask(
                    tenant_id=tenant.id,
                    property_id=prop.id,
                    room_id=room_203.id,
                    task_type=TaskType.CLEANING,
                    status=TaskStatus.IN_PROGRESS,
                    priority=PriorityLevel.HIGH,
                    notes="Guest checked out at 11:30 AM. Deep linen replacement needed."
                )
                db.add(hk1)

        room_103 = db.query(Room).filter(Room.tenant_id == tenant.id, Room.room_number == "103").first()
        if room_103:
            mt1 = db.query(MaintenanceTicket).filter(MaintenanceTicket.room_id == room_103.id).first()
            if not mt1:
                mt1 = MaintenanceTicket(
                    tenant_id=tenant.id,
                    property_id=prop.id,
                    room_id=room_103.id,
                    title="AC Cooling Fan Noise",
                    description="Split AC makes rattling vibration on high fan speed.",
                    category=MaintenanceCategory.AC_HVAC,
                    priority=PriorityLevel.NORMAL,
                    status=MaintenanceStatus.IN_PROGRESS
                )
                db.add(mt1)

        # 12. Banquet / Wedding Lead
        lead1 = db.query(Lead).filter(Lead.tenant_id == tenant.id, Lead.guest_name == "Karan Johar Celebrations").first()
        if not lead1:
            lead1 = Lead(
                tenant_id=tenant.id,
                guest_name="Karan Johar Celebrations",
                phone="+91 98200 11223",
                email="events@karanjohar.com",
                lead_type=LeadType.WEDDING,
                status=LeadStatus.QUOTED,
                expected_check_in=today + timedelta(days=45),
                expected_check_out=today + timedelta(days=48),
                guest_count=120,
                estimated_budget=1500000.00,
                notes="Full resort buyout request for 3-day destination celebration."
            )
            db.add(lead1)

        db.commit()
        print("[SUCCESS] Database successfully seeded with full hospitality records!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
