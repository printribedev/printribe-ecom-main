import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

export type PillStyle = 'white' | 'ghost' | 'sky' | 'dark' | 'outline'

const styles: Record<PillStyle, string> = {
  white: 'bg-white text-ink hover:bg-white/90',
  ghost: 'border-white/55 text-white hover:bg-white/10',
  sky: 'bg-sky text-white hover:bg-sky/90',
  dark: 'bg-ink text-white hover:bg-ink/85',
  outline: 'border-ink text-ink hover:bg-ink hover:text-white',
}

type Props = {
  label?: string | null
  url?: string | null
  style?: PillStyle | null
  className?: string
  children?: React.ReactNode
}

/** The fully-rounded button used across the site. */
export const PillButton: React.FC<Props> = ({ label, url, style, className, children }) => {
  if (!url) return null
  return (
    <Link
      href={url}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] border-transparent px-6 py-3 text-[17px] font-medium transition-colors',
        styles[style || 'white'],
        className,
      )}
    >
      {label}
      {children}
    </Link>
  )
}
