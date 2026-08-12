import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          h-9 px-3 text-sm rounded border outline-none transition-colors duration-150
          bg-white cursor-pointer disabled:opacity-50 disabled:bg-gray-50
          ${error ? 'border-[var(--color-critical)]' : 'border-[var(--color-border-strong)]'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-critical)' }}>{error}</p>
      )}
    </div>
  ),
)

Select.displayName = 'Select'
