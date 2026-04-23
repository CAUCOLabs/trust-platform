import { cn } from '../../lib/utils'

interface BooleanBadgeProps {
  value: boolean
  trueLabel?: string
  falseLabel?: string
  className?: string
}

export function BooleanBadge({ value, trueLabel = 'Yes', falseLabel = 'No', className }: BooleanBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1',
        value ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/20' : 'bg-slate-800 text-slate-300 ring-slate-700/80',
        className
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  )
}
