import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Input, Select } from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function CreateUser() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'corretor' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Nome, e-mail e senha são obrigatórios')
      return
    }
    if (form.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/users', form)
      navigate('/dashboard/users')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card title="Novo Usuário" subtitle="Adicione um membro à equipe">
        <form onSubmit={handleSubmit}>
          <Input label="Nome *" placeholder="Nome completo" value={form.name} onChange={e => handleChange('name', e.target.value)} fullWidth />
          <Input label="E-mail *" placeholder="email@exemplo.com" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} fullWidth />
          <Input label="Senha *" placeholder="Mínimo 6 caracteres" type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} fullWidth />
          <Select label="Função" value={form.role} onChange={e => handleChange('role', e.target.value)} fullWidth>
            <option value="diretor">Diretor</option>
            <option value="gerente">Gerente</option>
            <option value="corretor">Corretor</option>
          </Select>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => navigate('/dashboard/users')}>Cancelar</Button>
            <Button type="submit" loading={loading}>Criar Usuário</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
