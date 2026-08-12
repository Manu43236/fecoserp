import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'text-white border-transparent hover:opacity-90',
  secondary: 'bg-white border hover:bg-gray-50',
  ghost:     'bg-transparent border-transparent hover:bg-gray-100',
  danger:    'text-white border-transparent hover:opacity-90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const bgStyle = variant === 'primary'
    ? { backgroundColor: 'var(--color-primary)', ...style }
    : variant === 'danger'
    ? { backgroundColor: 'var(--color-critical)', ...style }
    : variant === 'secondary'
    ? { borderColor: 'var(--color-border)', color: 'var(--color-primary)', ...style }
    : style

  return (
    <button
      disabled={disabled || loading}
      style={bgStyle}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-md
        border transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}
