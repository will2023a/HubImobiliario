import React, { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import './Layout.css'

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: '■',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor']
    },
    { 
      label: 'Empreendimentos', 
      path: '/dashboard/empreendimentos', 
      icon: '▣',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor']
    },
    { 
      label: 'Propostas', 
      path: '/dashboard/propostas', 
      icon: '▤',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor']
    },
    { 
      label: 'Visitas', 
      path: '/dashboard/visitas', 
      icon: '◐',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente', 'corretor']
    },
    { 
      label: 'Marketing', 
      path: '/dashboard/marketing', 
      icon: '◘',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente']
    },
    { 
      label: 'Leads', 
      path: '/dashboard/leads', 
      icon: '◈',
      roles: ['super_admin', 'admin_imobiliaria', 'corretor']
    },
    { 
      label: 'Equipe', 
      path: '/dashboard/equipe', 
      icon: '◑',
      roles: ['super_admin', 'admin_imobiliaria', 'diretor', 'gerente']
    },
    { 
      label: 'Permissões', 
      path: '/dashboard/permissoes', 
      icon: '◆',
      roles: ['super_admin', 'admin_imobiliaria']
    },
    { 
      label: 'Imobiliárias', 
      path: '/super/imobiliarias', 
      icon: '◙',
      roles: ['super_admin']
    },
  ]

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">◆</span>
            {sidebarOpen && <span className="logo-text">Hub Imobiliário</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">
              {visibleMenuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="header-right">
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button className="btn-logout" onClick={logout}>
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
