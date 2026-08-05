import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import NotificationBell from '../shared/NotificationBell'
import SearchGlobal from '../shared/SearchGlobal'
import AppIcon from '../ui/AppIcon'

export default function Header({ title, onMenuClick, isMobile }) {
  const { user, logout, switchImobiliaria } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-left">
        {isMobile && (
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Menu">
            <span className="hamburger-lines" aria-hidden="true" />
          </button>
        )}
        <h1 className="page-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="header-right">
        {user?.imobiliarias?.length > 1 && (
          <select
            aria-label="Imobiliária ativa"
            value={user.imobiliariaId || ''}
            onChange={event => switchImobiliaria(event.target.value)}
            className="header-agency-select"
          >
            {user.imobiliarias.filter(item => item.status === 'ativa').map(item => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
        )}
        <div className="header-search-placeholder">
          <button
            className="header-search-btn"
            onClick={() => setSearchOpen(true)}
            title="Buscar (Ctrl+K)"
          >
            <AppIcon name="search" size={17} /> <span className="header-search-text">Buscar...</span>
          </button>
        </div>

        <NotificationBell />

        <div className="user-menu">
          <Avatar name={user?.name} size="sm" />
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      <SearchGlobal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
