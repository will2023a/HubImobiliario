import React from 'react'
import './Input.css'

export function Input({ 
  label, 
  error, 
  icon,
  fullWidth = false,
  ...props 
}) {
  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input 
          className={`input ${icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export function Select({ label, error, children, fullWidth = false, ...props }) {
  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <select 
        className={`input input-select ${error ? 'input-error' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, fullWidth = false, ...props }) {
  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea 
        className={`input input-textarea ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

// Export default para compatibilidade
export default Input
