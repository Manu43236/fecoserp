import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  numeric?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, numeric = false, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          h-9 px-3 text-sm rounded border outline-none transition-colors duration-150
          focus:ring-2 disabled:opacity-50 disabled:bg-gray-50
          ${numeric ? 'font-mono' : ''}
          ${error ? 'border-[var(--color-critical)]' : 'border-[var(--color-border-strong)]'}
          ${className}
        `}
        style={
          error
            ? { '--tw-ring-color': 'var(--color-critical-bg)' } as React.CSSProperties
            : { '--tw-ring-color': 'var(--color-primary-light)' } as React.CSSProperties
        }
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-critical)' }}>{error}</p>
      )}
    </div>
  ),
)

Input.displayName = 'Input'
