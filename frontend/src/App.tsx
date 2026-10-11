import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { TapeChart } from './pages/bookings/TapeChart';
import { BookingsList } from './pages/bookings/BookingsList';
import { NewBookingModal } from './pages/bookings/NewBookingModal';
import { RoomsPage } from './pages/rooms/RoomsPage';
import { POSPage } from './pages/pos/POSPage';
import { FoliosPage } from './pages/billing/FoliosPage';
import { GuestsPage } from './pages/guests/GuestsPage';
import { HousekeepingPage } from './pages/housekeeping/HousekeepingPage';
import { LeadsPage } from './pages/leads/LeadsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { Hotel, Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({
  children,
  requiredRoles,
}) => {
  const { user, token, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 animate-pulse">
          <Hotel className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          Loading GrandStay CRM...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  const handleOpenNewBooking = () => setIsNewBookingModalOpen(true);
  const handleCloseNewBooking = () => setIsNewBookingModalOpen(false);

  return (
    <>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin Dashboard Route */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Tenant Operational Routes wrapped in Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout onNewBookingClick={handleOpenNewBooking}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="/dashboard"
                    element={<Dashboard onNewBookingClick={handleOpenNewBooking} />}
                  />
                  <Route path="/tape-chart" element={<TapeChart />} />
                  <Route
                    path="/bookings"
                    element={<BookingsList onNewBookingClick={handleOpenNewBooking} />}
                  />
                  <Route path="/rooms" element={<RoomsPage />} />
                  <Route path="/pos" element={<POSPage />} />
                  <Route path="/billing" element={<FoliosPage />} />
                  <Route path="/guests" element={<GuestsPage />} />
                  <Route path="/housekeeping" element={<HousekeepingPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Global New Reservation Modal */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={handleCloseNewBooking}
      />
    </>
  );
};

export default App;
