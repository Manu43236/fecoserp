import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface CoverageNode {
  id: string
  name: string
  clientId: string | null
  clientName: string | null
  leaseId: string | null
  leaseName: string | null
}

export interface CoverageData {
  clients: CoverageNode[]   // whole-client coverage
  leases: CoverageNode[]    // whole-lease coverage
  wells: CoverageNode[]     // individual wells
}

export interface CoverageSelection {
  clientIds: string[]
  leaseIds: string[]
  wellIds: string[]
}

export interface ClientTree {
  clientId: string
  clientName: string
  leases: { id: string; name: string; wells: { id: string; name: string }[] }[]
}

export const coverageApi = {
  get:        (repId: string) => api.get<ApiResponse<CoverageData>>(`/api/v1/coverage/${repId}`),
  set:        (repId: string, sel: CoverageSelection) => api.put<ApiResponse<void>>(`/api/v1/coverage/${repId}`, sel),
  clientTree: (clientId: string) => api.get<ApiResponse<ClientTree>>(`/api/v1/coverage/client/${clientId}/tree`),
}
