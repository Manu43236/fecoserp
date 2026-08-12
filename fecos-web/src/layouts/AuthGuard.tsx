import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { webRoles } from '@/lib/roleRoutes'

export function AuthGuard() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Reject mobile-only roles on web
  if (user && !webRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function SuperAdminGuard() {
  const { user } = useAuthStore()
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function GuestGuard() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
