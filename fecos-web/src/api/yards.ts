import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface YardRecord {
  id: string
  name: string
  location: string | null
  isActive: boolean
  createdAt: string
}

export interface YardPayload {
  name: string
  location?: string
  isActive?: boolean
}

export const yardsApi = {
  list:       (params?: { search?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<YardRecord>>>('/api/v1/yards', { params }),
  listActive: () => api.get<ApiResponse<YardRecord[]>>('/api/v1/yards/active'),
  get:        (id: string) => api.get<ApiResponse<YardRecord>>(`/api/v1/yards/${id}`),
  create:     (data: YardPayload) => api.post<ApiResponse<YardRecord>>('/api/v1/yards', data),
  update:     (id: string, data: YardPayload) => api.put<ApiResponse<YardRecord>>(`/api/v1/yards/${id}`, data),
  delete:     (id: string) => api.delete<ApiResponse<void>>(`/api/v1/yards/${id}`),
}
