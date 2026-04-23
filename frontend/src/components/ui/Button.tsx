import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger'
  loading?: boolean
  loadingLabel?: string
}

const variantStyles = {
  primary:
    'bg-sky-500 text-white shadow-[0_20px_45px_-28px_rgba(14,165,233,0.85)] hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 disabled:bg-slate-600 disabled:text-slate-200',
  danger:
    'bg-rose-500 text-white shadow-[0_20px_45px_-28px_rgba(244,63,94,0.8)] hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:bg-slate-600 disabled:text-slate-200',
}

export function Button({ variant = 'primary', className = '', loading = false, loadingLabel, children, disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:shadow-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
