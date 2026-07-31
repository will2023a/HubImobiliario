import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Badge, Table, Pagination, Spinner, EmptyState } from '../components/ui'
import Button from '../components/ui/Button'
import DateRangeFilter from '../components/shared/DateRangeFilter'
import './Leads.css'

const statusColors = {
  novo: 'info',
  em_contato: 'primary',
  qualificado: 'warning',
  proposta: 'primary',
  fechado: 'success',
  perdido: 'error',
}

const origemLabels = {
  whatsapp: 'WhatsApp',
  site: 'Site',
  instagram: 'Instagram',
  facebook: 'Facebook',
  indicacao: 'Indicação',
  portais: 'Portais',
  manual: 'Manual',
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [origemFilter, setOrigemFilter] = useState('')
  const [dateFilter, setDateFilter] = useState({ startDate: null, endDate: null })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const navigate = useNavigate()

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    try {
      const res = await api.get('/leads')
      setLeads(Array.isArray(res.data) ? res.data : res.data.leads || [])
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = leads.filter(lead => {
    const matchSearch = !search ||
      lead.nome?.toLowerCase().includes(search.toLowerCase()) ||
      lead.telefone?.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || lead.status === statusFilter
    const matchOrigem = !origemFilter || lead.origem === origemFilter
    const matchDate = (() => {
      if (!dateFilter.startDate && !dateFilter.endDate) return true
      const created = new Date(lead.createdAt)
      if (dateFilter.startDate && created < new Date(dateFilter.startDate)) return false
      if (dateFilter.endDate && created > new Date(dateFilter.endDate + 'T23:59:59')) return false
      return true
    })()
    return matchSearch && matchStatus && matchOrigem && matchDate
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedLeads = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'telefone', label: 'Telefone' },
    { key: 'origem', label: 'Origem', render: (val) => (
      <Badge variant="default" size="sm">{origemLabels[val] || val}</Badge>
    )},
    { key: 'status', label: 'Status', sortable: true, render: (val) => (
      <Badge variant={statusColors[val] || 'default'} size="sm">{val}</Badge>
    )},
    { key: 'createdAt', label: 'Data', sortable: true, render: (val) => (
      val ? new Date(val).toLocaleDateString('pt-BR') : '-'
    )},
  ]

  if (loading) return <Spinner fullPage label="Carregando leads..." />

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Leads</h2>
          <p className="leads-subtitle">{filtered.length} lead{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/create/lead')}>+ Novo Lead</Button>
      </div>

      <div className="leads-filters">
        <input
          className="leads-search"
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <select
          className="leads-filter-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em contato</option>
          <option value="qualificado">Qualificado</option>
          <option value="proposta">Proposta</option>
          <option value="fechado">Fechado</option>
          <option value="perdido">Perdido</option>
        </select>
        <select
          className="leads-filter-select"
          value={origemFilter}
          onChange={e => { setOrigemFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="">Todas as origens</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="site">Site</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="indicacao">Indicação</option>
          <option value="portais">Portais</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <DateRangeFilter
        onFilter={(dates) => { setDateFilter(dates); setCurrentPage(1) }}
        onClear={() => { setDateFilter({ startDate: null, endDate: null }); setCurrentPage(1) }}
        className="leads-date-filter"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="👤"
          title="Nenhum lead encontrado"
          description="Tente ajustar os filtros ou cadastre um novo lead."
          action={<Button onClick={() => navigate('/dashboard/create/lead')}>Cadastrar Lead</Button>}
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedLeads}
            onRowClick={(row) => navigate(`/dashboard/leads/${row.id}`)}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
