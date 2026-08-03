import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/leads': 'Leads',
  '/dashboard/tarefas': 'Tarefas',
  '/dashboard/empreendimentos': 'Empreendimentos',
  '/dashboard/propostas': 'Propostas',
  '/dashboard/visitas': 'Visitas',
  '/dashboard/inbox': 'Inbox',
  '/dashboard/templates': 'Templates',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/marketing/campanhas': 'Campanhas',
  '/dashboard/financeiro/comissoes': 'Comissões',
  '/dashboard/equipe': 'Equipe',
  '/dashboard/permissoes': 'Permissões',
  '/dashboard/configuracoes': 'Configurações',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/agenda': 'Agenda',
  '/dashboard/perfil': 'Perfil',
  '/super/imobiliarias': 'Imobiliárias',
}

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const match = Object.keys(pageTitles)
    .filter(key => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0]
  return match ? pageTitles[match] : 'Dashboard'
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  // Detect mobile
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="main-content">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
