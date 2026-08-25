import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface DashboardStats {
  totalClients: number
  activeVisitsToday: number
  completedVisitsToday: number
  activeRoutesToday: number
  completedRoutesToday: number
  labPending: number
  labCompleted: number
  soarFlagsUnacknowledged: number
  totalWells: number
  totalTanks: number
}

export const dashboardApi = {
  get: () => api.get<ApiResponse<DashboardStats>>('/api/v1/dashboard'),
}
