import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { FlaskConical, Truck, ClipboardList, BarChart3, Users, Beaker } from 'lucide-react'
import fecosLogo from '@/assets/fecos_logo.png'
import { useAuthStore, applyTenantTheme } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { roleHomeMap, webRoles } from '@/lib/roleRoutes'
import type { Role } from '@/types'

const DEFAULT_COLORS = { primaryColor: '#1E3A5F', darkColor: '#0F2137', accentColor: '#CBD5E1' }

const SLIDES = [
  {
    icon: Truck,
    title: 'Field Delivery Tracking',
    desc: 'Track chemical deliveries in real time. GPS check-in, signature, and photo proof on every stop.',
  },
  {
    icon: FlaskConical,
    title: 'Lab & QC Management',
    desc: 'Manage sample queues, enter test results, and run raw material QC — all paperless.',
  },
  {
    icon: ClipboardList,
    title: 'Service Visit Reports',
    desc: 'Capture field service data, equipment readings, and treatment records from the field.',
  },
  {
    icon: Beaker,
    title: 'Chemical Inventory',
    desc: 'Monitor tank levels, batch records, and product formulations across all locations.',
  },
  {
    icon: Users,
    title: 'Client Portfolio',
    desc: 'Manage well sites, contacts, and service history for every oilfield client.',
  },
  {
    icon: BarChart3,
    title: 'Operations Dashboard',
    desc: 'Live insights on deliveries, service visits, and chemical usage at a glance.',
  },
]

function FeatureCarousel() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const paused = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused.current) advance()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  function advance(idx?: number) {
    setVisible(false)
    setTimeout(() => {
      setCurrent(idx !== undefined ? idx : (prev) => (prev + 1) % SLIDES.length)
      setVisible(true)
    }, 250)
  }

  const slide = SLIDES[current]
  const Icon = slide.icon

  return (
    <div
      className="flex flex-col items-center text-center"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      <div
        className="transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
          <Icon size={36} className="text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-white text-2xl font-bold mb-3 leading-tight">{slide.title}</h2>
        <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#E5D4CF' }}>
          {slide.desc}
        </p>
      </div>

      <div className="flex gap-2 mt-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => advance(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const schema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').regex(/^\d+$/, 'Digits only'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [colors] = useState(DEFAULT_COLORS)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  useEffect(() => {
    applyTenantTheme(null) // reset to FECOS defaults; subdomain theming handled in prod only
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const payload = res.data.data
      const role = payload.role as Role

      if (!webRoles.includes(role)) {
        toast.error('This account is for the mobile app only.')
        return
      }

      login(
        {
          id: payload.id,
          fullName: payload.fullName,
          mobileNumber: data.mobileNumber,
          email: payload.email,
          role,
          tenantId: payload.tenantId,
          tenantName: payload.tenantName,
          primaryColor: payload.primaryColor,
          darkColor: payload.darkColor,
          accentColor: payload.accentColor,
        },
        payload.token,
      )
      navigate(roleHomeMap[role])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: `linear-gradient(to right, ${colors.primaryColor}, ${colors.darkColor})` }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col bg-transparent">
        <div className="flex-1 flex items-center justify-center px-12">
          <div className="flex flex-col items-center gap-10 w-full">
            <img src={fecosLogo} alt="FECOS" className="w-56 object-contain" />
            <FeatureCarousel />
          </div>
        </div>
        <p className="text-center text-xs pb-8" style={{ color: 'rgba(229,212,207,0.4)' }}>
          © {new Date().getFullYear()} FECOS. Powered by M&M Technologies.
        </p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[48%] flex items-center justify-center bg-transparent p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={fecosLogo} alt="FECOS" className="h-12 w-auto object-contain mx-auto" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-400 text-sm mt-1">Sign in to your FECOS account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
              {/* Mobile number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 h-11 rounded-md border border-gray-200 bg-gray-50 text-sm font-semibold select-none" style={{ color: colors.primaryColor }}>
                    +1
                  </span>
                  <input
                    {...register('mobileNumber')}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit number"
                    autoComplete="off"
                    className={`flex-1 h-11 px-3 text-sm rounded-md border outline-none transition focus:ring-2 focus:ring-red-100 ${errors.mobileNumber ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-red-500 text-xs">{errors.mobileNumber.message}</p>
                )}
              </div>

              {/* PIN — visible */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">PIN</label>
                <input
                  {...register('pin')}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter your PIN"
                  autoComplete="off"
                  className={`w-full h-11 px-3 text-sm rounded-md border outline-none transition tracking-widest focus:ring-2 focus:ring-red-100 ${errors.pin ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.pin && (
                  <p className="text-red-500 text-xs">{errors.pin.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: colors.primaryColor }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
