import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Monitor, Smartphone } from 'lucide-react'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

interface SignInLog {
  userId: string
  fullName: string
  mobileNumber: string
  tenantId: string
  tenantName: string
  platform: string
  signedInAt: string
}

const formatPhone = (n: string) =>
  n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : n

function PlatformBadge({ platform }: { platform: string }) {
  const isMobile = platform === 'MOBILE'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
      isMobile
        ? 'bg-violet-50 text-violet-700 ring-violet-200'
        : 'bg-blue-50 text-blue-700 ring-blue-200'
    }`}>
      {isMobile ? <Smartphone size={10} /> : <Monitor size={10} />}
      {isMobile ? 'Mobile' : 'Web'}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

export function SASignInLogsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sa-sign-in-logs'],
    queryFn: () => api.get<ApiResponse<SignInLog[]>>('/api/v1/sa/sign-in-logs', { params: { size: 200 } })
      .then(r => r.data.data),
  })

  const logs = data ?? []

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return !q
      || l.fullName.toLowerCase().includes(q)
      || l.mobileNumber.includes(q)
      || l.tenantName.toLowerCase().includes(q)
      || l.platform.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sign-In Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Every login across all tenants — newest first</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sign-Ins', value: logs.length, sub: 'all time' },
          { label: 'Web',    value: logs.filter(l => l.platform === 'WEB').length,    sub: 'from browser', color: 'text-blue-600'   },
          { label: 'Mobile', value: logs.filter(l => l.platform === 'MOBILE').length, sub: 'from app',     color: 'text-violet-600' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color ?? 'text-gray-900'}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, mobile, tenant…"
          className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div
          className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-3"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span className="text-xs font-semibold text-white uppercase tracking-wider">User</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Tenant</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Platform</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">When</span>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {search ? 'No matching entries' : 'No sign-ins recorded yet'}
            </div>
          ) : filtered.map((log, i) => (
            <div
              key={`${log.userId}-${log.signedInAt}-${i}`}
              className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-3 items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={log.fullName} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{log.fullName}</p>
                  <p className="text-xs text-gray-500">+1 {formatPhone(log.mobileNumber)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 font-medium truncate">{log.tenantName}</p>
              <PlatformBadge platform={log.platform} />
              <div>
                <p className="text-sm text-gray-800">{new Date(log.signedInAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">{new Date(log.signedInAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
