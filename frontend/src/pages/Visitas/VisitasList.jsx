import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import './VisitasList.css'
import AppIcon from '../../components/ui/AppIcon'

export default function VisitasList({ empreendimentoId }) {
  const [searchParams] = useSearchParams()
  const empId = empreendimentoId || searchParams.get('empreendimentoId')
  
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadVisitas()
  }, [empId])

  const loadVisitas = async () => {
    try {
      setLoading(true)
      const url = empId ? `/visitas?empreendimentoId=${empId}` : '/visitas'
      const response = await api.get(url)
      setVisitas(response.data)
    } catch (error) {
      console.error('Erro ao carregar visitas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVisitas = visitas.filter(visita => {
    const matchSearch = visita.nomeVisitante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       visita.unidade?.numero?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filterTipo === 'todos' || visita.tipo === filterTipo
    return matchSearch && matchTipo
  })

  const tipoConfig = {
    agendada: { label: 'Agendada' },
    espontanea: { label: 'Espontânea' }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Visitante', 'Telefone', 'Email', 'Tipo', 'Empreendimento', 'Unidade', 'Imobiliária', 'Atendente', 'Observações']
    const rows = filteredVisitas.map(v => [
      formatDate(v.dataVisita),
      v.nomeVisitante,
      v.telefoneVisitante,
      v.emailVisitante || '',
      v.tipo,
      v.empreendimento?.nome || '',
      v.unidade ? `${v.unidade.numero}${v.unidade.bloco ? ' - ' + v.unidade.bloco : ''}` : '',
      v.imobiliaria?.nome || '',
      v.atendente?.name || '',
      v.observacoes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `visitas_${empId || 'todas'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const stats = {
    total: visitas.length,
    agendadas: visitas.filter(v => v.tipo === 'agendada').length,
    espontaneas: visitas.filter(v => v.tipo === 'espontanea').length,
    hoje: visitas.filter(v => {
      const hoje = new Date().toDateString()
      return new Date(v.dataVisita).toDateString() === hoje
    }).length
  }

  return (
    <div className="visitas-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitas ao Stand</h1>
          <p className="page-subtitle">Controle de visitantes e agendamentos</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="outline" onClick={exportToCSV}>
            Exportar CSV
          </Button>
          <Link to={empId ? `/dashboard/empreendimentos/${empId}/visitas/nova` : '/dashboard/visitas/nova'}>
            <Button variant="primary">Registrar Visita</Button>
          </Link>
        </div>
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
          <div className="stat-icon"><AppIcon name="calendar" /></div>
          <div className="stat-content">
            <div className="stat-label">Hoje</div>
            <div className="stat-value">{stats.hoje}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="clock" /></div>
          <div className="stat-content">
            <div className="stat-label">Agendadas</div>
            <div className="stat-value">{stats.agendadas}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="pin" /></div>
          <div className="stat-content">
            <div className="stat-label">Espontâneas</div>
            <div className="stat-value">{stats.espontaneas}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por nome ou unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="todos">Todos os Tipos</option>
            <option value="agendada">Agendada</option>
            <option value="espontanea">Espontânea</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando visitas...</p>
          </div>
        ) : filteredVisitas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><AppIcon name="calendar" size={30} /></div>
            <h3>Nenhuma visita registrada</h3>
            <p>Registre a primeira visita ao stand</p>
          </div>
        ) : (
          <div className="visitas-table">
            <table>
              <thead>
                <tr>
                  <th>Visitante</th>
                  <th>Unidade</th>
                  <th>Empreendimento</th>
                  <th>Imobiliária</th>
                  <th>Atendido Por</th>
                  <th>Tipo</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitas.map(visita => (
                  <tr key={visita.id}>
                    <td>
                      <div className="visitor-info">
                        <strong>{visita.nomeVisitante}</strong>
                        <span>{visita.telefoneVisitante}</span>
                      </div>
                    </td>
                    <td>{visita.unidade?.numero || 'N/A'}</td>
                    <td>{visita.empreendimento?.nome || 'N/A'}</td>
                    <td>{visita.imobiliaria?.nome || 'N/A'}</td>
                    <td>{visita.atendente?.name || 'N/A'}</td>
                    <td>
                      <span className="tipo-badge">
                        {tipoConfig[visita.tipo]?.label}
                      </span>
                    </td>
                    <td>{formatDate(visita.dataVisita)}</td>
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
