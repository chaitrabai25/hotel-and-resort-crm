export type UserRole = 
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'GENERAL_MANAGER'
  | 'RECEPTIONIST'
  | 'POS_CASHIER'
  | 'POS_WAITER'
  | 'HOUSEKEEPING_SUPERVISOR'
  | 'HOUSEKEEPING_STAFF'
  | 'ACCOUNTANT';

export interface User {
  id: number;
  tenant_id?: number | null;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  tenant_name?: string | null;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  subscription_plan_id?: number | null;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';
  max_rooms: number;
  max_properties: number;
  max_staff: number;
  contact_name?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  tax_id_gstin?: string | null;
  currency: string;
  currency_symbol: string;
  logo_url?: string | null;
  plan_name?: string | null;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  billing_cycle: string;
  price: number;
  max_rooms: number;
  max_properties: number;
  max_staff: number;
  features_json?: string | null;
  is_active: boolean;
}

export interface Property {
  id: number;
  tenant_id: number;
  name: string;
  code?: string | null;
  property_type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  check_in_time: string;
  check_out_time: string;
  tax_gstin?: string | null;
  is_active: boolean;
}

export interface RoomType {
  id: number;
  tenant_id: number;
  property_id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  base_price: number;
  weekend_price?: number | null;
  extra_bed_price?: number | null;
  max_adults: number;
  max_children: number;
  amenities_json?: string | null;
  is_active: boolean;
}

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE' | 'BLOCKED';

export interface Room {
  id: number;
  tenant_id: number;
  property_id: number;
  room_type_id: number;
  room_number: string;
  floor?: string | null;
  wing?: string | null;
  status: RoomStatus;
  notes?: string | null;
  room_type_name?: string | null;
  base_price?: number | null;
}

export interface Guest {
  id: number;
  tenant_id: number;
  full_name: string;
  email?: string | null;
  phone: string;
  alternate_phone?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_document_url?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  vip_tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  dietary_preferences?: string | null;
  special_preferences?: string | null;
  is_blacklisted: boolean;
  total_stays: number;
  total_spend: number;
  created_at: string;
}

export type BookingStatus = 'INQUIRY' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface BookingRoom {
  id: number;
  room_id: number;
  room_number: string;
  room_type_name: string;
  rate_per_night: number;
  nights: number;
  total_rate: number;
}

export interface Booking {
  id: number;
  tenant_id: number;
  property_id: number;
  property_name?: string | null;
  booking_number: string;
  guest_id: number;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  source: string;
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string | null;
  actual_check_out?: string | null;
  adults: number;
  children: number;
  total_room_rate: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  special_requests?: string | null;
  notes?: string | null;
  rooms: BookingRoom[];
  created_at: string;
}

export interface FolioItem {
  id: number;
  folio_id: number;
  category: 'ROOM' | 'RESTAURANT' | 'LAUNDRY' | 'SPA' | 'TRANSPORT' | 'MINIBAR' | 'MISC';
  description: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  item_date: string;
  reference_id?: string | null;
}

export interface Payment {
  id: number;
  folio_id?: number | null;
  booking_id?: number | null;
  payment_number: string;
  amount: number;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'NETBANKING' | 'ROOM_CHARGE';
  transaction_reference?: string | null;
  notes?: string | null;
  payment_date: string;
}

export interface BillingFolio {
  id: number;
  tenant_id: number;
  booking_id: number;
  booking_number?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  folio_number: string;
  total_charges: number;
  total_tax: number;
  total_discount: number;
  net_amount: number;
  total_paid: number;
  balance_due: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
  created_at: string;
  items: FolioItem[];
  payments: Payment[];
}

export interface DiningTable {
  id: number;
  tenant_id: number;
  property_id: number;
  table_number: string;
  area: 'INDOOR' | 'LAWN' | 'POOLSIDE' | 'TERRACE' | 'ROOM_SERVICE';
  capacity: number;
  status: 'VACANT' | 'OCCUPIED' | 'BILLED' | 'RESERVED';
  active_order_id?: number | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category_name?: string | null;
  name: string;
  description?: string | null;
  price: number;
  tax_percent: number;
  is_veg: boolean;
  is_available: boolean;
  preparation_time_minutes: number;
  image_url?: string | null;
}

export interface POSOrderItem {
  id: number;
  menu_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  tax_amount: number;
  total_price: number;
  special_notes?: string | null;
  kot_status: string;
}

export interface POSOrder {
  id: number;
  tenant_id: number;
  property_id: number;
  order_number: string;
  table_id?: number | null;
  table_number?: string | null;
  booking_id?: number | null;
  room_number?: string | null;
  guest_name?: string | null;
  order_type: 'DINE_IN' | 'ROOM_SERVICE' | 'TAKEAWAY';
  status: 'ACTIVE' | 'KOT_SENT' | 'SERVED' | 'BILLED' | 'CLOSED' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  is_room_charged: boolean;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
  items: POSOrderItem[];
}

export interface HousekeepingTask {
  id: number;
  tenant_id: number;
  property_id: number;
  room_id: number;
  room_number: string;
  task_type: 'CLEANING' | 'DEEP_CLEANING' | 'INSPECTION' | 'TURNDOWN';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  notes?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MaintenanceTicket {
  id: number;
  tenant_id: number;
  property_id: number;
  room_id?: number | null;
  room_number?: string | null;
  title: string;
  description?: string | null;
  category: 'PLUMBING' | 'ELECTRICAL' | 'AC_HVAC' | 'CARPENTRY' | 'APPLIANCE' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  reported_by_name?: string | null;
  assigned_to_name?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export interface Lead {
  id: number;
  tenant_id: number;
  guest_name: string;
  phone: string;
  email?: string | null;
  lead_type: 'ROOM_STAY' | 'BANQUET' | 'WEDDING' | 'CORPORATE_RETREAT' | 'PARTY_EVENT';
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'NEGOTIATION' | 'WON' | 'LOST';
  expected_check_in?: string | null;
  expected_check_out?: string | null;
  guest_count: number;
  estimated_budget?: number | null;
  source: string;
  notes?: string | null;
  assigned_to_name?: string | null;
  created_at: string;
}

export interface Quotation {
  id: number;
  tenant_id: number;
  quotation_number: string;
  lead_id?: number | null;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  package_title: string;
  valid_until?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  terms_conditions?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  created_at: string;
}

export interface DashboardMetrics {
  kpis: {
    total_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    occupancy_rate: number;
    adr: number;
    revpar: number;
    todays_check_ins: number;
    todays_check_outs: number;
    active_inquiries: number;
    active_pos_orders: number;
    pending_cleaning_rooms: number;
  };
  revenue_departments: {
    department: string;
    amount: number;
    percentage: number;
  }[];
  recent_trend: {
    date: string;
    room_revenue: number;
    pos_revenue: number;
    total_revenue: number;
  }[];
  recent_bookings: {
    id: number;
    booking_number: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    status: string;
    amount: number;
  }[];
}

export type DashboardOverview = DashboardMetrics;
