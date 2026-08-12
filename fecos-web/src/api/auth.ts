import api from '@/lib/axios'
import type { ApiResponse, User, AuthTokens } from '@/types'

interface LoginRequest {
  mobileNumber: string
  pin: string
  tenantId?: string
}

interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data),

  me: () =>
    api.get<ApiResponse<User>>('/api/v1/auth/me'),

  tenantConfig: (subdomain: string) =>
    api.get<ApiResponse<import('@/types').TenantConfig>>(`/api/v1/tenants/config/${subdomain}`),
}
