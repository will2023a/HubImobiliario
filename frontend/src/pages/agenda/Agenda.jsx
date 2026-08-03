import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Badge, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import './Agenda.css'

const tipoColors = { visita: '#10b981', tarefa: '#f59e0b', evento: '#3b82f6', lembrete: '#8b5cf6' }

export default function Agenda() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState('semana') // dia, semana, mes
  const [currentDate, setCurrentDate] = useState(new Date())
  const [form, setForm] = useState({ titulo: '', tipo: 'evento', dataInicio: '', dataFim: '', descricao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEvents() }, [currentDate, viewMode])

  async function loadEvents() {
    try {
      const start = getStartOfView()
      const end = getEndOfView()
      const res = await api.get(`/agenda/events?start=${start.toISOString()}&end=${end.toISOString()}`)
      setEvents(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function getStartOfView() {
    const d = new Date(currentDate)
    if (viewMode === 'dia') { d.setHours(0, 0, 0, 0); return d }
    if (viewMode === 'semana') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d }
    d.setDate(1); d.setHours(0, 0, 0, 0); return d
  }

  function getEndOfView() {
    const d = new Date(currentDate)
    if (viewMode === 'dia') { d.setHours(23, 59, 59, 999); return d }
    if (viewMode === 'semana') { d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(23, 59, 59, 999); return d }
    d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d
  }

  function navigateDate(dir) {
    const d = new Date(currentDate)
    if (viewMode === 'dia') d.setDate(d.getDate() + dir)
    else if (viewMode === 'semana') d.setDate(d.getDate() + (7 * dir))
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.titulo || !form.dataInicio) return
    setSaving(true)
    try {
      await api.post('/agenda/events', form)
      setShowModal(false)
      setForm({ titulo: '', tipo: 'evento', dataInicio: '', dataFim: '', descricao: '' })
      loadEvents()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este evento?')) return
    try { await api.delete(`/agenda/events/${id}`); loadEvents() }
    catch (err) { console.error(err) }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const formatTime = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const headerLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) return <Spinner fullPage label="Carregando agenda..." />

  return (
    <div className="agenda-page">
      <div className="agenda-header">
        <div>
          <h2 className="agenda-title">Agenda</h2>
          <p className="agenda-subtitle">{events.length} evento{events.length !== 1 ? 's' : ''} neste período</p>
        </div>
        <div className="agenda-controls">
          <div className="agenda-nav">
            <button className="agenda-nav-btn" onClick={() => navigateDate(-1)}>‹</button>
            <span className="agenda-nav-label">{headerLabel}</span>
            <button className="agenda-nav-btn" onClick={() => navigateDate(1)}>›</button>
          </div>
          <div className="agenda-view-toggle">
            {['dia', 'semana', 'mes'].map(v => (
              <button key={v} className={`agenda-view-btn ${viewMode === v ? 'active' : ''}`} onClick={() => setViewMode(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>+ Novo Evento</Button>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState icon="📅" title="Nenhum evento" description="Sua agenda está livre neste período." action={<Button onClick={() => setShowModal(true)}>Criar Evento</Button>} />
      ) : (
        <div className="agenda-events-list">
          {events.map(event => (
            <div key={event.id} className="agenda-event-card" style={{ borderLeftColor: tipoColors[event.tipo] || '#666' }}>
              <div className="agenda-event-time">
                <span className="event-date">{formatDate(event.dataInicio)}</span>
                <span className="event-time">{formatTime(event.dataInicio)}</span>
              </div>
              <div className="agenda-event-info">
                <strong>{event.titulo}</strong>
                {event.descricao && <p>{event.descricao}</p>}
                <div className="agenda-event-tags">
                  <Badge variant="default" size="sm">{event.tipo}</Badge>
                  {event.lead && <Badge variant="primary" size="sm">{event.lead.nome}</Badge>}
                  {event.user && <span className="event-user">{event.user.name}</span>}
                </div>
              </div>
              <button className="agenda-event-delete" onClick={() => handleDelete(event.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Evento" size="md">
        <form onSubmit={handleCreate}>
          <Input label="Título *" placeholder="Ex: Visita ao empreendimento" value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))} fullWidth />
          <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))} fullWidth>
            <option value="visita">Visita</option>
            <option value="tarefa">Tarefa</option>
            <option value="evento">Evento</option>
            <option value="lembrete">Lembrete</option>
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Início *" type="datetime-local" value={form.dataInicio} onChange={e => setForm(f => ({...f, dataInicio: e.target.value}))} fullWidth />
            <Input label="Fim" type="datetime-local" value={form.dataFim} onChange={e => setForm(f => ({...f, dataFim: e.target.value}))} fullWidth />
          </div>
          <Textarea label="Descrição" placeholder="Detalhes do evento..." value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} fullWidth />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
