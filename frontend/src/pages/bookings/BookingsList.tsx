import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  CheckCircle2,
  LogOut,
  MessageCircle,
  FileText,
  XCircle,
  Clock,
  Phone,
  User,
  BedDouble,
  DollarSign
} from 'lucide-react';
import api from '../../api/client';
import { Booking, BookingStatus } from '../../types';

interface BookingsListProps {
  onNewBookingClick?: () => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({ onNewBookingClick }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [checkInModalBooking, setCheckInModalBooking] = useState<Booking | null>(null);
  const [checkOutModalBooking, setCheckOutModalBooking] = useState<Booking | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', selectedStatus, searchTerm],
    queryFn: async () => {
      let url = '/bookings/?';
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      const res = await api.get(url);
      return res.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ bookingId, idNumber }: { bookingId: number; idNumber: string }) => {
      return (await api.post(`/bookings/${bookingId}/check-in`, { id_number: idNumber })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setCheckInModalBooking(null);
      setIdNumber('');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async ({ bookingId, paymentMethod }: { bookingId: number; paymentMethod: string }) => {
      return (await api.post(`/bookings/${bookingId}/check-out`, { payment_method: paymentMethod })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setCheckOutModalBooking(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return (await api.post(`/bookings/${bookingId}/cancel`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const handleWhatsApp = async (bookingId: number) => {
    try {
      const res = await api.get(`/whatsapp/booking-link/${bookingId}`);
      window.open(res.data.whatsapp_url, '_blank');
    } catch {
      alert('Could not generate WhatsApp link');
    }
  };

  const handleDownloadInvoice = async (bookingId: number) => {
    try {
      const folioRes = await api.get(`/folios/booking/${bookingId}`);
      const folioId = folioRes.data.id;
      const res = await api.get(`/folios/${folioId}/invoice-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${folioRes.data.folio_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Could not download invoice');
    }
  };

  const statuses = [
    { label: 'All', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Checked In', value: 'CHECKED_IN' },
    { label: 'Checked Out', value: 'CHECKED_OUT' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Reservations Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage guest check-ins, folios, WhatsApp messages, and checkout settlements
          </p>
        </div>
        {onNewBookingClick && (
          <button
            onClick={onNewBookingClick}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all"
          >
            + New Reservation
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setSelectedStatus(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === s.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking #, guest, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reservations...</div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No reservations found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Booking / Ref</th>
                  <th className="px-6 py-3.5">Guest Details</th>
                  <th className="px-6 py-3.5">Stay Dates</th>
                  <th className="px-6 py-3.5">Rooms</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{b.booking_number}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{b.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.guest_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.guest_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{b.check_in_date}</div>
                      <div className="text-[11px] text-slate-400">to {b.check_out_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      {b.rooms.map((r) => (
                        <span
                          key={r.id}
                          className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-bold mr-1 mb-1 border border-slate-200"
                        >
                          Room {r.room_number}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'CHECKED_IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : b.status === 'CHECKED_OUT'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">₹{b.final_amount.toLocaleString()}</div>
                      <div className="text-[10px]">
                        {b.balance_amount > 0 ? (
                          <span className="text-rose-600 font-semibold">Due: ₹{b.balance_amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Paid in Full</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Check-In Button */}
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setCheckInModalBooking(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm"
                            title="Check-In Guest"
                          >
                            Check-In
                          </button>
                        )}

                        {/* Check-Out Button */}
                        {b.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => setCheckOutModalBooking(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm"
                            title="Check-Out & Settle Folio"
                          >
                            Check-Out
                          </button>
                        )}

                        {/* WhatsApp Button */}
                        <button
                          onClick={() => handleWhatsApp(b.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200/60"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Download Invoice PDF */}
                        <button
                          onClick={() => handleDownloadInvoice(b.id)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                          title="Download Invoice PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Cancel Button */}
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this reservation?')) {
                                cancelMutation.mutate(b.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      {checkInModalBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Check-In: {checkInModalBooking.guest_name}</h3>
            <p className="text-xs text-slate-500">Record guest ID proof details before handing over room keys.</p>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">ID Proof Number (Aadhaar / Passport):</label>
              <input
                type="text"
                placeholder="e.g. 5432-8765-1092"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCheckInModalBooking(null)}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => checkInMutation.mutate({ bookingId: checkInModalBooking.id, idNumber })}
                disabled={checkInMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                {checkInMutation.isPending ? 'Checking In...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Settlement Modal */}
      {checkOutModalBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Check-Out & Final Folio Settlement</h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Guest:</span>
                <span className="font-bold text-slate-900">{checkOutModalBooking.guest_name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Balance Due:</span>
                <span className="font-bold text-rose-600">₹{checkOutModalBooking.balance_amount.toLocaleString()}</span>
              </div>
            </div>

            {checkOutModalBooking.balance_amount > 0 && (
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">Settlement Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash at Desk</option>
                  <option value="NETBANKING">Online Bank Transfer</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => checkOutMutation.mutate({ bookingId: checkOutModalBooking.id, paymentMethod })}
                disabled={checkOutMutation.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                {checkOutMutation.isPending ? 'Settling...' : 'Complete Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
