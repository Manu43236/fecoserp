import api from '@/lib/axios'
import type { ApiResponse, Tenant } from '@/types'

export interface CreateTenantPayload {
  companyName: string
  subdomain: string
  ownerName?: string
  contactPhone?: string
  contactEmail?: string
  primaryColor?: string
  darkColor?: string
  accentColor?: string
  plan?: string
  adminFullName: string
  adminMobileNumber: string
  adminPin: string
}

export interface ImpersonateResponse {
  token: string
  id: string
  fullName: string
  email: string | null
  role: string
  tenantId: string
  tenantName: string
}

export const saApi = {
  listTenants: () =>
    api.get<ApiResponse<Tenant[]>>('/api/v1/sa/tenants'),

  createTenant: (data: CreateTenantPayload) =>
    api.post<ApiResponse<Tenant>>('/api/v1/sa/tenants', data),

  updateTenant: (id: string, data: CreateTenantPayload) =>
    api.put<ApiResponse<Tenant>>(`/api/v1/sa/tenants/${id}`, data),

  deleteTenant: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/v1/sa/tenants/${id}`),

  impersonate: (id: string) =>
    api.post<ApiResponse<ImpersonateResponse>>(`/api/v1/sa/tenants/${id}/impersonate`),
}
