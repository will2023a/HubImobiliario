import React from 'react'
import './Spinner.css'

export default function Spinner({
  size = 'md',
  variant = 'default',
  fullPage = false,
  label = 'Carregando...',
}) {
  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className={`spinner spinner-${size} spinner-${variant}`} />
        {label && <span className="spinner-label">{label}</span>}
      </div>
    )
  }

  return (
    <div className="spinner-inline">
      <div className={`spinner spinner-${size} spinner-${variant}`} role="status" aria-label={label} />
    </div>
  )
}

export function Skeleton({ width, height = '1rem', rounded = false }) {
  return (
    <div
      className={`skeleton ${rounded ? 'skeleton-rounded' : ''}`}
      style={{ width: width || '100%', height }}
    />
  )
}
