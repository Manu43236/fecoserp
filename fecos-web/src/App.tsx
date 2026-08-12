import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthGuard, SuperAdminGuard, GuestGuard } from '@/layouts/AuthGuard'
import { AppLayout } from '@/layouts/AppLayout'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PlaceholderPage } from '@/pages/shared/PlaceholderPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Super Admin */}
          <Route element={<AuthGuard />}>
            <Route element={<SuperAdminGuard />}>
              <Route element={<SuperAdminLayout />}>
                <Route path="/sa/dashboard"     element={<PlaceholderPage title="SA Dashboard" />} />
                <Route path="/sa/tenants"       element={<PlaceholderPage title="Tenants" />} />
                <Route path="/sa/subscriptions" element={<PlaceholderPage title="Subscriptions" />} />
                <Route path="/sa/users"         element={<PlaceholderPage title="Users" />} />
                <Route path="/sa/settings"      element={<PlaceholderPage title="Settings" />} />
              </Route>
            </Route>
          </Route>

          {/* Tenant roles */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"        element={<PlaceholderPage title="Dashboard" />} />

              {/* Manager */}
              <Route path="/field-activity"   element={<PlaceholderPage title="Field Activity" />} />
              <Route path="/deliveries"       element={<PlaceholderPage title="Deliveries" />} />
              <Route path="/clients"          element={<PlaceholderPage title="Clients" />} />
              <Route path="/pump-shop"        element={<PlaceholderPage title="Pump Shop" />} />
              <Route path="/reports"          element={<PlaceholderPage title="Reports" />} />

              {/* Lab */}
              <Route path="/lab/queue"        element={<PlaceholderPage title="Sample Queue" />} />
              <Route path="/lab/results"      element={<PlaceholderPage title="Enter Results" />} />
              <Route path="/lab/raw-qc"       element={<PlaceholderPage title="Raw Material QC" />} />
              <Route path="/lab/prod-qc"      element={<PlaceholderPage title="Finished Product QC" />} />

              {/* Admin/Dispatcher */}
              <Route path="/dispatch"         element={<PlaceholderPage title="Dispatch Board" />} />
              <Route path="/routes"           element={<PlaceholderPage title="Routes" />} />
              <Route path="/schedule"         element={<PlaceholderPage title="Schedule" />} />
              <Route path="/inventory"        element={<PlaceholderPage title="Inventory" />} />
              <Route path="/users"            element={<PlaceholderPage title="Users" />} />

              {/* Account Rep */}
              <Route path="/rep/portfolio"    element={<PlaceholderPage title="Portfolio" />} />
              <Route path="/rep/approvals"    element={<PlaceholderPage title="Approvals" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
