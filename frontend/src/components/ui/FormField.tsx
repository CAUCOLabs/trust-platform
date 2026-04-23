import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FormFieldProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string | null
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, hint, error, children, className }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn('flex flex-col gap-3', className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</span>
      {children}
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  )
}
