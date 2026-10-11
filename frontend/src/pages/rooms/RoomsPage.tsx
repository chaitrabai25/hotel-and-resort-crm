import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Plus, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import api from '../../api/client';
import { Room, RoomType, RoomStatus } from '../../types';

export const RoomsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);

  // Add room form state
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [wing, setWing] = useState('Main Wing');
  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);

  // Add room type form state
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [basePrice, setBasePrice] = useState(5000);
  const [maxAdults, setMaxAdults] = useState(2);

  // Fetch Rooms
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ['rooms-inventory', selectedType],
    queryFn: async () => {
      let url = '/rooms/?';
      if (selectedType) url += `type_id=${selectedType}`;
      return (await api.get(url)).data;
    },
  });

  // Fetch Room Types
  const { data: roomTypes } = useQuery<RoomType[]>({
    queryKey: ['room-types'],
    queryFn: async () => (await api.get('/rooms/types')).data,
  });

  const propertyId = rooms?.[0]?.property_id || 1;

  // Add Room Mutation
  const addRoomMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/rooms/', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setIsAddRoomOpen(false);
      setRoomNumber('');
    },
    onError: (err: any) => alert(err.response?.data?.detail || 'Failed to add room')
  });

  // Add Room Type Mutation
  const addRoomTypeMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/rooms/types', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      setIsAddTypeOpen(false);
      setTypeName('');
      setTypeCode('');
    },
    onError: (err: any) => alert(err.response?.data?.detail || 'Failed to add category')
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: number; status: RoomStatus }) => {
      return (await api.put(`/rooms/${roomId}/status`, { status })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    }
  });

  const statusOptions: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-brand-600" />
            <span>Room & Physical Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure room types, rate plans, physical room numbers, and live cleanliness statuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddTypeOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            + Add Room Category
          </button>
          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm shadow-brand-600/30"
          >
            + Add Physical Room
          </button>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm text-xs">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            selectedType === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Categories ({rooms?.length || 0})
        </button>
        {roomTypes?.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedType(rt.id)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedType === rt.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {rt.name} (₹{rt.base_price}/nt)
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms?.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">Room {r.room_number}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                r.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                r.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                r.status === 'CLEANING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {r.status}
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-semibold text-slate-800">{r.room_type_name}</div>
              <div>{r.floor || 'Ground'} · {r.wing || 'Main Wing'}</div>
              <div className="text-brand-700 font-bold">₹{r.base_price?.toLocaleString()} / night</div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Change Room Status:
              </label>
              <select
                value={r.status}
                onChange={(e) => updateStatusMutation.mutate({ roomId: r.id, status: e.target.value as RoomStatus })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs text-slate-700 focus:outline-none"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Physical Room</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Room Number / Villa Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 104 or Villa 5"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Room Category *</label>
                <select
                  value={roomTypeId || ''}
                  onChange={(e) => setRoomTypeId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="">-- Choose Category --</option>
                  {roomTypes?.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name} (₹{rt.base_price})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Floor</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Wing</label>
                  <input
                    type="text"
                    value={wing}
                    onChange={(e) => setWing(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddRoomOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!roomNumber || !roomTypeId) return alert('Fill room number & category');
                  addRoomMutation.mutate({
                    property_id: propertyId,
                    room_number: roomNumber,
                    room_type_id: roomTypeId,
                    floor,
                    wing
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Add Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Category Modal */}
      {isAddTypeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Room Category</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Presidential Suite"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="RPS"
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Base Rate (₹/nt)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddTypeOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!typeName) return alert('Name required');
                  addRoomTypeMutation.mutate({
                    property_id: propertyId,
                    name: typeName,
                    code: typeCode || typeName.slice(0, 3).toUpperCase(),
                    base_price: basePrice,
                    max_adults: maxAdults
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
