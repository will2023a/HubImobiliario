import React from 'react'
import './KPICard.css'

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}) {
  return (
    <div className={`kpi-card kpi-card-${variant}`}>
      <div className="kpi-card-header">
        <span className="kpi-card-icon">{icon}</span>
        {trend && (
          <span className={`kpi-card-trend kpi-trend-${trend}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div className="kpi-card-body">
        <span className="kpi-card-value">{value}</span>
        <span className="kpi-card-title">{title}</span>
      </div>
      {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
    </div>
  )
}
