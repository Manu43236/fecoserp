import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useTenantStore } from '@/store/tenantStore'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

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
import InventoryPage from '@/pages/tenant/InventoryPage'
import PlansPage from '@/pages/tenant/PlansPage'
import RoutesPage from '@/pages/tenant/RoutesPage'
import LabPage from '@/pages/tenant/LabPage'
import ApprovalsPage from '@/pages/tenant/ApprovalsPage'
import PortfolioPage from '@/pages/tenant/PortfolioPage'
import TanksPage from '@/pages/tenant/TanksPage'
import QCPage from '@/pages/tenant/QCPage'
import PumpShopPage from '@/pages/tenant/PumpShopPage'
import VehiclesPage from '@/pages/tenant/VehiclesPage'
import ServiceVisitsPage from '@/pages/tenant/ServiceVisitsPage'
import DashboardPage from '@/pages/tenant/DashboardPage'
import ReportsPage from '@/pages/tenant/ReportsPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function getPortal(): 'console' | 'tenant' {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return 'console'
  return host.split('.')[0] === 'console' ? 'console' : 'tenant'
}

function ConsoleRoutes() {
  return (
    <Routes>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function TenantValidator({ children }: { children: React.ReactNode }) {
  const applyTheme = useTenantStore(s => s.applyTheme)

  const { isLoading, isError } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: async () => {
      const res = await authApi.tenantConfig()
      applyTheme(res.data.data!)
      return res.data.data
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <p className="text-2xl font-bold text-gray-800">Workspace not found</p>
        <p className="text-sm text-gray-500">
          <strong>{window.location.hostname}</strong> is not a registered workspace.
        </p>
        <a href="https://console.fecoserp.com" className="mt-2 text-sm text-blue-600 hover:underline">
          Go to FECOS Console
        </a>
      </div>
    )
  }

  return <>{children}</>
}

function ImpersonatePage() {
  const login = useAuthStore(s => s.login)
  const setImpersonated = useAuthStore(s => s.setImpersonated)
  const navigate = useNavigate()

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { navigate('/login', { replace: true }); return }
    localStorage.setItem('fecos_token', token)
    authApi.me().then(res => {
      const d = res.data.data!
      login({
        id: d.id,
        fullName: d.fullName,
        mobileNumber: '',
        email: d.email,
        role: d.role as Role,
        tenantId: d.tenantId,
        tenantName: d.tenantName,
        primaryColor: d.primaryColor,
        darkColor: d.darkColor,
        accentColor: d.accentColor,
      }, token)
      setImpersonated()
      navigate('/dashboard', { replace: true })
    }).catch(() => {
      localStorage.removeItem('fecos_token')
      navigate('/login', { replace: true })
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
    </div>
  )
}

function TenantRoutes() {
  return (
    <TenantValidator>
      <Routes>
        <Route path="/auth/impersonate" element={<ImpersonatePage />} />
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/clients"          element={<ClientsPage />} />
            <Route path="/leases"           element={<LeasesPage />} />
            <Route path="/wells"            element={<WellsPage />} />
            <Route path="/pump-shop"        element={<PumpShopPage />} />
            <Route path="/reports"          element={<ReportsPage />} />
            <Route path="/lab/queue"        element={<LabPage />} />
            <Route path="/lab/results"      element={<LabPage />} />
            <Route path="/qc"               element={<QCPage />} />
            <Route path="/lab/raw-qc"       element={<Navigate to="/qc" replace />} />
            <Route path="/lab/prod-qc"      element={<Navigate to="/qc" replace />} />
            <Route path="/routes"           element={<RoutesPage />} />
            <Route path="/schedule"         element={<ServiceVisitsPage />} />
            <Route path="/inventory"        element={<InventoryPage />} />
            <Route path="/plans"            element={<PlansPage />} />
            <Route path="/tanks"            element={<TanksPage />} />
            <Route path="/vehicles"         element={<VehiclesPage />} />
            <Route path="/users"            element={<UsersPage />} />
            <Route path="/masters"          element={<MastersPage />} />
            <Route path="/rep/portfolio"    element={<PortfolioPage />} />
            <Route path="/rep/approvals"    element={<ApprovalsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TenantValidator>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        {getPortal() === 'console' ? <ConsoleRoutes /> : <TenantRoutes />}
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
