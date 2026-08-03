import React, { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import Logo from '../shared/Logo'
import {
  IconDashboard, IconPipeline, IconLeads, IconTasks,
  IconBuilding, IconDocument, IconMapPin, IconInbox,
  IconMegaphone, IconTarget, IconDollar, IconUsers,
  IconLock, IconSettings, IconOffice, IconCalendar, IconChart
} from './icons'

const menuSections = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <IconDashboard/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
      { label: 'Pipeline', path: '/dashboard/pipeline', icon: <IconPipeline/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'CRM',
    items: [
      { label: 'Leads', path: '/dashboard/leads', icon: <IconLeads/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
      { label: 'Tarefas', path: '/dashboard/tarefas', icon: <IconTasks/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'Imóveis',
    items: [
      { label: 'Empreendimentos', path: '/dashboard/empreendimentos', icon: <IconBuilding/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
      { label: 'Propostas', path: '/dashboard/propostas', icon: <IconDocument/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
      { label: 'Visitas', path: '/dashboard/visitas', icon: <IconMapPin/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'Atendimento',
    items: [
      { label: 'Inbox', path: '/dashboard/inbox', icon: <IconInbox/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Materiais', path: '/dashboard/marketing', icon: <IconMegaphone/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente'] },
      { label: 'Campanhas', path: '/dashboard/marketing/campanhas', icon: <IconTarget/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente'] },
    ]
  },
  {
    label: 'Agenda',
    items: [
      { label: 'Calendário', path: '/dashboard/agenda', icon: <IconCalendar/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Dashboard BI', path: '/dashboard/analytics', icon: <IconChart/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente'] },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: <IconDollar/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor'] },
    ]
  },
  {
    label: 'Administração',
    items: [
      { label: 'Equipe', path: '/dashboard/equipe', icon: <IconUsers/>, roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente'] },
      { label: 'Permissões', path: '/dashboard/permissoes', icon: <IconLock/>, roles: ['super_admin', 'admin_imobiliaria'] },
      { label: 'Configurações', path: '/dashboard/configuracoes', icon: <IconSettings/>, roles: ['super_admin', 'admin_imobiliaria'] },
    ]
  },
  {
    label: 'Super Admin',
    items: [
      { label: 'Imobiliárias', path: '/super/imobiliarias', icon: <IconOffice/>, roles: ['super_admin'] },
    ]
  },
]

export default function Sidebar({ isOpen, onToggle }) {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = (label) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => user && item.roles.includes(user.role))
    }))
    .filter(section => section.items.length > 0)

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Logo size={30} />
          {isOpen && <span className="logo-text">Gestor Pro 360</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleSections.map(section => (
          <div key={section.label} className="sidebar-section">
            {isOpen && (
              <button
                className="sidebar-section-title"
                onClick={() => toggleSection(section.label)}
              >
                <span>{section.label}</span>
                <span className={`sidebar-section-arrow ${collapsedSections[section.label] ? 'rotated' : ''}`}>
                  ›
                </span>
              </button>
            )}
            {!collapsedSections[section.label] && (
              <div className="sidebar-section-items">
                {section.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {isOpen && <span className="nav-label">{item.label}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
    </aside>
  )
}
