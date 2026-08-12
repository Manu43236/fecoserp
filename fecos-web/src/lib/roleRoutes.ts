import type { Role } from '@/types'

export const roleHomeMap: Record<Role, string> = {
  SUPER_ADMIN:   '/sa/dashboard',
  ADMIN:         '/dashboard',
  MANAGER:       '/dashboard',
  LAB_TECH:      '/lab/queue',
  ACCOUNT_REP:   '/rep/portfolio',
  TRUCK_DRIVER:  '/login',   // mobile only — redirect away
  SERVICE_TECH:  '/login',   // mobile only — redirect away
}

export const webRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LAB_TECH', 'ACCOUNT_REP']
