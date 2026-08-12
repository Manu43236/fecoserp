import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={`
          px-3 py-2 text-sm rounded border outline-none transition-colors duration-150 resize-none
          focus:ring-2 disabled:opacity-50 disabled:bg-gray-50
          ${error ? 'border-[var(--color-critical)]' : 'border-[var(--color-border-strong)]'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-critical)' }}>{error}</p>
      )}
    </div>
  ),
)

Textarea.displayName = 'Textarea'
