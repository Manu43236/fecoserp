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
  mobileNumber: z.string().regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').regex(/^\d+$/, 'Digits only'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

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
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-1/2 px-12"
        style={{ backgroundColor: '#3F0C00' }}
      >
        <img src={fecosLogo} alt="FECOS" className="w-56 object-contain mb-8" />
        <p className="text-center text-sm leading-relaxed" style={{ color: '#E5D4CF' }}>
          Field Engineering Chemical Operations Solution
        </p>
        <p className="mt-3 text-xs" style={{ color: '#9A6A5A' }}>
          Powered by Endura Products Corp
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 bg-white">
        {/* Logo for mobile screens */}
        <img
          src={fecosLogo}
          alt="FECOS"
          className="h-10 object-contain mb-8 lg:hidden"
        />

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#3F0C00' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#9A6A5A' }}>
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Mobile number */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F0C00' }}>
                Mobile Number
              </label>
              <div className="flex gap-2">
                <span
                  className="flex items-center px-3 rounded-lg border text-sm font-semibold select-none"
                  style={{ borderColor: '#D1C5C0', backgroundColor: '#F9F5F4', color: '#751903' }}
                >
                  +1
                </span>
                <input
                  {...register('mobileNumber')}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none transition"
                  style={{
                    borderColor: errors.mobileNumber ? '#ef4444' : '#D1C5C0',
                    color: '#1a1a1a',
                  }}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-xs mt-1 text-red-500">{errors.mobileNumber.message}</p>
              )}
            </div>

            {/* PIN — visible */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F0C00' }}>
                PIN
              </label>
              <input
                {...register('pin')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter your PIN"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none tracking-widest transition"
                style={{
                  borderColor: errors.pin ? '#ef4444' : '#D1C5C0',
                  color: '#1a1a1a',
                }}
              />
              {errors.pin && (
                <p className="text-xs mt-1 text-red-500">{errors.pin.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: '#751903' }}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
