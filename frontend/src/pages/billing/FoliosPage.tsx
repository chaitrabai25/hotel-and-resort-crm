import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, FileText, Plus, DollarSign, Download, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Booking } from '../../types';

export const FoliosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Charge state
  const [chargeCategory, setChargeCategory] = useState<'ROOM' | 'RESTAURANT' | 'LAUNDRY' | 'SPA' | 'TRANSPORT' | 'MINIBAR' | 'MISC'>('LAUNDRY');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState(500);

  // Payment state
  const [payAmount, setPayAmount] = useState(1000);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'NETBANKING'>('UPI');
  const [payRef, setPayRef] = useState('');

  // Fetch all bookings with folios
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['bookings-for-folios'],
    queryFn: async () => (await api.get('/bookings/')).data,
  });

  const activeBookingId = selectedBookingId || bookings?.[0]?.id;

  // Fetch Folio Detail
  const { data: folio, isLoading: isFolioLoading } = useQuery({
    queryKey: ['folio-detail', activeBookingId],
    queryFn: async () => {
      if (!activeBookingId) return null;
      return (await api.get(`/folios/booking/${activeBookingId}`)).data;
    },
    enabled: !!activeBookingId,
  });

  // Add Charge Mutation
  const addChargeMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post(`/folios/${folio.id}/items`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio-detail', activeBookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsAddChargeOpen(false);
      setChargeDesc('');
    }
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post(`/folios/${folio.id}/payments`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio-detail', activeBookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsPaymentOpen(false);
      setPayRef('');
    }
  });

  const handleDownloadPdf = async () => {
    if (!folio) return;
    try {
      const res = await api.get(`/folios/${folio.id}/invoice-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${folio.folio_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span>Billing, Folios & Tax Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified billing records for room tariffs, restaurant bills, laundry, spa, and tax calculation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bookings & Folios selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Guest Accounts / Reservations
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {bookings?.map((b) => {
              const isSelected = activeBookingId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{b.guest_name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{b.booking_number}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Rooms: {b.rooms.map((r) => r.room_number).join(', ')}</span>
                    <span className="font-bold text-slate-900">₹{b.final_amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      b.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {b.status}
                    </span>
                    <span className={b.balance_amount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {b.balance_amount > 0 ? `Due: ₹${b.balance_amount}` : 'Settled'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Folio Itemized Statement */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {!folio ? (
            <div className="p-12 text-center text-xs text-slate-400">Select a reservation to view folio</div>
          ) : (
            <>
              {/* Folio Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    Guest Master Folio #{folio.folio_number}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{folio.guest_name}</h2>
                  <p className="text-xs text-slate-500">Booking Ref: {folio.booking_number} · Phone: {folio.guest_phone || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddChargeOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Service Charge</span>
                  </button>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Itemized Tariff & Services
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 text-right">Tax (GST)</th>
                        <th className="px-4 py-2.5 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {folio.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="px-4 py-2.5 font-bold text-brand-700">{it.category}</td>
                          <td className="px-4 py-2.5">{it.description}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">₹{it.tax_amount.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">₹{it.total_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payments & Advances Received
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Receipt #</th>
                        <th className="px-4 py-2.5">Method</th>
                        <th className="px-4 py-2.5">Reference / Notes</th>
                        <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {folio.payments?.map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{p.payment_number}</td>
                          <td className="px-4 py-2.5">{p.payment_method}</td>
                          <td className="px-4 py-2.5 text-slate-400">{p.transaction_reference || p.notes || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Folio Summary Totals */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Charges:</span>
                  <span>₹{folio.total_charges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Taxes (GST):</span>
                  <span>₹{folio.total_tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Discount:</span>
                  <span>- ₹{folio.total_discount.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Net Invoice Amount:</span>
                  <span>₹{folio.net_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Total Paid:</span>
                  <span>₹{folio.total_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-amber-400 pt-1 border-t border-slate-800">
                  <span>Balance Due:</span>
                  <span>₹{folio.balance_due.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Charge Modal */}
      {isAddChargeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Post Extra Service Charge</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service Category</label>
                <select
                  value={chargeCategory}
                  onChange={(e: any) => setChargeCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="LAUNDRY">Laundry Service</option>
                  <option value="SPA">Spa & Ayurveda</option>
                  <option value="TRANSPORT">Airport / Cab Transport</option>
                  <option value="MINIBAR">Minibar Consumption</option>
                  <option value="MISC">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Dry Cleaning 4 Items"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Charge Amount (₹) *</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddChargeOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!chargeDesc) return alert('Description required');
                  addChargeMutation.mutate({
                    category: chargeCategory,
                    description: chargeDesc,
                    unit_price: chargeAmount,
                    quantity: 1,
                    tax_percent: 12.0
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Post Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Record Payment Receipt</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="UPI">UPI / Google Pay</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="NETBANKING">Online Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/291823/Axis"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsPaymentOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  recordPaymentMutation.mutate({
                    amount: payAmount,
                    payment_method: payMethod,
                    transaction_reference: payRef
                  });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
