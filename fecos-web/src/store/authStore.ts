import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface AuthUser {
  id: string
  fullName: string
  mobileNumber: string
  email?: string | null
  role: Role
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

  login: (user: AuthUser, token: string) => void
  logout: () => void
  impersonate: (user: AuthUser, token: string) => void
  exitImpersonation: () => void
}

const DEFAULT_PRIMARY = '#1E3A5F'
const DEFAULT_DARK    = '#0F2137'
const DEFAULT_ACCENT  = '#CBD5E1'

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

      login: (user, token) => {
        localStorage.setItem('fecos_token', token)
        applyTenantTheme(user)
        set({ user, token, isAuthenticated: true, saSession: null })
      },

      logout: () => {
        localStorage.removeItem('fecos_token')
        applyTenantTheme(null)
        set({ user: null, token: null, isAuthenticated: false, saSession: null })
      },

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
