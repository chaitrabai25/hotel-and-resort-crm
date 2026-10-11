import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BookmarkCheck,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  Users,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  BarChart3,
  Settings,
  Crown,
  Hotel
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { name: 'Room Tape Chart', path: '/tape-chart', icon: CalendarDays, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { name: 'Reservations', path: '/bookings', icon: BookmarkCheck, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { name: 'Rooms & Inventory', path: '/rooms', icon: BedDouble, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING_SUPERVISOR'] },
    { name: 'Restaurant POS', path: '/pos', icon: UtensilsCrossed, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'POS_CASHIER', 'POS_WAITER'] },
    { name: 'Billing & Folios', path: '/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { name: 'Guest Directory', path: '/guests', icon: Users, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { name: 'Housekeeping', path: '/housekeeping', icon: Sparkles, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'HOUSEKEEPING_SUPERVISOR', 'HOUSEKEEPING_STAFF'] },
    { name: 'Leads & Banquets', path: '/leads', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { name: 'Staff Management', path: '/staff', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER'] },
    { name: 'Analytics & Reports', path: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'GENERAL_MANAGER', 'ACCOUNTANT'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
  ];

  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Branding */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <Hotel className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white text-base tracking-tight truncate">
            {user?.tenant_name || 'GrandStay CRM'}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium tracking-wide uppercase">
            Hospitality SaaS
          </span>
        </div>
      </div>

      {/* Super Admin Special Link */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="px-3 pt-3">
          <NavLink
            to="/superadmin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`
            }
          >
            <Crown className="w-4 h-4 shrink-0" />
            <span>SaaS Master Admin</span>
          </NavLink>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Operations
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
