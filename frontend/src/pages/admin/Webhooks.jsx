import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Badge, Table, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

const eventOptions = ['lead.criado', 'lead.atualizado', 'proposta.criada', 'proposta.aprovada', 'proposta.rejeitada', 'unidade.vendida', 'mensagem.recebida']

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ url: '', eventos: [] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/webhooks-config')
      setWebhooks(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.url || form.eventos.length === 0) return
    setSaving(true)
    try {
      await api.post('/webhooks-config', form)
      setShowModal(false)
      setForm({ url: '', eventos: [] })
      load()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleToggle(id, currentStatus) {
    try { await api.put(`/webhooks-config/${id}`, { ativo: !currentStatus }); load() }
    catch (err) { console.error(err) }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este webhook?')) return
    try { await api.delete(`/webhooks-config/${id}`); load() }
    catch (err) { console.error(err) }
  }

  function toggleEvent(event) {
    setForm(f => ({
      ...f,
      eventos: f.eventos.includes(event) ? f.eventos.filter(e => e !== event) : [...f.eventos, event]
    }))
  }

  const columns = [
    { key: 'url', label: 'URL', render: val => <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{val}</span> },
    { key: 'eventos', label: 'Eventos', render: val => <span style={{ fontSize: '0.7rem' }}>{(val || []).length} evento{(val || []).length !== 1 ? 's' : ''}</span> },
    { key: 'ativo', label: 'Status', render: val => <Badge variant={val ? 'success' : 'default'} size="sm">{val ? 'Ativo' : 'Inativo'}</Badge> },
    { key: '_count', label: 'Entregas', render: val => val?.deliveries || 0 },
    { key: 'id', label: 'Ações', render: (val, row) => (
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleToggle(val, row.ativo) }}>{row.ativo ? '⏸' : '▶'}</Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(val) }}>Excluir</Button>
      </div>
    )}
  ]

  if (loading) return <Spinner fullPage label="Carregando webhooks..." />

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="leads-header">
        <div>
          <h2 className="leads-title">Webhooks</h2>
          <p className="leads-subtitle">Integre com sistemas externos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Webhook</Button>
      </div>

      {webhooks.length === 0 ? (
        <EmptyState icon="🔗" title="Nenhum webhook" description="Configure webhooks para receber eventos em sistemas externos." action={<Button onClick={() => setShowModal(true)}>Criar Webhook</Button>} />
      ) : (
        <Table columns={columns} data={webhooks} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Webhook" size="md">
        <form onSubmit={handleCreate}>
          <Input label="URL *" placeholder="https://seu-sistema.com/webhook" value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} fullWidth />
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Eventos *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {eventOptions.map(ev => (
                <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                  style={{
                    padding: '0.375rem 0.625rem', fontSize: '0.75rem', border: '1px solid', borderRadius: '9999px', cursor: 'pointer',
                    background: form.eventos.includes(ev) ? 'var(--gold)' : 'transparent',
                    borderColor: form.eventos.includes(ev) ? 'var(--gold)' : 'var(--border-color)',
                    color: form.eventos.includes(ev) ? 'var(--dark)' : 'var(--text-secondary)',
                    fontWeight: form.eventos.includes(ev) ? 600 : 400,
                  }}
                >{ev}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving} disabled={!form.url || form.eventos.length === 0}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
