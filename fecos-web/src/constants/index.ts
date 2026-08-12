export const APP_NAME = 'FECOS ERP'

export const TOKEN_KEY = 'fecos_token'
export const AUTH_KEY  = 'fecos_auth'

export const ROLES = {
  SUPER_ADMIN:  'SUPER_ADMIN',
  ADMIN:        'ADMIN',
  MANAGER:      'MANAGER',
  LAB_TECH:     'LAB_TECH',
  ACCOUNT_REP:  'ACCOUNT_REP',
  TRUCK_DRIVER: 'TRUCK_DRIVER',
  SERVICE_TECH: 'SERVICE_TECH',
} as const

export const WEB_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LAB_TECH', 'ACCOUNT_REP'] as const

export const STATUS_LABELS: Record<string, string> = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  SKIPPED:     'Skipped',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
  SUBMITTED:   'Submitted',
  DRAFT:       'Draft',
  CRITICAL:    'Critical',
  OFF_TARGET:  'Off-Target',
  PASS:        'Pass',
  FAIL:        'Fail',
  ACTIVE:      'Active',
  INACTIVE:    'Inactive',
}

export const QUERY_KEYS = {
  ME:           ['me'],
  TENANTS:      ['tenants'],
  USERS:        ['users'],
  CLIENTS:      ['clients'],
  LEASES:       ['leases'],
  DELIVERIES:   ['deliveries'],
  ROUTES:       ['routes'],
  LAB_SAMPLES:  ['lab', 'samples'],
  LAB_RESULTS:  ['lab', 'results'],
  DASHBOARD:    ['dashboard'],
  INVENTORY:    ['inventory'],
  PUMP_SHOP:    ['pump-shop'],
  NOTIFICATIONS:['notifications'],
} as const
