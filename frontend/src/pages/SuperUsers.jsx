import React, { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import './Imobiliarias/Imobiliarias.css'

export default function SuperUsers() {
  const [data, setData] = useState({ users: [], totals: {} })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  async function load() {
    try { setData((await api.get('/super/overview')).data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function setApproval(user, isApproved) {
    try {
      await api.patch(`/super/users/${user.id}/approval`, { isApproved })
      await load()
    } catch (error) { alert(error.response?.data?.error || 'Não foi possível alterar a aprovação') }
  }

  const users = useMemo(() => data.users.filter(user => {
    const term = search.toLowerCase()
    const match = user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term) || user.imobiliaria?.nome?.toLowerCase().includes(term)
    return match && (status === 'all' || (status === 'online' ? user.online : status === 'approved' ? user.isApproved : !user.isApproved))
  }), [data.users, search, status])

  return <div className="imobiliarias-container">
    <div className="page-header"><div><h1 className="page-title">Controle global de usuários</h1><p className="page-subtitle">Aprovação, vínculo e presença em todas as imobiliárias</p></div></div>
    <div className="stats-grid">
      <Card className="stat-card"><div className="stat-content"><div className="stat-label">Usuários</div><div className="stat-value">{data.totals.users || 0}</div></div></Card>
      <Card className="stat-card"><div className="stat-content"><div className="stat-label">Online agora</div><div className="stat-value">{data.totals.online || 0}</div></div></Card>
      <Card className="stat-card"><div className="stat-content"><div className="stat-label">Aguardando aprovação</div><div className="stat-value">{data.totals.pendingUsers || 0}</div></div></Card>
    </div>
    <Card padding="lg">
      <div className="filters-section"><Input placeholder="Buscar nome, e-mail ou imobiliária..." value={search} onChange={e => setSearch(e.target.value)} /><Select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos</option><option value="online">Online</option><option value="approved">Aprovados</option><option value="pending">Pendentes</option></Select></div>
      {loading ? <div className="loading-state"><div className="spinner" /></div> : <div className="imobiliarias-table"><table><thead><tr><th>Usuário</th><th>Imobiliária</th><th>Perfil</th><th>Presença</th><th>Aprovação</th><th>Ações</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="imob-info"><strong>{user.name}</strong><span>{user.email}</span></div></td><td>{user.imobiliaria?.nome || 'Global'}</td><td>{user.role.replaceAll('_', ' ')}</td><td><span className="status-badge" style={{ background: user.online ? '#1a1a1a' : '#777' }}>{user.online ? 'Online' : 'Offline'}</span></td><td>{user.isApproved ? 'Aprovado' : 'Pendente'}</td><td>{user.role !== 'super_admin' && <Button size="sm" variant={user.isApproved ? 'secondary' : 'primary'} onClick={() => setApproval(user, !user.isApproved)}>{user.isApproved ? 'Suspender' : 'Aprovar'}</Button>}</td></tr>)}</tbody></table></div>}
    </Card>
  </div>
}
