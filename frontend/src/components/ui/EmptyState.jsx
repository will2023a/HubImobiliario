import React from 'react'
import './EmptyState.css'

export default function EmptyState({
  title = 'Nenhum registro',
  description,
  icon = '📋',
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
