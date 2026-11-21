import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface AuthUser {
  id: string
  fullName: string
  mobileNumber: string
  email?: string | null
  role: Role            // primary role (highest precedence) — for nav/home/display
  roles?: Role[]        // all held roles — for permission checks
  tenantId?: string | null
  tenantName?: string | null
  primaryColor?: string | null
  darkColor?: string | null
  accentColor?: string | null
}

interface SaSession {
  token: string
  user: AuthUser
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  saSession: SaSession | null
  isImpersonated: boolean

  login: (user: AuthUser, token: string) => void
  logout: () => void
  impersonate: (user: AuthUser, token: string) => void
  exitImpersonation: () => void
  setImpersonated: () => void
}

const DEFAULT_PRIMARY = '#1E3A5F'
const DEFAULT_DARK    = '#0F2137'
const DEFAULT_ACCENT  = '#CBD5E1'

/** True if the user holds any of the given roles. Falls back to the single primary role. */
export function hasAnyRole(
  user: { roles?: Role[]; role?: Role } | null | undefined,
  ...roles: Role[]
): boolean {
  if (!user) return false
  const held = user.roles?.length ? user.roles : (user.role ? [user.role] : [])
  return roles.some(r => held.includes(r))
}

export function applyTenantTheme(user: AuthUser | null) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', user?.primaryColor ?? DEFAULT_PRIMARY)
  root.style.setProperty('--color-dark',    user?.darkColor    ?? DEFAULT_DARK)
  root.style.setProperty('--color-accent',  user?.accentColor  ?? DEFAULT_ACCENT)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      saSession: null,
      isImpersonated: false,

      login: (user, token) => {
        localStorage.setItem('fecos_token', token)
        applyTenantTheme(user)
        set({ user, token, isAuthenticated: true, saSession: null, isImpersonated: false })
      },

      logout: () => {
        localStorage.removeItem('fecos_token')
        applyTenantTheme(null)
        set({ user: null, token: null, isAuthenticated: false, saSession: null, isImpersonated: false })
      },

      setImpersonated: () => set({ isImpersonated: true }),

      impersonate: (user, token) => {
        const { user: currentUser, token: currentToken } = get()
        localStorage.setItem('fecos_token', token)
        applyTenantTheme(user)
        set({
          user,
          token,
          isAuthenticated: true,
          saSession: { token: currentToken!, user: currentUser! },
        })
      },

      exitImpersonation: () => {
        const { saSession } = get()
        if (!saSession) return
        localStorage.setItem('fecos_token', saSession.token)
        applyTenantTheme(saSession.user)
        set({
          user: saSession.user,
          token: saSession.token,
          isAuthenticated: true,
          saSession: null,
        })
      },
    }),
    { name: 'fecos_auth' },
  ),
)
