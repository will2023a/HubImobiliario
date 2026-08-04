import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Badge, Table, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'

const gatilhoLabels = {
  novo_lead: 'Novo Lead', lead_mudou_estagio: 'Lead mudou estágio',
  mensagem_recebida: 'Mensagem recebida', tempo: 'Timer/Agendado', proposta_criada: 'Proposta criada'
}

const statusColors = { rascunho: 'default', ativo: 'success', inativo: 'error' }

export default function AutomacoesList() {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', gatilho: 'novo_lead', descricao: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/automations')
      setAutomations(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.nome) return
    setSaving(true)
    try {
      const res = await api.post('/automations', form)
      setShowModal(false)
      setForm({ nome: '', gatilho: 'novo_lead', descricao: '' })
      navigate(`/dashboard/automacoes/editor/${res.data.id}`)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleToggle(id) {
    try { await api.put(`/automations/${id}/toggle`); load() }
    catch (err) { console.error(err) }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta automação?')) return
    try { await api.delete(`/automations/${id}`); load() }
    catch (err) { console.error(err) }
  }

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'gatilho', label: 'Gatilho', render: val => <Badge variant="primary" size="sm">{gatilhoLabels[val] || val}</Badge> },
    { key: 'status', label: 'Status', render: val => <Badge variant={statusColors[val]} size="sm">{val}</Badge> },
    { key: '_count', label: 'Execuções', render: val => val?.executions || 0 },
    { key: 'id', label: 'Ações', render: (val, row) => (
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/automacoes/editor/${val}`) }}>Editar</Button>
        <Button size="sm" variant={row.status === 'ativo' ? 'warning' : 'success'} onClick={(e) => { e.stopPropagation(); handleToggle(val) }}>
          {row.status === 'ativo' ? 'Pausar' : 'Ativar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(val) }}>🗑️</Button>
      </div>
    )}
  ]

  if (loading) return <Spinner fullPage label="Carregando automações..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Automações</h2>
          <p className="leads-subtitle">{automations.length} fluxo{automations.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Fluxo</Button>
      </div>

      {automations.length === 0 ? (
        <EmptyState icon="⚡" title="Nenhuma automação" description="Crie fluxos para automatizar tarefas repetitivas." action={<Button onClick={() => setShowModal(true)}>Criar Automação</Button>} />
      ) : (
        <Table columns={columns} data={automations} onRowClick={(row) => navigate(`/dashboard/automacoes/editor/${row.id}`)} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Automação" size="md">
        <form onSubmit={handleCreate}>
          <Input label="Nome *" placeholder="Ex: Follow-up 24h" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} fullWidth />
          <Select label="Gatilho" value={form.gatilho} onChange={e => setForm(f => ({...f, gatilho: e.target.value}))} fullWidth>
            {Object.entries(gatilhoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Descrição" placeholder="O que essa automação faz..." value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} fullWidth />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar e Editar Fluxo</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
