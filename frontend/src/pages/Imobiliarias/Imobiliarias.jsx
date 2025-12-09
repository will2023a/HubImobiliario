import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import './Imobiliarias.css'

export default function Imobiliarias() {
  const [imobiliarias, setImobiliarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadImobiliarias()
  }, [])

  const loadImobiliarias = async () => {
    try {
      setLoading(true)
      const response = await api.get('/imobiliarias')
      setImobiliarias(response.data)
    } catch (error) {
      console.error('Erro ao carregar imobiliárias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, novoStatus) => {
    try {
      await api.patch(`/imobiliarias/${id}`, { status: novoStatus })
      loadImobiliarias()
      alert('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const filteredImobiliarias = imobiliarias.filter(imob => {
    const matchSearch = imob.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       imob.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || imob.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusConfig = {
    ativa: { label: 'Ativa', color: '#10b981', icon: '✓' },
    pendente: { label: 'Pendente', color: '#f59e0b', icon: '⏳' },
    inativa: { label: 'Inativa', color: '#ef4444', icon: '✕' }
  }

  const stats = {
    total: imobiliarias.length,
    ativas: imobiliarias.filter(i => i.status === 'ativa').length,
    pendentes: imobiliarias.filter(i => i.status === 'pendente').length,
    inativas: imobiliarias.filter(i => i.status === 'inativa').length
  }

  return (
    <div className="imobiliarias-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Imobiliárias</h1>
          <p className="page-subtitle">Administração global de todas as imobiliárias</p>
        </div>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' }}>🏢</div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>✓</div>
          <div className="stat-content">
            <div className="stat-label">Ativas</div>
            <div className="stat-value">{stats.ativas}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{stats.pendentes}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>✕</div>
          <div className="stat-content">
            <div className="stat-label">Inativas</div>
            <div className="stat-value">{stats.inativas}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="todos">Todos os Status</option>
            <option value="ativa">Ativa</option>
            <option value="pendente">Pendente</option>
            <option value="inativa">Inativa</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando imobiliárias...</p>
          </div>
        ) : filteredImobiliarias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>Nenhuma imobiliária encontrada</h3>
          </div>
        ) : (
          <div className="imobiliarias-table">
            <table>
              <thead>
                <tr>
                  <th>Imobiliária</th>
                  <th>CNPJ</th>
                  <th>Cidade/Estado</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredImobiliarias.map(imob => (
                  <tr key={imob.id}>
                    <td>
                      <div className="imob-info">
                        <strong>{imob.nome}</strong>
                        <span>{imob.email}</span>
                      </div>
                    </td>
                    <td>{imob.cnpj}</td>
                    <td>{imob.cidade}/{imob.estado}</td>
                    <td>{imob.admin?.name || 'N/A'}</td>
                    <td>
                      <span className="status-badge" style={{ 
                        background: statusConfig[imob.status]?.color 
                      }}>
                        {statusConfig[imob.status]?.icon} {statusConfig[imob.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {imob.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStatusChange(imob.id, 'ativa')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(imob.id, 'inativa')}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {imob.status === 'ativa' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(imob.id, 'inativa')}
                          >
                            Desativar
                          </Button>
                        )}
                        {imob.status === 'inativa' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(imob.id, 'ativa')}
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
