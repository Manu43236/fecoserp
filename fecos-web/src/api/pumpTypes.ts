import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface PumpTypeRecord {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  isActive: boolean
}

export const pumpTypesApi = {
  list:   ()          => api.get<ApiResponse<PumpTypeRecord[]>>('/api/v1/masters/pump-types'),
  create: (name: string) => api.post<ApiResponse<PumpTypeRecord>>('/api/v1/masters/pump-types', { name }),
  toggle: (id: string)   => api.patch<ApiResponse<PumpTypeRecord>>(`/api/v1/masters/pump-types/${id}/toggle`),
  delete: (id: string)   => api.delete<ApiResponse<void>>(`/api/v1/masters/pump-types/${id}`),
}
