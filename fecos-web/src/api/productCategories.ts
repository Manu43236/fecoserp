import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface ProductCategoryRecord {
  id: string
  name: string
  sortOrder: number
  isSystem: boolean
  isActive: boolean
}

export const productCategoriesApi = {
  list:   ()             => api.get<ApiResponse<ProductCategoryRecord[]>>('/api/v1/masters/product-categories'),
  create: (name: string) => api.post<ApiResponse<ProductCategoryRecord>>('/api/v1/masters/product-categories', { name }),
  toggle: (id: string)   => api.patch<ApiResponse<ProductCategoryRecord>>(`/api/v1/masters/product-categories/${id}/toggle`),
  delete: (id: string)   => api.delete<ApiResponse<void>>(`/api/v1/masters/product-categories/${id}`),
}
