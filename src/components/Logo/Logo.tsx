import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  /** Use the version with white lettering, for dark backgrounds (the heart keeps its colours). */
  onDark?: boolean
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

/** The Printribe logo (public/printribe-logo.png, 804 x 152). */
export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className, onDark } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Printribe"
      width={804}
      height={152}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('h-7 w-auto', className)}
      src={onDark ? '/printribe-logo-light.png' : '/printribe-logo.png'}
    />
  )
}
