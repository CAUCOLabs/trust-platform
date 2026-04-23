import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Panel({ className, glow = false, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-[32px] border border-slate-700/60 bg-slate-950/80 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]',
        glow && 'shadow-[0_30px_120px_-55px_rgba(14,165,233,0.45)]',
        className
      )}
      {...props}
    />
  )
}
