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
  logoUrl?: string
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

  checkSubdomain: (value: string) =>
    api.get<ApiResponse<{ available: boolean }>>('/api/v1/tenant/check-subdomain', { params: { value } }),

  impersonate: (id: string) =>
    api.post<ApiResponse<ImpersonateResponse>>(`/api/v1/sa/tenants/${id}/impersonate`),

  uploadTenantLogo: (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<ApiResponse<{ url: string }>>(`/api/v1/sa/tenants/${id}/logo`, fd)
  },
}
