import api from '@/lib/axios'
import type { ApiResponse, TenantConfig } from '@/types'

export interface LoginRequest {
  mobileNumber: string
  pin: string
}

export interface LoginResponse {
  token: string
  id: string
  fullName: string
  email: string | null
  role: string
  tenantId: string | null
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data),

  me: () =>
    api.get<ApiResponse<LoginResponse>>('/api/v1/auth/me'),

  tenantConfig: () =>
    api.get<ApiResponse<TenantConfig>>('/api/v1/tenant/config'),
}
