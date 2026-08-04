import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Badge, Table, Pagination, Spinner, EmptyState } from '../../components/ui'
import DateRangeFilter from '../../components/shared/DateRangeFilter'

const acaoColors = { login: 'info', criar: 'success', editar: 'warning', deletar: 'error', aprovar: 'success', rejeitar: 'error' }

export default function Auditoria() {
  const [data, setData] = useState({ logs: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterAcao, setFilterAcao] = useState('')
  const [filterRecurso, setFilterRecurso] = useState('')
  const limit = 20

  useEffect(() => { load() }, [page, filterAcao, filterRecurso])

  async function load() {
    setLoading(true)
    try {
      let params = `?page=${page}&limit=${limit}`
      if (filterAcao) params += `&acao=${filterAcao}`
      if (filterRecurso) params += `&recurso=${filterRecurso}`
      const res = await api.get(`/audit${params}`)
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const columns = [
    { key: 'createdAt', label: 'Data', sortable: true, render: val => new Date(val).toLocaleString('pt-BR') },
    { key: 'user', label: 'Usuário', render: val => val?.name || '-' },
    { key: 'acao', label: 'Ação', render: val => <Badge variant={acaoColors[val] || 'default'} size="sm">{val}</Badge> },
    { key: 'recurso', label: 'Recurso', render: val => <Badge variant="default" size="sm">{val}</Badge> },
    { key: 'recursoId', label: 'ID', render: val => val || '-' },
    { key: 'ip', label: 'IP', render: val => <span style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{val || '-'}</span> },
  ]

  if (loading && data.logs.length === 0) return <Spinner fullPage label="Carregando logs..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Auditoria</h2>
          <p className="leads-subtitle">{data.total} registros de atividade</p>
        </div>
      </div>

      <div className="leads-filters" style={{ marginBottom: '1.25rem' }}>
        <select className="leads-filter-select" value={filterAcao} onChange={e => { setFilterAcao(e.target.value); setPage(1) }}>
          <option value="">Todas as ações</option>
          <option value="login">Login</option>
          <option value="criar">Criar</option>
          <option value="editar">Editar</option>
          <option value="deletar">Deletar</option>
          <option value="aprovar">Aprovar</option>
          <option value="rejeitar">Rejeitar</option>
        </select>
        <select className="leads-filter-select" value={filterRecurso} onChange={e => { setFilterRecurso(e.target.value); setPage(1) }}>
          <option value="">Todos os recursos</option>
          <option value="lead">Lead</option>
          <option value="proposta">Proposta</option>
          <option value="empreendimento">Empreendimento</option>
          <option value="usuario">Usuário</option>
          <option value="unidade">Unidade</option>
          <option value="permissao">Permissão</option>
        </select>
      </div>

      {data.logs.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum log registrado" description="As atividades do sistema aparecerão aqui." />
      ) : (
        <>
          <Table columns={columns} data={data.logs} />
          <Pagination currentPage={page} totalPages={Math.ceil(data.total / limit)} totalItems={data.total} itemsPerPage={limit} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
