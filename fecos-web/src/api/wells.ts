import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface WellRecord {
  id: string
  leaseId: string
  leaseName: string | null
  clientName: string | null
  wellName: string
  wellNumber: string | null
  apiNumber: string | null
  pumpType: string
  isActive: boolean
  createdAt: string
}

export interface WellPayload {
  leaseId: string
  wellName: string
  wellNumber?: string
  apiNumber?: string
  pumpType: string
  isActive: boolean
}

export const wellsApi = {
  list:   (params?: object) => api.get<ApiResponse<PageResponse<WellRecord>>>('/api/v1/wells', { params }),
  get:    (id: string)      => api.get<ApiResponse<WellRecord>>(`/api/v1/wells/${id}`),
  create: (data: WellPayload)  => api.post<ApiResponse<WellRecord>>('/api/v1/wells', data),
  update: (id: string, data: WellPayload) => api.put<ApiResponse<WellRecord>>(`/api/v1/wells/${id}`, data),
  delete: (id: string)      => api.delete<ApiResponse<void>>(`/api/v1/wells/${id}`),
}
