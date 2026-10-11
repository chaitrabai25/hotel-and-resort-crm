import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Wrench, CheckCircle2, Clock, Plus, AlertTriangle, BedDouble } from 'lucide-react';
import api from '../../api/client';
import { HousekeepingTask, MaintenanceTicket, Room } from '../../types';

export const HousekeepingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'MAINTENANCE'>('TASKS');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // Maintenance form state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('AC_HVAC');
  const [ticketPriority, setTicketPriority] = useState('NORMAL');
  const [ticketRoomId, setTicketRoomId] = useState<number | null>(null);

  // Fetch Housekeeping Tasks
  const { data: tasks } = useQuery<HousekeepingTask[]>({
    queryKey: ['housekeeping-tasks'],
    queryFn: async () => (await api.get('/housekeeping/tasks')).data,
    refetchInterval: 15000,
  });

  // Fetch Maintenance Tickets
  const { data: tickets } = useQuery<MaintenanceTicket[]>({
    queryKey: ['maintenance-tickets'],
    queryFn: async () => (await api.get('/housekeeping/maintenance')).data,
  });

  // Fetch Rooms for ticket room selector
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms-simple'],
    queryFn: async () => (await api.get('/rooms/')).data,
  });

  const propertyId = rooms?.[0]?.property_id || 1;

  // Task Update Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return (await api.put(`/housekeeping/tasks/${taskId}`, { status })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tape-chart-matrix'] });
    }
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/housekeeping/maintenance', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-inventory'] });
      setIsNewTicketOpen(false);
      setTicketTitle('');
    }
  });

  // Resolve Ticket Mutation
  const resolveTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return (await api.put(`/housekeeping/maintenance/${ticketId}`, { status: 'RESOLVED' })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-inventory'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span>Housekeeping & Facility Maintenance Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time room cleanliness statuses, supervisor inspections, and maintenance work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'TASKS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Room Cleaning Tasks
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'MAINTENANCE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Maintenance Work Orders
          </button>
          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
          >
            + Report Issue
          </button>
        </div>
      </div>

      {activeTab === 'TASKS' ? (
        /* Tasks List */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tasks?.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-slate-900">Room {t.room_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'COMPLETED' || t.status === 'INSPECTED' ? 'bg-emerald-100 text-emerald-800' :
                  t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {t.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Task: <span className="font-bold text-slate-800">{t.task_type}</span></div>
                <div>Priority: <span className="font-bold text-slate-800">{t.priority}</span></div>
                {t.notes && <div className="text-[11px] p-2 bg-slate-50 rounded-lg text-slate-600">{t.notes}</div>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {t.status === 'PENDING' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: t.id, status: 'IN_PROGRESS' })}
                    className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Start Cleaning
                  </button>
                )}
                {t.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: t.id, status: 'COMPLETED' })}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Mark Cleaned
                  </button>
                )}
                {t.status === 'COMPLETED' && (
                  <button
                    onClick={() => updateTaskMutation.mutate({ taskId: t.id, status: 'INSPECTED' })}
                    className="w-full py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                  >
                    Supervisor Inspect & Pass
                  </button>
                )}
                {t.status === 'INSPECTED' && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mx-auto">
                    <CheckCircle2 className="w-4 h-4" /> Passed & Available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Maintenance Tickets Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets?.map((tk) => (
            <div key={tk.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                  {tk.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tk.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {tk.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{tk.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{tk.description || 'No extra notes provided.'}</p>
                {tk.room_number && (
                  <p className="text-xs font-semibold text-brand-700 mt-1">Affected: Room {tk.room_number}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Priority: {tk.priority}</span>
                {tk.status !== 'RESOLVED' && (
                  <button
                    onClick={() => resolveTicketMutation.mutate(tk.id)}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Maintenance Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Report Maintenance Ticket</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issue Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Geyser water not heating"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  >
                    <option value="AC_HVAC">AC / HVAC</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="CARPENTRY">Carpentry</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Room (Optional)</label>
                  <select
                    value={ticketRoomId || ''}
                    onChange={(e) => setTicketRoomId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none"
                  >
                    <option value="">Campus Wide</option>
                    {rooms?.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.room_number}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsNewTicketOpen(false)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!ticketTitle) return alert('Title required');
                  createTicketMutation.mutate({
                    property_id: propertyId,
                    room_id: ticketRoomId || undefined,
                    title: ticketTitle,
                    category: ticketCategory,
                    priority: ticketPriority
                  });
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
              >
                Create Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
