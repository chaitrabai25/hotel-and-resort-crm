import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Users, 
  UserCheck, 
  ShieldAlert,
  X,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { User, UserRole } from '../../types';

const ROLE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  TENANT_ADMIN: { 
    label: 'Property Admin', 
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    desc: 'Full administrative access to the resort & property settings' 
  },
  GENERAL_MANAGER: { 
    label: 'General Manager', 
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    desc: 'High-level operational oversight and reporting analytics' 
  },
  RECEPTIONIST: { 
    label: 'Front Desk / Receptionist', 
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Manages reservations, check-ins/outs, guest records, and folios' 
  },
  POS_CASHIER: { 
    label: 'Restaurant Cashier', 
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'Handles POS billing, settlement, and folio room transfers' 
  },
  POS_WAITER: { 
    label: 'Table Waiter / Captain', 
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    desc: 'Takes dining table orders and sends kitchen tickets (KOT)' 
  },
  HOUSEKEEPING_SUPERVISOR: { 
    label: 'Housekeeping Supervisor', 
    color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    desc: 'Assigns cleaning schedules and maintenance inspection tickets' 
  },
  HOUSEKEEPING_STAFF: { 
    label: 'Housekeeping Staff', 
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    desc: 'Cleans assigned rooms and updates room turnover statuses' 
  },
  ACCOUNTANT: { 
    label: 'Finance / Accountant', 
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    desc: 'Audits daily revenue, invoices, tax reports, and payments' 
  },
};

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('RECEPTIONIST');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Fetch staff
  const { data: staffList = [], isLoading } = useQuery<User[]>({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/staff/')).data,
  });

  // Fetch current tenant profile for limit check
  const { data: tenant } = useQuery({
    queryKey: ['currentTenantSettings'],
    queryFn: async () => (await api.get('/settings/current')).data,
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/staff/', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to create staff member.');
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => 
      (await api.put(`/staff/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditingStaff(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.detail || 'Failed to update staff member.');
    }
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('RECEPTIONIST');
    setIsActive(true);
    setFormError('');
  };

  const handleOpenEdit = (user: User) => {
    setEditingStaff(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPassword('');
    setPhone(user.phone || '');
    setRole(user.role);
    setIsActive(user.is_active);
    setFormError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (editingStaff) {
      const payload: any = {
        full_name: fullName,
        phone: phone || null,
        role: role,
        is_active: isActive
      };
      if (password.trim()) {
        payload.password = password;
      }
      updateStaffMutation.mutate({ id: editingStaff.id, payload });
    } else {
      if (!password || password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
      addStaffMutation.mutate({
        full_name: fullName,
        email: email,
        password: password,
        phone: phone || null,
        role: role
      });
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchSearch = 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeStaffCount = staffList.filter(s => s.is_active).length;
  const maxStaffAllowed = tenant?.max_staff || 10;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-brand-400" />
            Staff & RBAC Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your resort team members, departmental roles, and access credentials
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          disabled={staffList.length >= maxStaffAllowed}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/25"
        >
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* KPI Cards / Quota */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div className="text-2xl font-bold text-white mt-1">{staffList.length}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Registered employees</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Status</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{activeStaffCount}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Granted system login</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan License Limit</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{staffList.length} / {maxStaffAllowed}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">
              {maxStaffAllowed - staffList.length} seats available
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Roles</option>
            {Object.keys(ROLE_CONFIG).map((rk) => (
              <option key={rk} value={rk}>
                {ROLE_CONFIG[rk].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Assigned Role</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-6">Login Access</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading staff directory...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No staff members found matching criteria
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => {
                  const roleMeta = ROLE_CONFIG[user.role] || {
                    label: user.role,
                    color: 'bg-slate-700/50 text-slate-300 border-slate-600',
                    desc: ''
                  };

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm shadow">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{user.full_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-xs line-clamp-1">
                          {roleMeta.desc}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {user.phone || 'Not provided'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5 border border-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                          Edit / Access
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingStaff ? 'Edit Staff Credentials' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingStaff ? 'Update employee details and permission level' : 'Grant role-based access to your resort portal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStaff(null);
                  resetForm();
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              {!editingStaff ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@resort.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {editingStaff ? 'Reset Password (optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingStaff ? 'Leave blank to retain' : 'Min 6 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Role & Responsibilities *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {Object.keys(ROLE_CONFIG).map((rk) => (
                    <option key={rk} value={rk}>
                      {ROLE_CONFIG[rk].label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {ROLE_CONFIG[role]?.desc}
                </p>
              </div>

              {editingStaff && (
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-950 border-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-200">
                      Active Account (Allow login to system)
                    </span>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStaff(null);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStaffMutation.isPending || updateStaffMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/25"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffPage;
