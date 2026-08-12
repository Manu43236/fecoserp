import api from '@/lib/axios'
import type { ApiResponse, User, TenantConfig } from '@/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  id: string
  fullName: string
  email: string
  role: string
  tenantId: string | null
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data),

  me: () =>
    api.get<ApiResponse<LoginResponse>>('/api/v1/auth/me'),

  tenantConfig: (subdomain: string) =>
    api.get<ApiResponse<TenantConfig>>(`/api/v1/tenant/config`),
}
