import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Users,
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/client';
import { DashboardMetrics } from '../../types';

interface DashboardProps {
  onNewBookingClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewBookingClick }) => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const { kpis, revenue_departments, recent_trend, recent_bookings } = data;
  const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hospitality Operations Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time occupancy, folio collections, and restaurant revenue overview.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/tape-chart')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            Tape Chart
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            Restaurant POS
          </button>
          {onNewBookingClick && (
            <button
              onClick={onNewBookingClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Reservation</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Occupancy Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Occupancy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.occupancy_rate}%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {kpis.occupied_rooms} of {kpis.total_rooms} Rooms Occupied
            </p>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.available_rooms}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for Check-In</p>
          </div>
        </div>

        {/* ADR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ADR (Avg Rate)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{kpis.adr.toLocaleString()}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Avg Daily Rate</p>
          </div>
        </div>

        {/* RevPAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">RevPAR</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{kpis.revpar.toLocaleString()}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Per Available Room</p>
          </div>
        </div>

        {/* Today's Check-Ins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Check-Ins Today</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.todays_check_ins}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">{kpis.todays_check_outs} Check-Outs Today</p>
          </div>
        </div>

        {/* Active POS Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active KOTs</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.active_pos_orders}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Kitchen / Tables</p>
          </div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Performance Trend</h2>
              <p className="text-xs text-slate-500">Daily room tariff & restaurant collections</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recent_trend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total_revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Department */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900">Department Contribution</h2>
          <p className="text-xs text-slate-500 mb-4">Rooms vs. F&B vs. Services</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenue_departments}
                  dataKey="amount"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {revenue_departments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-2 pt-2 border-t border-slate-100">
            {revenue_departments.map((dept, idx) => (
              <div key={dept.department} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{dept.department}</span>
                </div>
                <span className="font-bold text-slate-900">₹{dept.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reservations Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Front Desk Activity</h2>
            <p className="text-xs text-slate-500">Latest reservation status and guest check-ins</p>
          </div>
          <button
            onClick={() => navigate('/bookings')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View All Reservations →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-6 py-3">Booking Ref</th>
                <th className="px-6 py-3">Guest Name</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {recent_bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{b.booking_number}</td>
                  <td className="px-6 py-3.5">{b.guest_name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{b.check_in} → {b.check_out}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      b.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-slate-900">₹{b.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
