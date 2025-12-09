import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import './EmpreendimentosList.css'

export default function EmpreendimentosList() {
  const { user } = useContext(AuthContext)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    loadEmpreendimentos()
  }, [])

  const loadEmpreendimentos = async () => {
    try {
      setLoading(true)
      const response = await api.get('/empreendimentos')
      setEmpreendimentos(response.data)
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmpreendimentos = empreendimentos.filter(emp => {
    const matchSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.cidade.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || emp.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusColors = {
    planejamento: '#94a3b8',
    construcao: '#f59e0b',
    pronto: '#10b981',
    concluido: '#6366f1'
  }

  return (
    <div className="empreendimentos-container">
      {/* Header Actions */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-subtitle">
            Gerencie seus empreendimentos imobiliários
          </h2>
        </div>
        <Link to="/dashboard/empreendimentos/novo">
          <Button variant="primary" size="md">
            + Novo Empreendimento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-grid">
          <div className="filter-item">
            <Input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="planejamento">Planejamento</option>
              <option value="construcao">Em Construção</option>
              <option value="pronto">Pronto</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">🏘️</div>
          <div className="stat-content">
            <div className="stat-value">{empreendimentos.length}</div>
            <div className="stat-label">Empreendimentos</div>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {empreendimentos.filter(e => e.status === 'pronto').length}
            </div>
            <div className="stat-label">Prontos</div>
          </div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">🚧</div>
          <div className="stat-content">
            <div className="stat-value">
              {empreendimentos.filter(e => e.status === 'construcao').length}
            </div>
            <div className="stat-label">Em Construção</div>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">
              {empreendimentos.filter(e => e.status === 'planejamento').length}
            </div>
            <div className="stat-label">Planejamento</div>
          </div>
        </div>
      </div>

      {/* Empreendimentos Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando empreendimentos...</p>
        </div>
      ) : filteredEmpreendimentos.length === 0 ? (
        <Card>
          <div className="empty-state">
            <div className="empty-icon">🏘️</div>
            <h3>Nenhum empreendimento encontrado</h3>
            <p>Crie seu primeiro empreendimento para começar</p>
            <Link to="/dashboard/empreendimentos/novo">
              <Button variant="primary">Criar Empreendimento</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="empreendimentos-grid">
          {filteredEmpreendimentos.map(emp => (
            <Card key={emp.id} className="empreendimento-card">
              <div className="card-image">
                {emp.imagemUrl ? (
                  <img src={emp.imagemUrl} alt={emp.nome} />
                ) : (
                  <div className="placeholder-image">
                    <span>🏘️</span>
                  </div>
                )}
                <span 
                  className="status-badge"
                  style={{ background: statusColors[emp.status] }}
                >
                  {emp.status}
                </span>
              </div>

              <div className="card-body">
                <h3 className="empreendimento-nome">{emp.nome}</h3>
                <p className="empreendimento-tipo">{emp.tipo}</p>
                
                <div className="empreendimento-location">
                  <span className="location-icon">📍</span>
                  {emp.cidade} - {emp.estado}
                </div>

                {emp.descricao && (
                  <p className="empreendimento-desc">
                    {emp.descricao.length > 100 
                      ? emp.descricao.substring(0, 100) + '...' 
                      : emp.descricao}
                  </p>
                )}

                <div className="card-footer">
                  <Link to={`/dashboard/empreendimentos/${emp.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
