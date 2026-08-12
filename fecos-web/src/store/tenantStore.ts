import { create } from 'zustand'
import type { TenantConfig } from '@/types'

interface TenantState {
  config: TenantConfig | null
  setConfig: (config: TenantConfig) => void
  applyTheme: (config: TenantConfig) => void
}

export const useTenantStore = create<TenantState>()((set) => ({
  config: null,
  setConfig: (config) => {
    set({ config })
  },
  applyTheme: (config) => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', config.primaryColor)
    root.style.setProperty('--color-dark', config.darkColor)
    root.style.setProperty('--color-accent', config.accentColor)
    if (config.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (link) link.href = config.faviconUrl
    }
    document.title = `${config.companyName} — FECOS ERP`
    set({ config })
  },
}))
