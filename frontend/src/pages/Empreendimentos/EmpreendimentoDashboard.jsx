import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import VisitasList from '../Visitas/VisitasList'
import MarketingList from '../Marketing/MarketingList'
import MapaDisponibilidade from './MapaDisponibilidade'
import './EmpreendimentoDashboard.css'

export default function EmpreendimentoDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empreendimento, setEmpreendimento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('visao-geral')

  useEffect(() => {
    loadEmpreendimento()
  }, [id])

  const loadEmpreendimento = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/empreendimentos/${id}`)
      setEmpreendimento(response.data)
    } catch (error) {
      console.error('Erro ao carregar empreendimento:', error)
      navigate('/dashboard/empreendimentos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Carregando empreendimento...</p>
      </div>
    )
  }

  if (!empreendimento) return null

  const unidades = empreendimento.unidades || []
  const propostas = empreendimento.propostas || []

  const stats = {
    totalUnidades: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    reservadas: unidades.filter(u => u.status === 'reservado').length,
    vendidas: unidades.filter(u => u.status === 'vendido').length,
    valorTotal: unidades.reduce((sum, u) => sum + (u.valorTotal || 0), 0),
    propostasAbertas: propostas.filter(p => p.status === 'aberta').length,
  }

  const statusColors = {
    disponivel: '#10b981',
    reservado: '#f59e0b',
    vendido: '#ef4444'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-back">
          <Link to="/dashboard/empreendimentos">
            <Button variant="ghost" size="sm">← Voltar</Button>
          </Link>
        </div>
        
        <div className="header-info">
          <h2 className="dashboard-title">{empreendimento.nome}</h2>
          <div className="dashboard-meta">
            <span className="meta-item">{empreendimento.tipo}</span>
            <span className="meta-separator">•</span>
            <span className="meta-item">📍 {empreendimento.cidade} - {empreendimento.estado}</span>
            <span className="meta-separator">•</span>
            <span className="meta-item status-label" style={{ color: statusColors[empreendimento.status] }}>
              {empreendimento.status}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <Link to={`/dashboard/empreendimentos/${id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link to={`/dashboard/empreendimentos/${id}/unidades/nova`}>
            <Button variant="primary">+ Nova Unidade</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card className="stat-card-dash">
          <div className="stat-header">
            <span className="stat-icon-dash">🏠</span>
            <span className="stat-trend up">+12%</span>
          </div>
          <div className="stat-value-dash">{stats.totalUnidades}</div>
          <div className="stat-label-dash">Total de Unidades</div>
        </Card>

        <Card className="stat-card-dash stat-success-bg">
          <div className="stat-header">
            <span className="stat-icon-dash">✅</span>
          </div>
          <div className="stat-value-dash">{stats.disponiveis}</div>
          <div className="stat-label-dash">Disponíveis</div>
        </Card>

        <Card className="stat-card-dash stat-warning-bg">
          <div className="stat-header">
            <span className="stat-icon-dash">⏳</span>
          </div>
          <div className="stat-value-dash">{stats.reservadas}</div>
          <div className="stat-label-dash">Reservadas</div>
        </Card>

        <Card className="stat-card-dash stat-primary-bg">
          <div className="stat-header">
            <span className="stat-icon-dash">💰</span>
          </div>
          <div className="stat-value-dash">{stats.vendidas}</div>
          <div className="stat-label-dash">Vendidas</div>
        </Card>

        <Card className="stat-card-dash stat-info-bg">
          <div className="stat-header">
            <span className="stat-icon-dash">💵</span>
          </div>
          <div className="stat-value-dash">{formatCurrency(stats.valorTotal)}</div>
          <div className="stat-label-dash">Valor Total</div>
        </Card>

        <Card className="stat-card-dash">
          <div className="stat-header">
            <span className="stat-icon-dash">📄</span>
          </div>
          <div className="stat-value-dash">{stats.propostasAbertas}</div>
          <div className="stat-label-dash">Propostas Abertas</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'visao-geral' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('visao-geral')}
        >
          📊 Visão Geral
        </button>
        <button
          className={`tab ${activeTab === 'unidades' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('unidades')}
        >
          🏠 Unidades ({unidades.length})
        </button>
        <button
          className={`tab ${activeTab === 'propostas' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('propostas')}
        >
          📄 Propostas ({propostas.length})
        </button>
        <button
          className={`tab ${activeTab === 'visitas' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('visitas')}
        >
          ▣ Visitas
        </button>
        <button
          className={`tab ${activeTab === 'marketing' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          ◘ Marketing
        </button>
        <button
          className={`tab ${activeTab === 'gerador' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('gerador')}
        >
          💰 Gerador de Propostas
        </button>
        <button
          className={`tab ${activeTab === 'mapa' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mapa')}
        >
          🗺️ Mapa de Disponibilidade
        </button>
      </div>

      {/* Content */}
      {activeTab === 'visao-geral' && (
        <Card>
          <div className="visao-geral-content">
            <h3>Informações do Empreendimento</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Bairro:</strong> {empreendimento.bairro}
              </div>
              <div className="info-item">
                <strong>Cidade:</strong> {empreendimento.cidade} - {empreendimento.estado}
              </div>
              <div className="info-item">
                <strong>Tipo de Unidade:</strong> {empreendimento.tipoUnidade}
              </div>
              <div className="info-item">
                <strong>Quantidade de Unidades:</strong> {empreendimento.quantidadeUnidades}
              </div>
            </div>
            {empreendimento.dataLancamento && (
              <p className="info-item">
                <strong>Data de Lançamento:</strong> {new Date(empreendimento.dataLancamento).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'visitas' && (
        <VisitasList empreendimentoId={id} />
      )}

      {activeTab === 'marketing' && (
        <MarketingList empreendimentoId={id} />
      )}

      {activeTab === 'gerador' && (
        <Card>
          <div className="gerador-content">
            <h3>Gerador de Propostas</h3>
            <p>Selecione uma unidade para gerar uma proposta comercial automaticamente:</p>
            <div className="unidades-gerador">
              {unidades.filter(u => u.status === 'disponivel').map(unidade => (
                <Card key={unidade.id} hover className="unidade-gerador-card">
                  <div className="unidade-gerador-info">
                    <h4>{unidade.numero}</h4>
                    <p>Tipo: {unidade.tipo || empreendimento.tipoUnidade}</p>
                    <p>Valor: {formatCurrency(unidade.valorTotal)}</p>
                  </div>
                  <Link to={`/dashboard/propostas/nova?empreendimentoId=${id}&unidadeId=${unidade.id}`}>
                    <Button variant="primary" size="sm">Gerar Proposta</Button>
                  </Link>
                </Card>
              ))}
              {unidades.filter(u => u.status === 'disponivel').length === 0 && (
                <p>Não há unidades disponíveis para gerar propostas.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'unidades' && (
        <Card>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identificação</th>
                  <th>Tipo</th>
                  <th>Área (m²)</th>
                  <th>Valor Base</th>
                  <th>Juros</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(unidade => (
                  <tr key={unidade.id} className={unidade.status === 'vendido' ? 'row-vendido' : ''}>
                    <td>
                      <strong>{unidade.identificacao}</strong>
                    </td>
                    <td className="capitalize">{unidade.tipo}</td>
                    <td>{unidade.area}</td>
                    <td>{formatCurrency(unidade.valorBase)}</td>
                    <td>{formatCurrency(unidade.juros || 0)}</td>
                    <td>
                      <strong>{formatCurrency(unidade.valorTotal)}</strong>
                    </td>
                    <td>
                      <span 
                        className="status-pill"
                        style={{ background: statusColors[unidade.status] }}
                      >
                        {unidade.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/dashboard/empreendimentos/${id}/unidades/${unidade.id}/editar`}>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {unidades.length === 0 && (
              <div className="empty-table">
                <p>Nenhuma unidade cadastrada</p>
                <Link to={`/dashboard/empreendimentos/${id}/unidades/nova`}>
                  <Button variant="primary">Adicionar Primeira Unidade</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'propostas' && (
        <Card>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Unidade</th>
                  <th>Valor</th>
                  <th>Forma Pagamento</th>
                  <th>Status</th>
                  <th>Corretor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {propostas.map(proposta => (
                  <tr key={proposta.id}>
                    <td>
                      <strong>{proposta.clienteNome}</strong>
                      <div className="table-subtitle">{proposta.clienteEmail}</div>
                    </td>
                    <td>{proposta.unidade?.identificacao}</td>
                    <td>
                      <strong>{formatCurrency(proposta.valorProposta)}</strong>
                    </td>
                    <td className="capitalize">{proposta.formaPagamento}</td>
                    <td>
                      <span className={`status-pill status-${proposta.status}`}>
                        {proposta.status}
                      </span>
                    </td>
                    <td>{proposta.corretor?.name}</td>
                    <td>
                      <Link to={`/dashboard/propostas/${proposta.id}`}>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {propostas.length === 0 && (
              <div className="empty-table">
                <p>Nenhuma proposta registrada</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'mapa' && (
        <MapaDisponibilidade
          unidades={unidades}
          empreendimentoNome={empreendimento.nome}
        />
      )}
    </div>
  )
}
