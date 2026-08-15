import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface LeaseRecord {
  id: string
  clientId: string
  clientName: string | null
  accountRepId: string | null
  accountRepName: string | null
  leaseName: string
  county: string | null
  state: string | null
  gpsLat: number | null
  gpsLng: number | null
  directions: string | null
  isActive: boolean
  createdAt: string
}

export interface LeasePayload {
  clientId: string
  leaseName: string
  county?: string
  state?: string
  gpsLat?: number | null
  gpsLng?: number | null
  directions?: string
  isActive: boolean
}

export const leasesApi = {
  list:   (params?: object) => api.get<ApiResponse<PageResponse<LeaseRecord>>>('/api/v1/leases', { params }),
  get:    (id: string)      => api.get<ApiResponse<LeaseRecord>>(`/api/v1/leases/${id}`),
  create: (data: LeasePayload) => api.post<ApiResponse<LeaseRecord>>('/api/v1/leases', data),
  update: (id: string, data: LeasePayload) => api.put<ApiResponse<LeaseRecord>>(`/api/v1/leases/${id}`, data),
  delete: (id: string)      => api.delete<ApiResponse<void>>(`/api/v1/leases/${id}`),
}
