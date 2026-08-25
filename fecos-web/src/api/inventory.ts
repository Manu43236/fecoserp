import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type TransactionType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT'

export interface StockRecord {
  warehouseId: string
  warehouseName: string
  productId: string
  productName: string
  unit: string
  currentQty: number
}

export interface TransactionRecord {
  id: string
  warehouseId: string
  warehouseName: string
  productId: string
  productName: string
  type: TransactionType
  quantity: number
  unit: string
  notes: string | null
  supplierName: string | null
  transactionDate: string
  createdBy: string
  createdByName: string | null
  createdAt: string
  referenceType: string | null
  referenceId: string | null
}

export interface TransactionPayload {
  warehouseId: string
  productId: string
  type: TransactionType
  quantity: number
  unit: string
  notes?: string
  supplierName?: string
  transactionDate: string
}

export const inventoryApi = {
  stock:       (params?: object)              => api.get<ApiResponse<StockRecord[]>>('/api/v1/inventory/stock', { params }),
  transactions:(params?: object)              => api.get<ApiResponse<PageResponse<TransactionRecord>>>('/api/v1/inventory/transactions', { params }),
  record:      (data: TransactionPayload)     => api.post<ApiResponse<TransactionRecord>>('/api/v1/inventory/transactions', data),
}
