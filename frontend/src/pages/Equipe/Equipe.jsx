import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import './Equipe.css'
import AppIcon from '../../components/ui/AppIcon'

export default function Equipe() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'todos' || user.role === filterRole
    return matchSearch && matchRole
  })

  const roleConfig = {
    diretor: { label: 'Diretor', color: '#d4af37' },
    gerente: { label: 'Gerente', color: '#1a1a1a' },
    corretor: { label: 'Corretor', color: '#666666' }
  }

  const organizeHierarchy = (users) => {
    const diretores = users.filter(u => u.role === 'diretor')
    return diretores.map(diretor => ({
      ...diretor,
      gerentes: users.filter(u => u.role === 'gerente' && u.diretorId === diretor.id).map(gerente => ({
        ...gerente,
        corretores: users.filter(u => u.role === 'corretor' && u.gerenteId === gerente.id)
      }))
    }))
  }

  const hierarchy = organizeHierarchy(users)

  const stats = {
    total: users.length,
    diretores: users.filter(u => u.role === 'diretor').length,
    gerentes: users.filter(u => u.role === 'gerente').length,
    corretores: users.filter(u => u.role === 'corretor').length
  }

  return (
    <div className="equipe-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Equipe</h1>
          <p className="page-subtitle">Organize sua estrutura hierárquica</p>
        </div>
        <Link to="/dashboard/users/novo">
          <Button variant="primary">Adicionar Membro</Button>
        </Link>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="users" /></div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="users" /></div>
          <div className="stat-content">
            <div className="stat-label">Diretores</div>
            <div className="stat-value">{stats.diretores}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="users" /></div>
          <div className="stat-content">
            <div className="stat-label">Gerentes</div>
            <div className="stat-value">{stats.gerentes}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="users" /></div>
          <div className="stat-content">
            <div className="stat-label">Corretores</div>
            <div className="stat-value">{stats.corretores}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="todos">Todos os Cargos</option>
            <option value="diretor">Diretor</option>
            <option value="gerente">Gerente</option>
            <option value="corretor">Corretor</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando equipe...</p>
          </div>
        ) : (
          <div className="hierarchy-view">
            {hierarchy.map(diretor => (
              <div key={diretor.id} className="hierarchy-level">
                <Card className="user-card diretor">
                  <div className="user-header">
                    <div className="user-avatar"><AppIcon name="users" /></div>
                    <div className="user-info">
                      <h3>{diretor.name}</h3>
                      <p>{diretor.email}</p>
                    </div>
                    <div className="user-badge" style={{ background: roleConfig.diretor.color }}>
                      {roleConfig.diretor.label}
                    </div>
                  </div>
                </Card>

                {diretor.gerentes.length > 0 && (
                  <div className="hierarchy-children">
                    {diretor.gerentes.map(gerente => (
                      <div key={gerente.id} className="hierarchy-branch">
                        <Card className="user-card gerente">
                          <div className="user-header">
                            <div className="user-avatar"><AppIcon name="users" /></div>
                            <div className="user-info">
                              <h3>{gerente.name}</h3>
                              <p>{gerente.email}</p>
                            </div>
                            <div className="user-badge" style={{ background: roleConfig.gerente.color }}>
                              {roleConfig.gerente.label}
                            </div>
                          </div>
                        </Card>

                        {gerente.corretores.length > 0 && (
                          <div className="hierarchy-children">
                            {gerente.corretores.map(corretor => (
                              <Card key={corretor.id} className="user-card corretor">
                                <div className="user-header">
                                  <div className="user-avatar"><AppIcon name="users" /></div>
                                  <div className="user-info">
                                    <h3>{corretor.name}</h3>
                                    <p>{corretor.email}</p>
                                  </div>
                                  <div className="user-badge" style={{ background: roleConfig.corretor.color }}>
                                    {roleConfig.corretor.label}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
