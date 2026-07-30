import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Input, Select } from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function CreateLead() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', origem: 'whatsapp', status: 'novo' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome || !form.telefone) {
      setError('Nome e telefone são obrigatórios')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/leads', form)
      navigate('/dashboard/leads')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="Novo Lead" subtitle="Cadastre um novo contato">
        <form onSubmit={handleSubmit}>
          <Input
            label="Nome *"
            placeholder="Nome completo"
            value={form.nome}
            onChange={e => handleChange('nome', e.target.value)}
            fullWidth
          />
          <Input
            label="Telefone *"
            placeholder="(11) 99999-9999"
            value={form.telefone}
            onChange={e => handleChange('telefone', e.target.value)}
            fullWidth
          />
          <Input
            label="E-mail"
            placeholder="email@exemplo.com"
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            fullWidth
          />
          <Select
            label="Origem"
            value={form.origem}
            onChange={e => handleChange('origem', e.target.value)}
            fullWidth
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="site">Site</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="indicacao">Indicação</option>
            <option value="portais">Portais</option>
            <option value="manual">Manual</option>
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={e => handleChange('status', e.target.value)}
            fullWidth
          >
            <option value="novo">Novo</option>
            <option value="em_contato">Em contato</option>
            <option value="qualificado">Qualificado</option>
          </Select>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => navigate('/dashboard/leads')}>Cancelar</Button>
            <Button type="submit" loading={loading}>Salvar Lead</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
