import type { AppView } from '../../lib/types'
import { cn } from '../../lib/utils'

interface ViewSwitchProps {
  value: AppView
  onChange: (view: AppView) => void
}

const options: Array<{ value: AppView; label: string; helper: string }> = [
  { value: 'public', label: 'Public Website', helper: 'Product surface' },
  { value: 'portal', label: 'Customer Portal', helper: 'Customer access' },
  { value: 'internal', label: 'Internal Ops', helper: 'Protected console' },
]

export function ViewSwitch({ value, onChange }: ViewSwitchProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/80 p-1.5">
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-4 py-2 text-left transition-all duration-200 sm:px-5',
              active ? 'bg-sky-500 text-white shadow-[0_15px_35px_-25px_rgba(14,165,233,0.9)]' : 'text-slate-300 hover:bg-slate-800/80'
            )}
            aria-pressed={active}
          >
            <div className="text-sm font-semibold">{option.label}</div>
            <div className={cn('hidden text-[11px] tracking-[0.22em] uppercase sm:block', active ? 'text-sky-50/80' : 'text-slate-500')}>
              {option.helper}
            </div>
          </button>
        )
      })}
    </div>
  )
}
