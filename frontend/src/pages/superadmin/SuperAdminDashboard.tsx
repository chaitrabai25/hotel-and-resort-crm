import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  Building2,
  Users,
  BedDouble,
  CreditCard,
  Plus,
  LogIn,
  CheckCircle,
  AlertTriangle,
  Search,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { Tenant, SubscriptionPlan } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { impersonateTenant } = useAuth();

  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tenant form state
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [businessType, setBusinessType] = useState('RESORT');
  const [planId, setPlanId] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@12345');
  const [city, setCity] = useState('');

  // Fetch Global Stats
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => (await api.get('/superadmin/stats')).data,
  });

  // Fetch Tenants
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['superadmin-tenants'],
    queryFn: async () => (await api.get('/superadmin/tenants')).data,
  });

  // Fetch Plans
  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['superadmin-plans'],
    queryFn: async () => (await api.get('/superadmin/plans')).data,
  });

  // Add Tenant Mutation
  const addTenantMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/superadmin/tenants', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
      setIsAddTenantOpen(false);
      setTenantName('');
      setTenantSlug('');
      setContactName('');
      setContactEmail('');
      alert('Tenant created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create tenant');
    }
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    addTenantMutation.mutate({
      name: tenantName,
      slug: tenantSlug,
      business_type: businessType,
      subscription_plan_id: planId || (plans?.[0]?.id),
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      city: city || 'Bangalore',
      admin_password: adminPassword
    });
  };

  const filteredTenants = tenants?.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>Platform Owner Control Center</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">SaaS Multi-Tenant Master Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage subscribed hotels, resorts, enterprise licensing, and MRR cash flow.
          </p>
        </div>
        <button
          onClick={() => setIsAddTenantOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Customer Tenant</span>
        </button>
      </div>

      {/* Global SaaS Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Subscribed Tenants</span>
            <Building2 className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{stats?.total_tenants || 0}</span>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{stats?.active_tenants || 0} Active Organizations</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Estimated MRR</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">₹{stats?.estimated_mrr?.toLocaleString() || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Monthly Recurring Revenue</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Platform Properties</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{stats?.total_properties || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Across All Accounts</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Managed Rooms</span>
            <BedDouble className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{stats?.total_rooms || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Live Inventory</p>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Customer Organizations Directory</h2>
            <p className="text-xs text-slate-500">All hotels, resorts, and hospitality chains</p>
          </div>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, slug, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Company Name</th>
                <th className="px-6 py-3.5">Type & Plan</th>
                <th className="px-6 py-3.5">Contact Email</th>
                <th className="px-6 py-3.5">Capacity Limits</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Support Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTenants?.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 block">{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">slug: {t.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 block capitalize">{t.business_type.toLowerCase()}</span>
                    <span className="text-[11px] text-brand-600 font-semibold">{t.plan_name || 'Standard'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>{t.contact_email}</div>
                    <div className="text-[11px] text-slate-400">{t.contact_phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div>{t.max_rooms} Rooms</div>
                    <div className="text-[10px] text-slate-400">{t.max_properties} Property · {t.max_staff} Staff</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => impersonateTenant(t.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                      title="Jump to Tenant Portal"
                    >
                      <LogIn className="w-3.5 h-3.5 text-amber-400" />
                      <span>Impersonate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Tenant Modal */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Provision New Customer Tenant</h3>
            <p className="text-xs text-slate-500">Create hotel/resort account and initial administrative credentials.</p>

            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Resort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whispering Palms Beach Resort"
                  value={tenantName}
                  onChange={(e) => {
                    setTenantName(e.target.value);
                    setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tenant Slug *</label>
                  <input
                    type="text"
                    required
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subscription Plan</label>
                  <select
                    value={planId || ''}
                    onChange={(e) => setPlanId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {plans?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="General Manager"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@whisperingpalms.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTenantMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-600/30"
                >
                  {addTenantMutation.isPending ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
