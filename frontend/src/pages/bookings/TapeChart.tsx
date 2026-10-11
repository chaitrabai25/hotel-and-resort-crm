import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  BedDouble,
  User,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { format, addDays, subDays } from 'date-fns';

export const TapeChart: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const formattedDate = format(startDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['tape-chart-matrix', formattedDate],
    queryFn: async () => {
      const res = await api.get(`/rooms/tape-chart?start_date=${formattedDate}&days=14`);
      return res.data;
    },
  });

  const handlePrev = () => setStartDate(subDays(startDate, 7));
  const handleNext = () => setStartDate(addDays(startDate, 7));
  const handleToday = () => setStartDate(new Date());

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const { timeline_dates, rooms } = data;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <span>Interactive Room Tape Chart</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time occupancy tape chart matrix across rooms and stay dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3">
              {format(startDate, 'dd MMM yyyy')}
            </span>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tape Chart Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header Timeline Dates */}
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold">
                <th className="p-3 text-left w-48 min-w-[12rem] sticky left-0 z-10 bg-slate-950 border-r border-slate-800">
                  Room / Category
                </th>
                {timeline_dates.map((dStr: string) => {
                  const dObj = new Date(dStr);
                  const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                  const isCurrentDay = format(new Date(), 'yyyy-MM-dd') === dStr;
                  return (
                    <th
                      key={dStr}
                      className={`p-2 text-center min-w-[4rem] border-r border-slate-800 ${
                        isCurrentDay ? 'bg-brand-600 text-white' : isWeekend ? 'bg-slate-800/80' : ''
                      }`}
                    >
                      <div className="text-[10px] uppercase font-semibold text-slate-300">
                        {format(dObj, 'EEE')}
                      </div>
                      <div className="text-xs font-bold">{format(dObj, 'dd MMM')}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Room Rows */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {rooms.map((r: any) => (
                <tr key={r.room_id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Room Label */}
                  <td className="p-3 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-brand-600" />
                        <span>Room {r.room_number}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        r.current_status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                        r.current_status === 'OCCUPIED' ? 'bg-blue-50 text-blue-700' :
                        r.current_status === 'CLEANING' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {r.current_status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {r.room_type} · ₹{r.base_price}/nt
                    </div>
                  </td>

                  {/* Calendar Matrix Cells */}
                  {timeline_dates.map((dStr: string) => {
                    // Check if this room has an overlapping booking on this date
                    const matchedBooking = r.bookings.find((b: any) => {
                      return dStr >= b.check_in_date && dStr < b.check_out_date;
                    });

                    const isCheckInDay = matchedBooking && dStr === matchedBooking.check_in_date;

                    return (
                      <td
                        key={dStr}
                        className="p-1 border-r border-slate-100 relative h-14 min-w-[4rem] text-center"
                      >
                        {matchedBooking ? (
                          <div
                            onClick={() => setSelectedBooking(matchedBooking)}
                            className={`h-full w-full rounded-lg cursor-pointer flex flex-col items-center justify-center p-1 text-[10px] font-bold shadow-sm transition-transform hover:scale-[1.03] ${
                              matchedBooking.status === 'CHECKED_IN'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            }`}
                          >
                            {isCheckInDay ? (
                              <div className="truncate w-full font-bold">
                                🏨 {matchedBooking.guest_name}
                              </div>
                            ) : (
                              <div className="text-[9px] opacity-80 truncate">
                                {matchedBooking.booking_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full w-full rounded hover:bg-slate-100/50 transition-colors flex items-center justify-center text-slate-300">
                            ·
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Booking Quick Drawer Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                  Reservation Detail
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedBooking.booking_number}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedBooking.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <User className="w-4 h-4 text-slate-400" />
                <span>Guest: {selectedBooking.guest_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Phone: {selectedBooking.guest_phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Stay: {selectedBooking.check_in_date} → {selectedBooking.check_out_date}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
                <div>
                  <span className="text-slate-400 text-[10px]">Paid Amount</span>
                  <p className="font-bold text-slate-900">₹{selectedBooking.paid_amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Balance Due</span>
                  <p className="font-bold text-rose-600">₹{selectedBooking.balance_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
