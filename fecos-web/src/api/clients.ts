import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface ClientRecord {
  id: string
  companyName: string
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  billingAddress: string | null
  accountRepId: string | null
  accountRepName: string | null
  isActive: boolean
  createdAt: string
}

export interface ClientPayload {
  companyName: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  billingAddress?: string
  accountRepId?: string | null
  isActive?: boolean
}

export const clientsApi = {
  list: (params?: {
    search?: string
    accountRepId?: string
    isActive?: boolean
    page?: number
    size?: number
  }) => api.get<ApiResponse<PageResponse<ClientRecord>>>('/api/v1/clients', { params }),

  get: (id: string) =>
    api.get<ApiResponse<ClientRecord>>(`/api/v1/clients/${id}`),

  create: (data: ClientPayload) =>
    api.post<ApiResponse<ClientRecord>>('/api/v1/clients', data),

  update: (id: string, data: ClientPayload) =>
    api.put<ApiResponse<ClientRecord>>(`/api/v1/clients/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/v1/clients/${id}`),
}
