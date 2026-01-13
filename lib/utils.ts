import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseStringAsUTC(dateString: string | undefined | null): Date {
  if (!dateString) return new Date()
  if (dateString.match(/Z|[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString)
  }
  return new Date(dateString + 'Z')
}
