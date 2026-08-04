import React, { useEffect, useState, useContext } from 'react'
import api from '../../services/api'
import { Badge, Table, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import KPICard from '../../components/shared/KPICard'
import { AuthContext } from '../../contexts/AuthContext'
import DateRangeFilter from '../../components/shared/DateRangeFilter'

export default function Comissoes() {
  const { user } = useContext(AuthContext)
  const [data, setData] = useState({ comissoes: [], totais: {} })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadComissoes() }, [])

  async function loadComissoes() {
    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await api.get(`/comissoes${params}`)
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handlePagar(id) {
    if (!confirm('Confirmar pagamento desta comissão?')) return
    try {
      await api.put(`/comissoes/${id}/pagar`)
      loadComissoes()
    } catch (err) { console.error(err) }
  }

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const isAdmin = ['super_admin', 'admin_imobiliaria'].includes(user?.role)

  const columns = [
    { key: 'user', label: 'Corretor', render: (val) => val?.name || '-' },
    { key: 'role', label: 'Função', render: (val) => <Badge variant="default" size="sm">{val}</Badge> },
    { key: 'proposta', label: 'Cliente', render: (val) => val ? `${val.clienteNome} ${val.clienteSobrenome || ''}` : '-' },
    { key: 'valorVenda', label: 'Valor Venda', sortable: true, render: (val) => formatCurrency(val) },
    { key: 'percentual', label: '%', render: (val) => `${val}%` },
    { key: 'valorComissao', label: 'Comissão', sortable: true, render: (val) => <strong>{formatCurrency(val)}</strong> },
    { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'paga' ? 'success' : 'warning'} size="sm">{val}</Badge> },
    ...(isAdmin ? [{
      key: 'id', label: 'Ação', render: (val, row) => row.status === 'pendente' ? (
        <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handlePagar(val) }}>Pagar</Button>
      ) : <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Pago</span>
    }] : [])
  ]

  if (loading) return <Spinner fullPage label="Carregando comissões..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Comissões</h2>
          <p className="leads-subtitle">{data.totais.total || 0} registros</p>
        </div>
      </div>

      <div className="dashboard-kpis" style={{ marginBottom: '1.5rem' }}>
        <KPICard icon="money" title="Total Vendas" value={formatCurrency(data.totais.valorVendas)} />
        <KPICard icon="money" title="Total Comissões" value={formatCurrency(data.totais.valorComissoes)} />
        <KPICard icon="clock" title="Pendentes" value={formatCurrency(data.totais.pendentes)} variant="warning" />
      </div>

      <div className="leads-filters" style={{ marginBottom: '1.25rem' }}>
        <select className="leads-filter-select" value={filter} onChange={e => { setFilter(e.target.value); setTimeout(loadComissoes, 0) }}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="paga">Paga</option>
        </select>
      </div>

      {data.comissoes.length === 0 ? (
        <EmptyState icon="💰" title="Nenhuma comissão" description="Comissões são geradas automaticamente quando propostas são aprovadas." />
      ) : (
        <Table columns={columns} data={data.comissoes} />
      )}
    </div>
  )
}
