import React from 'react'
import './Avatar.css'

export default function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        className={`avatar avatar-${size} ${className}`}
        src={src}
        alt={name || 'Avatar'}
      />
    )
  }

  return (
    <div className={`avatar avatar-${size} avatar-initials ${className}`} aria-label={name}>
      {initials}
    </div>
  )
}
