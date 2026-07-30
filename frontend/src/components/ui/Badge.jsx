import React from 'react'
import './Badge.css'

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  count,
  className = '',
}) {
  if (count !== undefined) {
    return (
      <span className={`badge-counter ${count > 0 ? 'badge-counter-active' : ''}`}>
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  return (
    <span className={`badge badge-${variant} badge-size-${size} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
