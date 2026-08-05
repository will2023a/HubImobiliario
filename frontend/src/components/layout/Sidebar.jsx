import React, { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import Logo from '../shared/Logo'
import {
  IconDashboard, IconPipeline, IconLeads, IconTasks,
  IconBuilding, IconDocument, IconMapPin, IconInbox,
  IconMegaphone, IconTarget, IconDollar, IconUsers,
  IconLock, IconSettings, IconOffice, IconCalendar, IconChart, IconBolt
} from './icons'

const menuSections = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <IconDashboard/>, page: 'dashboard' },
      { label: 'Pipeline', path: '/dashboard/pipeline', icon: <IconPipeline/>, page: 'pipeline' },
    ]
  },
  {
    label: 'CRM',
    items: [
      { label: 'Leads', path: '/dashboard/leads', icon: <IconLeads/>, page: 'leads' },
      { label: 'Tarefas', path: '/dashboard/tarefas', icon: <IconTasks/>, page: 'tasks' },
    ]
  },
  {
    label: 'Imóveis',
    items: [
      { label: 'Empreendimentos', path: '/dashboard/empreendimentos', icon: <IconBuilding/>, page: 'empreendimentos' },
      { label: 'Propostas', path: '/dashboard/propostas', icon: <IconDocument/>, page: 'propostas' },
      { label: 'Visitas', path: '/dashboard/visitas', icon: <IconMapPin/>, page: 'visitas' },
    ]
  },
  {
    label: 'Atendimento',
    items: [
      { label: 'Inbox', path: '/dashboard/inbox', icon: <IconInbox/>, page: 'inbox' },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Materiais', path: '/dashboard/marketing', icon: <IconMegaphone/>, page: 'marketing' },
    ]
  },
  {
    label: 'Agenda',
    items: [
      { label: 'Calendário', path: '/dashboard/agenda', icon: <IconCalendar/>, page: 'agenda' },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Dashboard BI', path: '/dashboard/analytics', icon: <IconChart/>, page: 'analytics' },
    ]
  },
  {
    label: 'Automações',
    items: [
      { label: 'Fluxos', path: '/dashboard/automacoes', icon: <IconBolt/>, page: 'automations' },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Comissões', path: '/dashboard/financeiro/comissoes', icon: <IconDollar/>, page: 'comissoes' },
    ]
  },
  {
    label: 'Administração',
    items: [
      { label: 'Equipe', path: '/dashboard/equipe', icon: <IconUsers/>, page: 'users' },
      { label: 'Acessos por usuário', path: '/dashboard/permissoes', icon: <IconLock/>, page: 'permissions' },
      { label: 'Configurações', path: '/dashboard/configuracoes', icon: <IconSettings/>, page: 'settings' },
    ]
  },
  {
    label: 'Super Admin',
    items: [
      { label: 'Imobiliárias', path: '/super/imobiliarias', icon: <IconOffice/>, page: 'super', roles: ['super_admin'] },
      { label: 'Usuários globais', path: '/super/usuarios', icon: <IconUsers/>, page: 'super', roles: ['super_admin'] },
    ]
  },
]

export default function Sidebar({ isOpen, onToggle }) {
  const { user, can } = useContext(AuthContext)
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
      items: section.items.filter(item => user && (item.roles ? item.roles.includes(user.role) : can(item.page)))
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
