import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Badge, Table, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'

const tipoLabels = { follow_up: 'Follow-up', ligacao: 'Ligação', visita: 'Visita', documentacao: 'Documentação', outro: 'Outro' }
const prioridadeColors = { baixa: 'default', media: 'warning', alta: 'error' }
const statusColors = { pendente: 'warning', concluida: 'success', atrasada: 'error' }

export default function Tarefas() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titulo: '', tipo: 'follow_up', prioridade: 'media', prazo: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data.tasks || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.titulo || !form.prazo) return
    setSaving(true)
    try {
      await api.post('/tasks', form)
      setShowModal(false)
      setForm({ titulo: '', tipo: 'follow_up', prioridade: 'media', prazo: '' })
      loadTasks()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function completeTask(id) {
    try {
      await api.put(`/tasks/${id}/complete`)
      loadTasks()
    } catch (err) { console.error(err) }
  }

  const filtered = tasks.filter(t => !filter || t.status === filter)

  const columns = [
    { key: 'titulo', label: 'Tarefa', sortable: true },
    { key: 'tipo', label: 'Tipo', render: val => <Badge variant="default" size="sm">{tipoLabels[val] || val}</Badge> },
    { key: 'prioridade', label: 'Prioridade', render: val => <Badge variant={prioridadeColors[val]} size="sm">{val}</Badge> },
    { key: 'prazo', label: 'Prazo', sortable: true, render: val => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'status', label: 'Status', render: val => <Badge variant={statusColors[val]} size="sm">{val}</Badge> },
    { key: 'id', label: 'Ação', render: (val, row) => row.status !== 'concluida' ? (
      <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); completeTask(val) }}>✓</Button>
    ) : <span style={{ color: 'var(--success)' }}>✓ Feita</span>}
  ]

  if (loading) return <Spinner fullPage label="Carregando tarefas..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Tarefas</h2>
          <p className="leads-subtitle">{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Nova Tarefa</Button>
      </div>

      <div className="leads-filters">
        <select className="leads-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="concluida">Concluída</option>
          <option value="atrasada">Atrasada</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✓" title="Nenhuma tarefa" description="Crie tarefas para organizar seu trabalho." action={<Button onClick={() => setShowModal(true)}>Criar Tarefa</Button>} />
      ) : (
        <Table columns={columns} data={filtered} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Tarefa" size="md">
        <form onSubmit={handleCreate}>
          <Input label="Título *" value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))} fullWidth placeholder="Ex: Ligar para cliente" />
          <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))} fullWidth>
            <option value="follow_up">Follow-up</option>
            <option value="ligacao">Ligação</option>
            <option value="visita">Visita</option>
            <option value="documentacao">Documentação</option>
            <option value="outro">Outro</option>
          </Select>
          <Select label="Prioridade" value={form.prioridade} onChange={e => setForm(f => ({...f, prioridade: e.target.value}))} fullWidth>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </Select>
          <Input label="Prazo *" type="datetime-local" value={form.prazo} onChange={e => setForm(f => ({...f, prazo: e.target.value}))} fullWidth />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
