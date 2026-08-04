import React from 'react'
import './EmptyState.css'
import AppIcon from './AppIcon'

export default function EmptyState({
  title = 'Nenhum registro',
  description,
  icon,
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{React.isValidElement(icon) ? icon : <AppIcon name="document" size={28} />}</span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
