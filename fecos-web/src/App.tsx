import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthGuard, SuperAdminGuard, GuestGuard } from '@/layouts/AuthGuard'
import { AppLayout } from '@/layouts/AppLayout'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PlaceholderPage } from '@/pages/shared/PlaceholderPage'
import { TenantsPage } from '@/pages/super-admin/TenantsPage'
import { SAUsersPage } from '@/pages/super-admin/SAUsersPage'
import { UsersPage } from '@/pages/tenant/UsersPage'
import { ClientsPage } from '@/pages/tenant/ClientsPage'
import { LeasesPage } from '@/pages/tenant/LeasesPage'
import { WellsPage } from '@/pages/tenant/WellsPage'
import MastersPage from '@/pages/tenant/MastersPage'
import ProductsPage from '@/pages/tenant/ProductsPage'
import InventoryPage from '@/pages/tenant/InventoryPage'
import PlansPage from '@/pages/tenant/PlansPage'
import RoutesPage from '@/pages/tenant/RoutesPage'
import LabPage from '@/pages/tenant/LabPage'
import ApprovalsPage from '@/pages/tenant/ApprovalsPage'
import TanksPage from '@/pages/tenant/TanksPage'
import QCPage from '@/pages/tenant/QCPage'
import PumpShopPage from '@/pages/tenant/PumpShopPage'

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
                <Route path="/sa/tenants"       element={<TenantsPage />} />
                <Route path="/sa/subscriptions" element={<PlaceholderPage title="Subscriptions" />} />
                <Route path="/sa/users"         element={<SAUsersPage />} />
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
              <Route path="/clients"          element={<ClientsPage />} />
              <Route path="/leases"           element={<LeasesPage />} />
              <Route path="/wells"            element={<WellsPage />} />
              <Route path="/pump-shop"        element={<PumpShopPage />} />
              <Route path="/reports"          element={<PlaceholderPage title="Reports" />} />

              {/* Lab */}
              <Route path="/lab/queue"        element={<LabPage />} />
              <Route path="/lab/results"      element={<LabPage />} />
              <Route path="/qc"               element={<QCPage />} />
              <Route path="/lab/raw-qc"       element={<Navigate to="/qc" replace />} />
              <Route path="/lab/prod-qc"      element={<Navigate to="/qc" replace />} />

              {/* Admin/Dispatcher */}
              <Route path="/routes"           element={<RoutesPage />} />
              <Route path="/schedule"         element={<PlaceholderPage title="Schedule" />} />
              <Route path="/inventory"        element={<InventoryPage />} />
              <Route path="/plans"             element={<PlansPage />} />
              <Route path="/tanks"            element={<TanksPage />} />
              <Route path="/users"            element={<UsersPage />} />
              <Route path="/masters"          element={<MastersPage />} />
              <Route path="/products"         element={<ProductsPage />} />

              {/* Account Rep */}
              <Route path="/rep/portfolio"    element={<PlaceholderPage title="Portfolio" />} />
              <Route path="/rep/approvals"    element={<ApprovalsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
