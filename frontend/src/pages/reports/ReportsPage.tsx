import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  BedDouble, 
  UtensilsCrossed, 
  Users, 
  Calendar, 
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import api from '../../api/client';
import { DashboardOverview } from '../../types';

export const ReportsPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7D');

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery<DashboardOverview>({
    queryKey: ['reportsOverview'],
    queryFn: async () => (await api.get('/reports/dashboard')).data,
  });

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/reports/export-excel', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hospitality_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Failed to download Excel report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = reportData?.kpis;
  const trendData = reportData?.recent_trend || [];
  const deptData = reportData?.revenue_departments || [];
  const recentBookings = reportData?.recent_bookings || [];

  const totalDeptRevenue = deptData.reduce((acc: number, d: { amount: number }) => acc + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Hospitality Intelligence & Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial audits, occupancy performance, RevPAR, and department revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
            {['7D', '30D', 'MTD'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === period
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/25"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting ? 'Generating Excel...' : 'Export to Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">
            {kpis?.occupancy_rate ?? 0}%
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{kpis?.occupied_rooms ?? 0}</span> occupied of{' '}
            <span className="text-white font-semibold">{kpis?.total_rooms ?? 0}</span> total rooms
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(kpis?.occupancy_rate ?? 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Daily Rate (ADR)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">
            ₹{kpis?.adr?.toLocaleString() ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Average revenue realized per sold room
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            Optimized yield pricing active
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RevPAR</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">
            ₹{kpis?.revpar?.toLocaleString() ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Revenue per available inventory room
          </div>
          <div className="mt-3 flex items-center text-xs text-purple-400 font-medium">
            Key metric for overall capacity efficiency
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Front Desk Flow</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-4 mt-3">
            <div>
              <span className="text-2xl font-bold text-emerald-400">{kpis?.todays_check_ins ?? 0}</span>
              <span className="text-xs text-slate-400 block">Check-ins</span>
            </div>
            <div className="text-slate-600">|</div>
            <div>
              <span className="text-2xl font-bold text-rose-400">{kpis?.todays_check_outs ?? 0}</span>
              <span className="text-xs text-slate-400 block">Check-outs</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">{kpis?.active_pos_orders ?? 0}</span> restaurant tables active
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Daily Revenue Trajectory</h2>
              <p className="text-xs text-slate-400 mt-0.5">Rooms vs Dining F&B earnings across last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-brand-400">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                Rooms
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Restaurant
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="room_revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRoom)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pos_revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Department */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white">Department Contribution</h2>
                <p className="text-xs text-slate-400 mt-0.5">Share of total property gross revenue</p>
              </div>
              <PieIcon className="w-5 h-5 text-slate-500" />
            </div>

            <div className="space-y-5">
              {deptData.map((dept: any, idx: number) => {
                const colors = [
                  'bg-brand-500 text-brand-400',
                  'bg-amber-500 text-amber-400',
                  'bg-emerald-500 text-emerald-400'
                ];
                const activeColor = colors[idx % colors.length];

                return (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{dept.department}</span>
                      <span className="font-bold text-white">₹{dept.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${activeColor.split(' ')[0]}`}
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      {dept.percentage}% of total gross
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80 bg-slate-950/40 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Gross Revenue Audited:</span>
              <span className="font-bold text-emerald-400 text-base">₹{totalDeptRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Ledger Bookings</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audited reservations booked across online and front-desk channels</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            Refresh Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Booking Ref</th>
                <th className="py-3.5 px-6">Primary Guest</th>
                <th className="py-3.5 px-6">Dates</th>
                <th className="py-3.5 px-6">Folio Status</th>
                <th className="py-3.5 px-6 text-right">Folio Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded yet</td>
                </tr>
              ) : (
                recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-brand-400">
                      {b.booking_number}
                    </td>
                    <td className="py-4 px-6 font-medium text-white">
                      {b.guest_name}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {b.check_in} <span className="text-slate-600">→</span> {b.check_out}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-white">
                      ₹{b.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ReportsPage;
