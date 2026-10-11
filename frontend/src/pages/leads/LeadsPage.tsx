import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, Download, Phone, Mail, Calendar, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { Lead, Quotation } from '../../types';

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead state
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadType, setLeadType] = useState('WEDDING');
  const [guestCount, setGuestCount] = useState(100);
  const [budget, setBudget] = useState(500000);

  // Quotation state
  const [quotePackageTitle, setQuotePackageTitle] = useState('Royal Destination Wedding 3-Day Package');
  const [quoteSubtotal, setQuoteSubtotal] = useState(450000);
  const [quoteTax, setQuoteTax] = useState(54000);
  const [quoteTotal, setQuoteTotal] = useState(504000);

  // Fetch Leads
  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => (await api.get('/leads/')).data,
  });

  // Fetch Quotations
  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => (await api.get('/leads/quotations')).data,
  });

  // Create Lead Mutation
  const addLeadMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/leads/', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsAddLeadOpen(false);
      setGuestName('');
      setPhone('');
    }
  });

  // Create Quotation Mutation
  const addQuoteMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/leads/quotations', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsAddQuoteOpen(false);
      alert('Quotation generated successfully!');
    }
  });

  const handleDownloadQuotePdf = async (quoteId: number, quoteNumber: string) => {
    try {
      const res = await api.get(`/leads/quotations/${quoteId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Proposal-${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Could not download proposal');
    }
  };

  const columns = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-600" />
            <span>Banquets, Weddings & Group Inquiries CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Event leads pipeline, corporate retreat proposals, and luxury quotation PDF generator
          </p>
        </div>
        <button
          onClick={() => setIsAddLeadOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm shadow-brand-600/30"
        >
          + New Inquiry Lead
        </button>
      </div>

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colLeads = leads?.filter((l) => l.status === col);
          return (
            <div key={col} className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-700">
                  {col}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {colLeads?.length || 0}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {colLeads?.map((l) => (
                  <div key={l.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {l.lead_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">{l.guest_count} Pax</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900">{l.guest_name}</h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{l.phone}</span>
                    </div>

                    {l.estimated_budget && (
                      <div className="text-[11px] font-bold text-slate-800">
                        Budget: ₹{l.estimated_budget.toLocaleString()}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedLead(l);
                          setIsAddQuoteOpen(true);
                        }}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Send Quote</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Proposals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Generated Quotations & Proposals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">Quote Ref</th>
                <th className="px-4 py-2.5">Guest / Organizer</th>
                <th className="px-4 py-2.5">Package Title</th>
                <th className="px-4 py-2.5">Total Amount</th>
                <th className="px-4 py-2.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {quotations?.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 font-bold text-slate-900">{q.quotation_number}</td>
                  <td className="px-4 py-3">{q.guest_name} ({q.guest_phone})</td>
                  <td className="px-4 py-3 text-slate-800 font-semibold">{q.package_title}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">₹{q.total_amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownloadQuotePdf(q.id, q.quotation_number)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-600" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">New Event / Banquet Inquiry</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Karan Johar Celebrations"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="+91 98200 11223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Event Type</label>
                  <select
                    value={leadType}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  >
                    <option value="WEDDING">Destination Wedding</option>
                    <option value="BANQUET">Banquet Dinner</option>
                    <option value="CORPORATE_RETREAT">Corporate Offsite</option>
                    <option value="ROOM_STAY">Group Stay</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guest Pax</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddLeadOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!guestName || !phone) return alert('Name & Phone required');
                  addLeadMutation.mutate({
                    guest_name: guestName,
                    phone,
                    lead_type: leadType,
                    guest_count: guestCount,
                    estimated_budget: budget
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Quotation Proposal Modal */}
      {isAddQuoteOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Generate Luxury Proposal</h3>
            <p className="text-xs text-slate-500">For {selectedLead.guest_name} ({selectedLead.phone})</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Package Title</label>
                <input
                  type="text"
                  value={quotePackageTitle}
                  onChange={(e) => setQuotePackageTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subtotal (₹)</label>
                  <input
                    type="number"
                    value={quoteSubtotal}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setQuoteSubtotal(v);
                      setQuoteTax(Math.round(v * 0.12));
                      setQuoteTotal(v + Math.round(v * 0.12));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GST Tax (12%)</label>
                  <input
                    type="number"
                    readOnly
                    value={quoteTax}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Investment (₹)</label>
                <input
                  type="number"
                  readOnly
                  value={quoteTotal}
                  className="w-full bg-slate-900 text-emerald-400 font-bold rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddQuoteOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  addQuoteMutation.mutate({
                    lead_id: selectedLead.id,
                    guest_name: selectedLead.guest_name,
                    guest_phone: selectedLead.phone,
                    package_title: quotePackageTitle,
                    subtotal: quoteSubtotal,
                    tax_amount: quoteTax,
                    total_amount: quoteTotal
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Create & Save Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
