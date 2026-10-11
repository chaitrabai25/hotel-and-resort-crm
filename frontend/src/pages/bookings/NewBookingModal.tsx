import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, User, BedDouble, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Property, Room, RoomType } from '../../types';
import { format, addDays } from 'date-fns';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCity, setGuestCity] = useState('');

  const [checkInDate, setCheckInDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [selectedRooms, setSelectedRooms] = useState<Array<{ roomId: number; roomTypeId: number; rate: number }>>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [advanceMethod, setAdvanceMethod] = useState('UPI');
  const [specialRequests, setSpecialRequests] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Properties & Rooms
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/properties/')).data,
    enabled: isOpen,
  });

  const propertyId = properties?.[0]?.id;

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms-all', propertyId],
    queryFn: async () => (await api.get(`/rooms/?property_id=${propertyId}`)).data,
    enabled: !!propertyId && isOpen,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/bookings/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create booking');
    },
  });

  if (!isOpen) return null;

  // Calculate nights
  const d1 = new Date(checkInDate);
  const d2 = new Date(checkOutDate);
  const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

  const roomSubtotal = selectedRooms.reduce((acc, r) => acc + (r.rate * nights), 0);
  const taxAmount = Math.round(roomSubtotal * 0.12 * 100) / 100;
  const finalAmount = Math.max(0, roomSubtotal + taxAmount - discountAmount);
  const balanceDue = Math.max(0, finalAmount - advancePaid);

  const handleAddRoom = (r: Room) => {
    if (selectedRooms.find((item) => item.roomId === r.id)) return;
    setSelectedRooms([...selectedRooms, { roomId: r.id, roomTypeId: r.room_type_id, rate: r.base_price || 3000 }]);
  };

  const handleRemoveRoom = (roomId: number) => {
    setSelectedRooms(selectedRooms.filter((r) => r.roomId !== roomId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedRooms.length === 0) {
      setErrorMsg('Please select at least one room for this reservation.');
      return;
    }

    createBookingMutation.mutate({
      property_id: propertyId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail || undefined,
      guest_city: guestCity || undefined,
      source: 'DIRECT',
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      adults,
      children,
      rooms: selectedRooms.map((r) => ({
        room_id: r.roomId,
        room_type_id: r.roomTypeId,
        rate_per_night: r.rate,
      })),
      discount_amount: discountAmount,
      advance_paid: advancePaid,
      advance_payment_method: advanceMethod,
      special_requests: specialRequests || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Guest Reservation</h2>
            <p className="text-xs text-slate-500">Create booking, assign rooms, and generate folio</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Information */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>Guest Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98450 12345"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stay Dates & Occupancy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Check-In *</label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Check-Out *</label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Adults</label>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Children</label>
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-700 block">Select Rooms to Assign:</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {rooms?.map((r) => {
                const isSelected = selectedRooms.some((item) => item.roomId === r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleAddRoom(r)}
                    disabled={isSelected}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                    }`}
                  >
                    <span>Room {r.room_number}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({r.room_type_name})</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Rooms List */}
            {selectedRooms.length > 0 && (
              <div className="space-y-1 pt-1">
                {selectedRooms.map((sr) => {
                  const roomObj = rooms?.find((r) => r.id === sr.roomId);
                  return (
                    <div key={sr.roomId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">
                        Room {roomObj?.room_number} — {roomObj?.room_type_name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">₹{sr.rate} / night</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(sr.roomId)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing & Advance Deposit Summary */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tariff ({nights} Nights × {selectedRooms.length} Rooms):</span>
              <span>₹{roomSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST / Taxes (12%):</span>
              <span>₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg p-1 text-right text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Advance Deposit (₹):</span>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg p-1 text-right text-emerald-400 font-bold focus:outline-none"
              />
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
              <span>Final Total Amount:</span>
              <span className="text-emerald-400">₹{finalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-amber-400 font-semibold">
              <span>Balance at Check-In:</span>
              <span>₹{balanceDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBookingMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {createBookingMutation.isPending ? 'Confirming...' : 'Confirm & Create Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
