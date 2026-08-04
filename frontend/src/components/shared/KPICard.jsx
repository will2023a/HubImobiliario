import React from 'react'
import './KPICard.css'
import AppIcon from '../ui/AppIcon'

function iconFor(title = '') {
  const value = title.toLowerCase()
  if (value.includes('comiss') || value.includes('valor') || value.includes('venda')) return 'money'
  if (value.includes('proposta')) return 'document'
  if (value.includes('lead') || value.includes('usuário')) return 'users'
  if (value.includes('unidade') || value.includes('empreendimento')) return 'building'
  if (value.includes('conversão')) return 'chart'
  return 'chart'
}

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
        <span className="kpi-card-icon"><AppIcon name={typeof icon === 'string' && /^[a-z]+$/.test(icon) ? icon : iconFor(title)} /></span>
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
