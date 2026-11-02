import { useNavigate } from 'react-router-dom'
import {
  Building2, Drill, Cylinder, CalendarDays, Truck, TestTube,
  ClipboardList, Package, MapPin, Wrench, Car, BarChart3,
  CheckCircle2, Users, Settings2, Briefcase, ShieldCheck,
} from 'lucide-react'

const MODULES = [
  { label: 'Clients',    desc: 'Operators & accounts',   icon: Building2,    path: '/clients'       },
  { label: 'Leases',     desc: 'Field lease management',  icon: MapPin,       path: '/leases'        },
  { label: 'Wells',      desc: 'Well sites & activity',   icon: Drill,        path: '/wells'         },
  { label: 'Tanks',      desc: 'Real-time tank levels',   icon: Cylinder,     path: '/tanks'         },
  { label: 'Schedule',   desc: 'Service visit calendar',  icon: CalendarDays, path: '/schedule'      },
  { label: 'Routes',     desc: 'Dispatch & deliveries',   icon: Truck,        path: '/routes'        },
  { label: 'Programs',   desc: 'Treatment plans',         icon: ClipboardList, path: '/plans'        },
  { label: 'Lab',        desc: 'Water & sample analysis', icon: TestTube,     path: '/lab/queue'     },
  { label: 'QC',         desc: 'Quality control checks',  icon: ShieldCheck,  path: '/qc'            },
  { label: 'Approvals',  desc: 'Lab result sign-offs',    icon: CheckCircle2, path: '/rep/approvals' },
  { label: 'Portfolio',  desc: 'Client portfolio view',   icon: Briefcase,    path: '/rep/portfolio' },
  { label: 'Pump Shop',  desc: 'Pump management',         icon: Wrench,       path: '/pump-shop'     },
  { label: 'Inventory',  desc: 'Products & stock',        icon: Package,      path: '/inventory'     },
  { label: 'Vehicles',   desc: 'Fleet management',        icon: Car,          path: '/vehicles'      },
  { label: 'Users',      desc: 'Team & access control',   icon: Users,        path: '/users'         },
  { label: 'Reports',    desc: 'Analytics & exports',     icon: BarChart3,    path: '/reports'       },
  { label: 'Masters',    desc: 'System configuration',    icon: Settings2,    path: '/masters'       },
] as const

export function ModuleNavigator() {
  const navigate = useNavigate()
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
        FECOS Platform — All Modules
      </p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
        {MODULES.map(({ label, desc, icon: Icon, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="group bg-white border border-gray-100 rounded-2xl p-4 text-left
              hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col gap-2.5"
            style={{ ['--hover-bg' as string]: 'var(--color-primary)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, white)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'
                const svg = e.currentTarget.querySelector('svg')
                if (svg) svg.style.color = '#fff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 10%, white)'
                const svg = e.currentTarget.querySelector('svg')
                if (svg) svg.style.color = 'var(--color-primary)'
              }}>
              <Icon size={16} style={{ color: 'var(--color-primary)', transition: 'color 0.2s' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{label}</p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
