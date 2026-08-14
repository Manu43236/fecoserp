import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface ProductUnitRecord {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  isActive: boolean
}

export const productUnitsApi = {
  list:   ()             => api.get<ApiResponse<ProductUnitRecord[]>>('/api/v1/masters/product-units'),
  create: (name: string) => api.post<ApiResponse<ProductUnitRecord>>('/api/v1/masters/product-units', { name }),
  toggle: (id: string)   => api.patch<ApiResponse<ProductUnitRecord>>(`/api/v1/masters/product-units/${id}/toggle`),
  delete: (id: string)   => api.delete<ApiResponse<void>>(`/api/v1/masters/product-units/${id}`),
}
