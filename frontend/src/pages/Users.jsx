import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Badge, Table, Spinner, EmptyState } from '../components/ui'
import Button from '../components/ui/Button'

const roleColors = {
  super_admin: 'error',
  admin_imobiliaria: 'primary',
  diretor: 'info',
  gerente: 'warning',
  corretor: 'success',
}

const roleLabels = {
  super_admin: 'Super Admin',
  admin_imobiliaria: 'Admin',
  diretor: 'Diretor',
  gerente: 'Gerente',
  corretor: 'Corretor',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'role', label: 'Função', sortable: true, render: (val) => (
      <Badge variant={roleColors[val] || 'default'} size="sm">{roleLabels[val] || val}</Badge>
    )},
    { key: 'createdAt', label: 'Criado em', sortable: true, render: (val) => (
      val ? new Date(val).toLocaleDateString('pt-BR') : '-'
    )},
  ]

  if (loading) return <Spinner fullPage label="Carregando usuários..." />

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Equipe</h2>
          <p className="leads-subtitle">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/users/novo')}>+ Novo Usuário</Button>
      </div>

      <div className="leads-filters">
        <input
          className="leads-search"
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="leads-filter-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Todos os roles</option>
          <option value="diretor">Diretor</option>
          <option value="gerente">Gerente</option>
          <option value="corretor">Corretor</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title="Nenhum usuário encontrado"
          description="Adicione membros à sua equipe."
          action={<Button onClick={() => navigate('/dashboard/users/novo')}>Adicionar Membro</Button>}
        />
      ) : (
        <Table columns={columns} data={filtered} />
      )}
    </div>
  )
}
