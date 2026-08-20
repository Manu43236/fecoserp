import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type FinishedProductStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'

export interface FinishedProductBatch {
  id: string
  batchNumber: string
  productId: string
  productName: string | null
  quantity: number
  unit: string
  blendDate: string
  status: FinishedProductStatus
  appearance: string | null
  colorOk: boolean | null
  odor: string | null
  ph: number | null
  specificGravity: number | null
  notes: string | null
  testedByName: string | null
  testedAt: string | null
  warehouseId: string | null
  warehouseName: string | null
  movedToWarehouse: boolean
  movedAt: string | null
  createdAt: string
}

export interface FinishedProductBatchPayload {
  productId: string
  quantity: number
  unit: string
  blendDate: string
}

export interface FinishedProductResultPayload {
  appearance?: string
  colorOk?: boolean
  odor?: string
  ph?: number
  specificGravity?: number
  notes?: string
  result: 'PASSED' | 'FAILED'
}

export const finishedQcApi = {
  list:            (params?: object) => api.get<ApiResponse<PageResponse<FinishedProductBatch>>>('/api/v1/finished-qc', { params }),
  get:             (id: string)      => api.get<ApiResponse<FinishedProductBatch>>(`/api/v1/finished-qc/${id}`),
  create:          (data: FinishedProductBatchPayload) => api.post<ApiResponse<FinishedProductBatch>>('/api/v1/finished-qc', data),
  startTesting:    (id: string)      => api.put<ApiResponse<FinishedProductBatch>>(`/api/v1/finished-qc/${id}/start`, {}),
  enterResults:    (id: string, data: FinishedProductResultPayload) => api.put<ApiResponse<FinishedProductBatch>>(`/api/v1/finished-qc/${id}/results`, data),
  moveToWarehouse: (id: string, warehouseId: string) => api.put<ApiResponse<FinishedProductBatch>>(`/api/v1/finished-qc/${id}/move-to-warehouse`, { warehouseId }),
}
