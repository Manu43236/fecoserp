import fecosLogo from '@/assets/fecos_logo.png'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-content-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={fecosLogo} alt="FECOS" className="h-12 mx-auto mb-3 object-contain" />
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Field Engineering Chemical Operations</p>
        </div>
        {/* Login form — built in Auth slice */}
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>Login form coming in Auth slice</p>
        </div>
      </div>
    </div>
  )
}
