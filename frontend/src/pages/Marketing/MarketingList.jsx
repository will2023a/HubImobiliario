import React, { useState, useEffect, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import './MarketingList.css'
import AppIcon from '../../components/ui/AppIcon'

export default function MarketingList({ empreendimentoId }) {
  const { user } = useContext(AuthContext)
  const [searchParams] = useSearchParams()
  const empId = empreendimentoId || searchParams.get('empreendimentoId')
  
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin_imobiliaria' || user?.role === 'diretor'

  useEffect(() => {
    loadMateriais()
  }, [empId])

  const loadMateriais = async () => {
    try {
      setLoading(true)
      const url = empId ? `/marketing?empreendimentoId=${empId}` : '/marketing'
      const response = await api.get(url)
      setMateriais(response.data)
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMateriais = materiais.filter(material => {
    const matchSearch = material.empreendimento?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filterTipo === 'todos' || material.tipo === filterTipo
    return matchSearch && matchTipo
  })

  const tipoConfig = {
    banner: { label: 'Banner', icon: 'chart' },
    folder: { label: 'Folder', icon: 'document' }
  }

  const getEstoqueStatus = (quantidade) => {
    if (quantidade === 0) return { label: 'Esgotado', color: '#ef4444' }
    if (quantidade <= 10) return { label: 'Baixo', color: '#f59e0b' }
    return { label: 'Disponível', color: '#10b981' }
  }

  const stats = {
    total: materiais.reduce((sum, m) => sum + m.quantidadeEstoque, 0),
    banners: materiais.filter(m => m.tipo === 'banner').reduce((sum, m) => sum + m.quantidadeEstoque, 0),
    folders: materiais.filter(m => m.tipo === 'folder').reduce((sum, m) => sum + m.quantidadeEstoque, 0),
    dispensados: materiais.reduce((sum, m) => sum + (m.quantidadeInicial - m.quantidadeEstoque), 0)
  }

  return (
    <div className="marketing-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle de Marketing</h1>
          <p className="page-subtitle">Gestão de estoque de banners e folders</p>
        </div>
        {isAdmin && (
          <Link to={empId ? `/dashboard/empreendimentos/${empId}/marketing/novo` : '/dashboard/marketing/novo'}>
            <Button variant="primary">Adicionar Material</Button>
          </Link>
        )}
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="building" /></div>
          <div className="stat-content">
            <div className="stat-label">Total em Estoque</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="chart" /></div>
          <div className="stat-content">
            <div className="stat-label">Banners</div>
            <div className="stat-value">{stats.banners}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="document" /></div>
          <div className="stat-content">
            <div className="stat-label">Folders</div>
            <div className="stat-value">{stats.folders}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="check" /></div>
          <div className="stat-content">
            <div className="stat-label">Dispensados</div>
            <div className="stat-value">{stats.dispensados}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por empreendimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="todos">Todos os Tipos</option>
            <option value="banner">Banners</option>
            <option value="folder">Folders</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando materiais...</p>
          </div>
        ) : filteredMateriais.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><AppIcon name="document" size={30} /></div>
            <h3>Nenhum material cadastrado</h3>
            <p>Adicione o primeiro item ao estoque</p>
          </div>
        ) : (
          <div className="materiais-grid">
            {filteredMateriais.map(material => {
              const status = getEstoqueStatus(material.quantidadeEstoque)
              return (
                <Card key={material.id} hover className="material-card">
                  <div className="material-header">
                    <div className="material-tipo">
                      <AppIcon name={tipoConfig[material.tipo]?.icon || 'document'} />
                    </div>
                    <div className="material-info">
                      <h3>{tipoConfig[material.tipo]?.label}</h3>
                      <p>{material.empreendimento?.nome || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="material-body">
                    <div className="material-stats">
                      <div className="stat-item">
                        <span className="stat-number">{material.quantidadeEstoque}</span>
                        <span className="stat-text">em estoque</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{material.quantidadeInicial}</span>
                        <span className="stat-text">inicial</span>
                      </div>
                    </div>
                    <div className="material-status" style={{ color: status.color }}>
                      ● {status.label}
                    </div>
                  </div>
                  <div className="material-actions">
                    <Link to={`/dashboard/marketing/${material.id}/dispensar`}>
                      <Button size="sm" variant="primary">Dispensar</Button>
                    </Link>
                    <Link to={`/dashboard/marketing/${material.id}/historico`}>
                      <Button size="sm" variant="secondary">Histórico</Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
