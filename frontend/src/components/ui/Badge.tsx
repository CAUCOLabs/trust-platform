import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { RiskLevel } from '../../lib/types'

const levelStyles: Record<RiskLevel | 'unknown', string> = {
  low: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm shadow-emerald-500/10',
  medium: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20 shadow-sm shadow-amber-500/10',
  high: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20 shadow-sm shadow-rose-500/10',
  unknown: 'bg-slate-700/80 text-slate-300 ring-1 ring-slate-600/80 shadow-sm shadow-slate-900/40',
}

interface BadgeProps {
  level?: RiskLevel
  children?: ReactNode
  className?: string
}

export function Badge({ level, children, className }: BadgeProps) {
  const label = children ?? (level ?? 'unknown')
  const classes = levelStyles[level ?? 'unknown']

  return <span className={cn('rounded-full px-4 py-2 text-sm font-semibold', classes, className)}>{label}</span>
}
