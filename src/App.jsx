import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicLayout } from './layouts/PublicLayout';
import { ClientDashboardLayout } from './layouts/ClientDashboardLayout';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { ClientBookPage } from './pages/ClientBookPage';
import { ClientAppointmentsPage } from './pages/ClientAppointmentsPage';
import { ClientProfilePage } from './pages/ClientProfilePage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminConsultationPage } from './pages/admin/AdminConsultationPage';
import { AdminRecordsPage } from './pages/admin/AdminRecordsPage';
import { AdminSystemLogsPage } from './pages/admin/AdminSystemLogsPage';
import { AdminCreateAdminPage } from './pages/admin/AdminCreateAdminPage';
import { AdminQueuePage } from './pages/admin/AdminQueuePage';

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public routes: header + Outlet */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Client dashboard: sidebar + header + Outlet */}
        <Route path="/app" element={<ClientDashboardLayout />}>
          <Route index element={<ClientDashboardPage />} />
          <Route path="book" element={<ClientBookPage />} />
          <Route path="appointments" element={<ClientAppointmentsPage />} />
          <Route path="profile" element={<ClientProfilePage />} />
        </Route>

        {/* Admin dashboard: sidebar + Outlet */}
        <Route path="/admin" element={<AdminDashboardLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
          <Route path="queues" element={<AdminQueuePage />} />
          <Route path="consultation" element={<AdminConsultationPage />} />
          <Route path="records" element={<AdminRecordsPage />} />
          <Route path="create-admin" element={<AdminCreateAdminPage />} />
          <Route path="logs" element={<AdminSystemLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
