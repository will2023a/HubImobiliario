import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Badge, Table, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'

const categoriaLabels = {
  boas_vindas: 'Boas-vindas', follow_up: 'Follow-up', agendamento: 'Agendamento',
  proposta: 'Proposta', documentacao: 'Documentação', outro: 'Outro'
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', categoria: 'boas_vindas', conteudo: '', canal: 'todos' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    try {
      const res = await api.get('/templates')
      setTemplates(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.nome || !form.conteudo) return
    setSaving(true)
    try {
      await api.post('/templates', form)
      setShowModal(false)
      setForm({ nome: '', categoria: 'boas_vindas', conteudo: '', canal: 'todos' })
      loadTemplates()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este template?')) return
    try {
      await api.delete(`/templates/${id}`)
      loadTemplates()
    } catch (err) { console.error(err) }
  }

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'categoria', label: 'Categoria', render: val => <Badge variant="primary" size="sm">{categoriaLabels[val] || val}</Badge> },
    { key: 'canal', label: 'Canal', render: val => <Badge variant="default" size="sm">{val}</Badge> },
    { key: 'conteudo', label: 'Preview', render: val => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{val?.slice(0, 60)}...</span> },
    { key: 'id', label: 'Ações', render: (val) => (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(val) }}>🗑️</Button>
    )}
  ]

  if (loading) return <Spinner fullPage label="Carregando templates..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Templates de Mensagens</h2>
          <p className="leads-subtitle">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Template</Button>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Use variáveis: <code>{'{{nome_lead}}'}</code>, <code>{'{{telefone}}'}</code>, <code>{'{{corretor}}'}</code>, <code>{'{{email}}'}</code>
      </p>

      {templates.length === 0 ? (
        <EmptyState icon="📝" title="Nenhum template" description="Crie templates para respostas rápidas no Inbox." action={<Button onClick={() => setShowModal(true)}>Criar Template</Button>} />
      ) : (
        <Table columns={columns} data={templates} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Template" size="md">
        <form onSubmit={handleCreate}>
          <Input label="Nome *" placeholder="Ex: Boas-vindas WhatsApp" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} fullWidth />
          <Select label="Categoria" value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))} fullWidth>
            {Object.entries(categoriaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Canal" value={form.canal} onChange={e => setForm(f => ({...f, canal: e.target.value}))} fullWidth>
            <option value="todos">Todos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
          </Select>
          <Textarea label="Conteúdo *" placeholder="Olá {{nome_lead}}, tudo bem? Sou {{corretor}}..." value={form.conteudo} onChange={e => setForm(f => ({...f, conteudo: e.target.value}))} fullWidth />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar Template</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
