import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface DashboardStats {
  // ADMIN + MANAGER
  totalClients: number
  activeClients: number
  totalWells: number
  totalTanks: number
  scheduledVisitsToday: number
  activeVisitsToday: number
  completedVisitsToday: number
  activeRoutesToday: number
  completedRoutesToday: number
  labPending: number
  labCompleted: number
  pendingApprovals: number
  criticalLabResults: number
  // ALL ROLES
  tankCritical: number
  tankWarning: number
  tankHealthy: number
  soarFlagsUnacknowledged: number
  // LAB_TECH only
  samplesReceived: number
  samplesInProgress: number
  samplesCompletedToday: number
  samplesOverdue: number
  // ACCOUNT_REP only
  myClients: number
  myActiveClients: number
  myWells: number
  myTankCritical: number
  myTankWarning: number
  myTankHealthy: number
  myLabPending: number
  mySoarFlags: number
}

export const dashboardApi = {
  get: () => api.get<ApiResponse<DashboardStats>>('/api/v1/dashboard'),
}
