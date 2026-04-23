import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Input } from './Input'

interface FilterInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function FilterInput({ className, ...props }: FilterInputProps) {
  return (
    <Input
      className={cn('min-h-0 rounded-2xl px-4 py-3 text-sm sm:min-w-[15rem]', className)}
      {...props}
    />
  )
}
