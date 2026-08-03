import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

// Map paths to page titles
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/leads': 'Leads',
  '/dashboard/tarefas': 'Tarefas',
  '/dashboard/empreendimentos': 'Empreendimentos',
  '/dashboard/propostas': 'Propostas',
  '/dashboard/visitas': 'Visitas',
  '/dashboard/inbox': 'Inbox',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/marketing/campanhas': 'Campanhas',
  '/dashboard/financeiro/comissoes': 'Comissões',
  '/dashboard/equipe': 'Equipe',
  '/dashboard/permissoes': 'Permissões',
  '/dashboard/configuracoes': 'Configurações',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/financeiro/comissoes': 'Comissões',
  '/dashboard/agenda': 'Agenda',
  '/dashboard/templates': 'Templates',
  '/dashboard/inbox': 'Inbox',
  '/dashboard/perfil': 'Perfil',
  '/super/imobiliarias': 'Imobiliárias',
}

function getPageTitle(pathname) {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Partial match (e.g., /dashboard/empreendimentos/1)
  const match = Object.keys(pageTitles)
    .filter(key => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0]
  return match ? pageTitles[match] : 'Dashboard'
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-content">
        <Header title={title} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
