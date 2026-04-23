import { cn } from '../../lib/utils'

interface TabOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SectionTabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<TabOption<T>>
}

export function SectionTabs<T extends string>({ value, onChange, options }: SectionTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition-all duration-200',
              active
                ? 'border-sky-400/50 bg-sky-500/12 text-sky-100 shadow-[0_20px_45px_-30px_rgba(14,165,233,0.8)]'
                : 'border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800/90'
            )}
            aria-pressed={active}
          >
            <span>{option.label}</span>
            {option.count !== undefined ? (
              <span className={cn('rounded-full px-2.5 py-1 text-xs', active ? 'bg-sky-400/20 text-sky-100' : 'bg-slate-800 text-slate-400')}>
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
