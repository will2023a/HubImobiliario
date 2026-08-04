import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Badge, Spinner } from '../components/ui'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Textarea } from '../components/ui/Input'
import './LeadDetail.css'

const statusColors = {
  novo: 'info', em_contato: 'primary', qualificado: 'warning',
  proposta: 'primary', fechado: 'success', perdido: 'error',
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [atendimentos, setAtendimentos] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadLead()
  }, [id])

  async function loadLead() {
    try {
      const res = await api.get(`/leads/${id}`)
      setLead(res.data)
      setAtendimentos(res.data.atendimentos || [])
    } catch (err) {
      console.error('Erro ao carregar lead:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addAtendimento(e) {
    e.preventDefault()
    if (!mensagem.trim()) return
    setSending(true)
    try {
      await api.post('/atendimentos', { leadId: Number(id), mensagem })
      setMensagem('')
      loadLead()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Spinner fullPage label="Carregando lead..." />
  if (!lead) return <div>Lead não encontrado</div>

  return (
    <div className="lead-detail">
      <div className="lead-detail-header">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/leads')}>
          ← Voltar
        </Button>
      </div>

      <div className="lead-detail-grid">
        <div className="lead-detail-main">
          <Card>
            <div className="lead-info-header">
              <div>
                <h2 className="lead-name">{lead.nome}</h2>
                <div className="lead-contact">
                  {lead.telefone && <span>Telefone: {lead.telefone}</span>}
                  {lead.email && <span>E-mail: {lead.email}</span>}
                </div>
              </div>
              <Badge variant={statusColors[lead.status] || 'default'} size="lg">
                {lead.status}
              </Badge>
            </div>

            <div className="lead-meta">
              <div className="lead-meta-item">
                <span className="meta-label">Origem</span>
                <span className="meta-value">{lead.origem}</span>
              </div>
              <div className="lead-meta-item">
                <span className="meta-label">Criado em</span>
                <span className="meta-value">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {lead.corretor && (
                <div className="lead-meta-item">
                  <span className="meta-label">Corretor</span>
                  <span className="meta-value">{lead.corretor.name}</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Timeline" subtitle="Histórico de interações">
            {atendimentos.length === 0 ? (
              <p className="timeline-empty">Nenhuma interação registrada.</p>
            ) : (
              <div className="timeline">
                {atendimentos.map(a => (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="timeline-msg">{a.mensagem}</p>
                      <span className="timeline-meta">
                        {a.corretor?.name || 'Sistema'} • {new Date(a.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className="timeline-form" onSubmit={addAtendimento}>
              <Textarea
                placeholder="Adicionar nota ou atendimento..."
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                fullWidth
              />
              <Button type="submit" size="sm" loading={sending} disabled={!mensagem.trim()}>
                Enviar
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
