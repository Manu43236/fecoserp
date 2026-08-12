// API response envelope — matches Spring Boot ApiResponse
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'LAB_TECH'
  | 'ACCOUNT_REP'
  | 'TRUCK_DRIVER'
  | 'SERVICE_TECH'

export interface User {
  id: string
  fullName: string
  mobileNumber: string
  email?: string
  role: Role
  tenantId?: string   // null for SUPER_ADMIN
  isActive: boolean
}

export interface TenantConfig {
  companyName: string
  subdomain: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor: string
  darkColor: string
  accentColor: string
}

export interface AuthTokens {
  token: string
  expiresAt: string
}

export interface Tenant {
  id: string
  companyName: string
  subdomain: string
  ownerName: string | null
  contactPhone: string | null
  contactEmail: string | null
  primaryColor: string | null
  darkColor: string | null
  accentColor: string | null
  logoUrl: string | null
  plan: string
  active: boolean
  createdAt: string
}
