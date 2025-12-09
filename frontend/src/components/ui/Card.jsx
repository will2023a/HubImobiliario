import React from 'react'
import './Card.css'

export default function Card({ 
  children, 
  title, 
  subtitle,
  action,
  hover = false,
  padding = 'md',
  className = '',
  ...props 
}) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} card-padding-${padding} ${className}`} {...props}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}
