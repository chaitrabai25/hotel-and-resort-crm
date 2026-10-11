import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Building2, 
  CreditCard, 
  MessageSquare, 
  Save, 
  CheckCircle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  DollarSign,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { Tenant } from '../../types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Resort & Spa');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [taxIdGstin, setTaxIdGstin] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Fetch current tenant settings
  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenantSettings'],
    queryFn: async () => (await api.get('/settings/current')).data,
  });

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setBusinessType(tenant.business_type || 'Resort & Spa');
      setContactName(tenant.contact_name || '');
      setContactEmail(tenant.contact_email || '');
      setContactPhone(tenant.contact_phone || '');
      setAddress(tenant.address || '');
      setCity(tenant.city || '');
      setState(tenant.state || '');
      setCountry(tenant.country || 'India');
      setTaxIdGstin(tenant.tax_id_gstin || '');
      setCurrency(tenant.currency || 'INR');
      setCurrencySymbol(tenant.currency_symbol || '₹');
    }
  }, [tenant]);

  // Update tenant settings mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => (await api.put('/settings/current', payload)).data,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings'] });
      queryClient.invalidateQueries({ queryKey: ['currentTenantSettings'] });
      setSuccessMessage('Property settings saved and applied successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.detail || 'Failed to update settings.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    updateMutation.mutate({
      name,
      business_type: businessType,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address,
      city,
      state,
      country,
      tax_id_gstin: taxIdGstin,
      currency,
      currency_symbol: currencySymbol,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-brand-400" />
            Property & Organization Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your hotel branding, billing GSTIN, tax invoices, and automated communications
          </p>
        </div>

        {tenant?.plan_name && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Plan: {tenant.plan_name}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium shadow-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Resort / Hotel Identity</h2>
              <p className="text-xs text-slate-400">Printed on guest folios, invoices, and quotations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Property / Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Hospitality Category *
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Resort & Spa">Luxury Resort & Spa</option>
                <option value="Hotel & Suites">Business & Boutique Hotel</option>
                <option value="Holiday Villa">Private Holiday Villa / Homestay</option>
                <option value="Restaurant & Lounge">Restaurant, Café & Dining Bar</option>
                <option value="Hospitality Group">Multi-Property Hospitality Group</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Front Desk Telephone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campus / Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  State / Province
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Financial & Tax Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Taxation & Currency</h2>
              <p className="text-xs text-slate-400">Compliance details stamped onto official GST invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                GSTIN / Tax Registration No.
              </label>
              <input
                type="text"
                placeholder="e.g. 29AAAAA0000A1Z5"
                value={taxIdGstin}
                onChange={(e) => setTaxIdGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Currency Code
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Automation Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">WhatsApp Guest Communication</h2>
              <p className="text-xs text-slate-400">Instant reservation vouchers and payment balance reminders</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              Automated Dynamic WhatsApp Dispatcher Active
            </div>
            <p className="text-slate-400 leading-relaxed">
              When a reservation is created or confirmed, your reception team can dispatch a 1-click verified WhatsApp message voucher containing check-in dates, booking reference, folio balance, and resort location map links directly to the guest's mobile.
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px]">
              "🏨 *Reservation Confirmed — {name || 'GrandStay Resort'}* ... Dear [Guest], your booking [Ref#] is confirmed! Check-in: [Date]..."
            </div>
          </div>
        </div>

        {/* Section 4: Subscription Plan Overview */}
        {tenant && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Licensing & Quotas</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tenant.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Max Rooms</span>
                <span className="text-2xl font-bold text-white mt-1 block">{tenant.max_rooms}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Max Properties</span>
                <span className="text-2xl font-bold text-white mt-1 block">{tenant.max_properties}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Max Staff Users</span>
                <span className="text-2xl font-bold text-white mt-1 block">{tenant.max_staff}</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/25"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SettingsPage;
