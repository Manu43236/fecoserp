import api from '@/lib/axios'
import type { ApiResponse, PageResponse } from '@/types'

export type RawMaterialStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'

export interface RawMaterialBatch {
  id: string
  batchNumber: string
  supplierName: string
  materialName: string
  quantity: number
  unit: string
  receivedDate: string
  supplierLotNumber: string | null
  status: RawMaterialStatus
  appearance: string | null
  colorOk: boolean | null
  odor: string | null
  ph: number | null
  specificGravity: number | null
  notes: string | null
  testedByName: string | null
  testedAt: string | null
  createdAt: string
}

export interface RawMaterialBatchPayload {
  supplierName: string
  materialName: string
  quantity: number
  unit: string
  receivedDate: string
  supplierLotNumber?: string
}

export interface RawMaterialResultPayload {
  appearance?: string
  colorOk?: boolean
  odor?: string
  ph?: number
  specificGravity?: number
  notes?: string
  result: 'PASSED' | 'FAILED'
}

export const rawQcApi = {
  list:         (params?: object) => api.get<ApiResponse<PageResponse<RawMaterialBatch>>>('/api/v1/raw-qc', { params }),
  get:          (id: string)      => api.get<ApiResponse<RawMaterialBatch>>(`/api/v1/raw-qc/${id}`),
  create:       (data: RawMaterialBatchPayload) => api.post<ApiResponse<RawMaterialBatch>>('/api/v1/raw-qc', data),
  startTesting: (id: string)      => api.put<ApiResponse<RawMaterialBatch>>(`/api/v1/raw-qc/${id}/start`, {}),
  enterResults: (id: string, data: RawMaterialResultPayload) => api.put<ApiResponse<RawMaterialBatch>>(`/api/v1/raw-qc/${id}/results`, data),
  delete:       (id: string)      => api.delete<ApiResponse<void>>(`/api/v1/raw-qc/${id}`),
}
