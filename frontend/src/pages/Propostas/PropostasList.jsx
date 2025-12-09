import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import './PropostasList.css'

export default function PropostasList() {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    loadPropostas()
  }, [])

  const loadPropostas = async () => {
    try {
      setLoading(true)
      const response = await api.get('/propostas')
      setPropostas(response.data)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPropostas = propostas.filter(prop => {
    const matchSearch = prop.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       prop.clienteEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || prop.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusConfig = {
    pendente: { label: 'Pendente', color: '#f59e0b', icon: '⏳' },
    analise: { label: 'Em Análise', color: '#3b82f6', icon: '🔍' },
    aprovada: { label: 'Aprovada', color: '#10b981', icon: '✓' },
    rejeitada: { label: 'Rejeitada', color: '#ef4444', icon: '✕' }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const stats = {
    total: propostas.length,
    pendentes: propostas.filter(p => p.status === 'pendente').length,
    aprovadas: propostas.filter(p => p.status === 'aprovada').length,
    valorTotal: propostas.reduce((sum, p) => sum + (p.valorProposta || 0), 0)
  }

  return (
    <div className="propostas-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Propostas Comerciais</h1>
          <p className="page-subtitle">Gerencie todas as propostas do sistema</p>
        </div>
        <Link to="/dashboard/propostas/nova">
          <Button variant="primary" size="md">
            Nova Proposta
          </Button>
        </Link>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a227 100%)' }}>📊</div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{stats.pendentes}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>✓</div>
          <div className="stat-content">
            <div className="stat-label">Aprovadas</div>
            <div className="stat-value">{stats.aprovadas}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>💰</div>
          <div className="stat-content">
            <div className="stat-label">Valor Total</div>
            <div className="stat-value">{formatCurrency(stats.valorTotal)}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="analise">Em Análise</option>
            <option value="aprovada">Aprovada</option>
            <option value="rejeitada">Rejeitada</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando propostas...</p>
          </div>
        ) : filteredPropostas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Nenhuma proposta encontrada</h3>
            <p>Crie sua primeira proposta comercial</p>
          </div>
        ) : (
          <div className="propostas-list">
            {filteredPropostas.map((proposta) => (
              <Link to={`/dashboard/propostas/${proposta.id}`} key={proposta.id}>
                <Card hover className="proposta-card">
                  <div className="proposta-header">
                    <div>
                      <h3 className="proposta-cliente">{proposta.clienteNome}</h3>
                      <p className="proposta-info">{proposta.clienteEmail}</p>
                    </div>
                    <div className="proposta-status" style={{ 
                      background: statusConfig[proposta.status]?.color,
                      color: 'white'
                    }}>
                      {statusConfig[proposta.status]?.icon} {statusConfig[proposta.status]?.label}
                    </div>
                  </div>
                  <div className="proposta-details">
                    <div className="detail-item">
                      <span className="detail-label">Unidade:</span>
                      <span className="detail-value">{proposta.unidade?.numero || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Corretor:</span>
                      <span className="detail-value">{proposta.corretor?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Valor:</span>
                      <span className="detail-value gold">{formatCurrency(proposta.valorProposta)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Forma:</span>
                      <span className="detail-value">{proposta.formaPagamento}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
