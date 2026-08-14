import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface WarehouseRecord {
  id: string
  name: string
  location: string | null
  isActive: boolean
  createdAt: string
}

export interface WarehousePayload {
  name: string
  location?: string
  isActive: boolean
}

export const warehousesApi = {
  list:       (params?: object)                    => api.get<ApiResponse<PageResponse<WarehouseRecord>>>('/api/v1/inventory/warehouses', { params }),
  listActive: ()                                   => api.get<ApiResponse<WarehouseRecord[]>>('/api/v1/inventory/warehouses/active'),
  get:        (id: string)                         => api.get<ApiResponse<WarehouseRecord>>(`/api/v1/inventory/warehouses/${id}`),
  create:     (data: WarehousePayload)             => api.post<ApiResponse<WarehouseRecord>>('/api/v1/inventory/warehouses', data),
  update:     (id: string, data: WarehousePayload) => api.put<ApiResponse<WarehouseRecord>>(`/api/v1/inventory/warehouses/${id}`, data),
  delete:     (id: string)                         => api.delete<ApiResponse<void>>(`/api/v1/inventory/warehouses/${id}`),
}
