import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Award, Phone, Mail, MapPin, Plus, Star } from 'lucide-react';
import api from '../../api/client';
import { Guest } from '../../types';

export const GuestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);

  // New guest state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [vipTier, setVipTier] = useState<'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM'>('STANDARD');
  const [dietary, setDietary] = useState('');

  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ['guests', searchTerm],
    queryFn: async () => {
      let url = '/guests/?';
      if (searchTerm) url += `search=${searchTerm}`;
      return (await api.get(url)).data;
    },
  });

  const addGuestMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/guests/', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      setIsAddGuestOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
    },
    onError: (err: any) => alert(err.response?.data?.detail || 'Failed to save guest')
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <span>Guest Directory & VIP Loyalty CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, stay history, lifetime spend, dietary preferences, and VIP tiers
          </p>
        </div>
        <button
          onClick={() => setIsAddGuestOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm shadow-brand-600/30"
        >
          + Add New Guest Profile
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by guest name, phone, email, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Guests Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests?.map((g) => (
          <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                g.vip_tier === 'PLATINUM' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                g.vip_tier === 'GOLD' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                g.vip_tier === 'SILVER' ? 'bg-slate-100 text-slate-800' :
                'bg-slate-50 text-slate-600'
              }`}>
                <Award className="w-3 h-3" />
                <span>{g.vip_tier} VIP</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">{g.total_stays} Stays</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{g.full_name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{g.phone}</span>
              </div>
              {g.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{g.email}</span>
                </div>
              )}
              {g.city && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{g.city}, {g.country}</span>
                </div>
              )}
            </div>

            {g.dietary_preferences && (
              <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-800">Dietary:</span> {g.dietary_preferences}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Lifetime Spend:</span>
              <span className="font-bold text-slate-900">₹{g.total_spend.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {isAddGuestOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">New Guest Profile</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="+91 98450 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">VIP Tier</label>
                  <select
                    value={vipTier}
                    onChange={(e: any) => setVipTier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none font-bold"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dietary / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Jain Veg, prefers extra pillows"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddGuestOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!fullName || !phone) return alert('Name & Phone required');
                  addGuestMutation.mutate({
                    full_name: fullName,
                    phone,
                    email: email || undefined,
                    city: city || undefined,
                    vip_tier: vipTier,
                    dietary_preferences: dietary || undefined
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
