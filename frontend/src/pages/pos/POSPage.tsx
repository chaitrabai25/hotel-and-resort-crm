import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Send,
  Coffee,
  Sparkles,
  BedDouble
} from 'lucide-react';
import api from '../../api/client';
import { DiningTable, MenuCategory, MenuItem, Booking } from '../../types';

export const POSPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [orderItems, setOrderItems] = useState<Array<{ menuItem: MenuItem; quantity: number; notes: string }>>([]);
  const [transferToRoom, setTransferToRoom] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Fetch Tables
  const { data: tables } = useQuery<DiningTable[]>({
    queryKey: ['dining-tables'],
    queryFn: async () => (await api.get('/pos/tables')).data,
    refetchInterval: 15000,
  });

  // Fetch Categories
  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => (await api.get('/pos/categories')).data,
  });

  // Fetch Menu Items
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ['menu-items', selectedCategory],
    queryFn: async () => {
      let url = '/pos/menu?';
      if (selectedCategory) url += `category_id=${selectedCategory}`;
      return (await api.get(url)).data;
    },
  });

  // Fetch Active In-House Bookings (for Room Bill transfers)
  const { data: activeBookings } = useQuery<Booking[]>({
    queryKey: ['active-checkedin-bookings'],
    queryFn: async () => (await api.get('/bookings/?status=CHECKED_IN')).data,
  });

  const propertyId = tables?.[0]?.property_id || 1;

  // Add Item to Order Pad
  const handleAddItem = (item: MenuItem) => {
    const existingIndex = orderItems.findIndex((it) => it.menuItem.id === item.id);
    if (existingIndex > -1) {
      const copy = [...orderItems];
      copy[existingIndex].quantity += 1;
      setOrderItems(copy);
    } else {
      setOrderItems([...orderItems, { menuItem: item, quantity: 1, notes: '' }]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const copy = [...orderItems];
    copy[index].quantity += delta;
    if (copy[index].quantity <= 0) {
      copy.splice(index, 1);
    }
    setOrderItems(copy);
  };

  const subtotal = orderItems.reduce((acc, it) => acc + (it.menuItem.price * it.quantity), 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% F&B GST
  const grandTotal = Math.round(subtotal + tax);

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/pos/orders', payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dining-tables'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });

      // Automatically settle or transfer if chosen
      if (transferToRoom || paymentMethod) {
        api.post(`/pos/orders/${data.id}/settle`, {
          transfer_to_room: transferToRoom,
          payment_method: paymentMethod
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['dining-tables'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
        });
      }

      setOrderItems([]);
      setSelectedTable(null);
      setTransferToRoom(false);
      setSelectedBookingId(null);
      alert(`Order & KOT created successfully! (${data.order_number})`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to place order');
    }
  });

  const handlePlaceOrder = () => {
    if (orderItems.length === 0) {
      alert('Order pad is empty');
      return;
    }

    createOrderMutation.mutate({
      property_id: propertyId,
      table_id: selectedTable?.id,
      booking_id: transferToRoom ? selectedBookingId : undefined,
      order_type: transferToRoom ? 'ROOM_SERVICE' : 'DINE_IN',
      items: orderItems.map((it) => ({
        menu_item_id: it.menuItem.id,
        quantity: it.quantity,
        special_notes: it.notes || undefined
      }))
    });
  };

  const filteredTables = selectedArea === 'ALL'
    ? tables
    : tables?.filter((t) => t.area === selectedArea);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-brand-600" />
            <span>Restaurant & F&B Point of Sale (POS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Table management, digital menu ordering, KOT dispatch, and room bill folio transfers
          </p>
        </div>
      </div>

      {/* POS Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tables Grid & Menu Catalog */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Dining Tables Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Dining Table / Cabana:
              </h2>
              {/* Area filter tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'INDOOR', 'POOLSIDE', 'LAWN'].map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      selectedArea === area
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {filteredTables?.map((tbl) => {
                const isSelected = selectedTable?.id === tbl.id;
                return (
                  <button
                    key={tbl.id}
                    onClick={() => setSelectedTable(tbl)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20'
                        : tbl.status === 'OCCUPIED'
                        ? 'border-amber-300 bg-amber-50/40 text-amber-900'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-slate-900">{tbl.table_number}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{tbl.capacity} Pax · {tbl.area}</div>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      tbl.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tbl.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Menu Catalog */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Digital Menu Catalog
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Dishes
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
              {menuItems?.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-brand-400 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                    <div className="text-xs font-extrabold text-brand-700 mt-1">₹{item.price}</div>
                  </div>
                  <button
                    onClick={() => handleAddItem(item)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white transition-all shadow-sm group-hover:scale-105"
                    title="Add to order pad"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Pad / KOT & Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[700px]">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Current Order Pad</h2>
              <p className="text-[11px] text-slate-400">
                {selectedTable ? `Table: ${selectedTable.table_number}` : 'No table selected (Room / Takeaway)'}
              </p>
            </div>
            {orderItems.length > 0 && (
              <button onClick={() => setOrderItems([])} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">
                Clear
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <Coffee className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                <span>Order pad is empty</span>
                <span className="text-[10px] text-slate-400">Click dishes on the left to add items</span>
              </div>
            ) : (
              orderItems.map((it, idx) => (
                <div key={it.menuItem.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{it.menuItem.name}</span>
                    <span className="font-bold text-slate-900">₹{it.menuItem.price * it.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Cooking note (e.g. less spicy)..."
                      value={it.notes}
                      onChange={(e) => {
                        const copy = [...orderItems];
                        copy[idx].notes = e.target.value;
                        setOrderItems(copy);
                      }}
                      className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 w-40 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center">{it.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Calculation & Room Settlement Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Room Bill Transfer Option */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
              <label className="flex items-center gap-2 font-bold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transferToRoom}
                  onChange={(e) => setTransferToRoom(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-brand-600" />
                  <span>Transfer Bill to Room Folio (Checkout Pay)</span>
                </span>
              </label>

              {transferToRoom && (
                <div>
                  <label className="text-[10px] text-slate-600 block mb-1">Select Checked-In Guest / Room:</label>
                  <select
                    value={selectedBookingId || ''}
                    onChange={(e) => setSelectedBookingId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none"
                  >
                    <option value="">-- Choose Guest Room --</option>
                    {activeBookings?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.guest_name} — {b.rooms.map((r) => `Room ${r.room_number}`).join(', ')} ({b.booking_number})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!transferToRoom && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Payment Method:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Payment</option>
                </select>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-brand-600">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Order Action Buttons */}
            <button
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending || orderItems.length === 0}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{createOrderMutation.isPending ? 'Sending...' : 'Send KOT & Settle Order'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
