import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import fecosLogo from '@/assets/fecos_logo.png'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { roleHomeMap, webRoles } from '@/lib/roleRoutes'
import type { Role, User } from '@/types'

const schema = z.object({
  mobileNumber: z
    .string()
    .regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  pin: z
    .string()
    .min(4, 'PIN must be at least 4 digits')
    .regex(/^\d+$/, 'PIN must be digits only'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data)
      const payload = res.data.data
      const role = payload.role as Role

      if (!webRoles.includes(role)) {
        toast.error('This account is for the mobile app only.')
        return
      }

      const user: User = {
        id: payload.id,
        fullName: payload.fullName,
        mobileNumber: data.mobileNumber,
        email: payload.email ?? undefined,
        role,
        tenantId: payload.tenantId ?? undefined,
        isActive: true,
      }

      login(user, payload.token)
      navigate(roleHomeMap[role])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-content-bg)' }}
    >
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <img src={fecosLogo} alt="FECOS" className="h-12 mx-auto mb-3 object-contain" />
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Field Engineering Chemical Operations
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg border p-6 space-y-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Mobile number */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Mobile Number
            </label>
            <div className="flex gap-2">
              <span
                className="flex items-center px-3 rounded-md border text-sm font-medium select-none"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-content-bg)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                +1
              </span>
              <input
                {...register('mobileNumber')}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit number"
                className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition"
                style={{
                  borderColor: errors.mobileNumber ? '#ef4444' : 'var(--color-border)',
                  backgroundColor: 'var(--color-content-bg)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          {/* PIN — visible */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              PIN
            </label>
            <input
              {...register('pin')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 tracking-widest transition"
              style={{
                borderColor: errors.pin ? '#ef4444' : 'var(--color-border)',
                backgroundColor: 'var(--color-content-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
            {errors.pin && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                {errors.pin.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
