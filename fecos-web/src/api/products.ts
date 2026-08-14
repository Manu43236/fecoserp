import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface ProductRecord {
  id: string
  name: string
  productCode: string | null
  category: string
  unit: string
  description: string | null
  pricePerUnit: number | null
  isActive: boolean
  createdAt: string
}

export interface ProductPayload {
  name: string
  productCode?: string
  category: string
  unit: string
  description?: string
  pricePerUnit?: number | null
  isActive: boolean
}

export const productsApi = {
  list:   (params?: object) => api.get<ApiResponse<PageResponse<ProductRecord>>>('/api/v1/products', { params }),
  get:    (id: string)      => api.get<ApiResponse<ProductRecord>>(`/api/v1/products/${id}`),
  create: (data: ProductPayload)             => api.post<ApiResponse<ProductRecord>>('/api/v1/products', data),
  update: (id: string, data: ProductPayload) => api.put<ApiResponse<ProductRecord>>(`/api/v1/products/${id}`, data),
  delete: (id: string)                       => api.delete<ApiResponse<void>>(`/api/v1/products/${id}`),
}
