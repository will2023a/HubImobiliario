import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import NotificationBell from '../shared/NotificationBell'
import SearchGlobal from '../shared/SearchGlobal'

export default function Header({ title }) {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="header-search-placeholder">
          <button
            className="header-search-btn"
            onClick={() => setSearchOpen(true)}
            title="Buscar (Ctrl+K)"
          >
            🔍 <span className="header-search-text">Buscar...</span>
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
