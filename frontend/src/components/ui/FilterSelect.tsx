import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Select } from './Select'

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export function FilterSelect({ className, children, ...props }: FilterSelectProps) {
  return (
    <Select
      className={cn('min-h-0 rounded-2xl px-4 py-3 text-sm sm:min-w-[11rem]', className)}
      {...props}
    >
      {children}
    </Select>
  )
}
