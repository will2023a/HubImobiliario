import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { Input } from '../components/ui/Input'
import MaskedInput from '../components/ui/MaskedInput'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Logo from '../components/shared/Logo'
import { unmask } from '../utils/masks'
import './Login.css'

export default function RegisterImobiliaria() {
  const [form, setForm] = useState({ nome: '', cnpj: '', email: '', telefone: '', nomeAdmin: '', emailAdmin: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nome || !form.cnpj || !form.email || !form.telefone) {
      setError('Todos os campos da empresa são obrigatórios')
      return
    }

    if (unmask(form.cnpj).length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    if (unmask(form.telefone).length < 10) {
      setError('Telefone deve ter pelo menos 10 dígitos')
      return
    }

    setLoading(true)
    try {
      await api.post('/imobiliarias', {
        nome: form.nome,
        cnpj: unmask(form.cnpj),
        email: form.email,
        telefone: unmask(form.telefone),
      })
      setSuccess(true)
      setTimeout(() => navigate('/aguardando-aprovacao'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container" style={{ textAlign: 'center' }}>
          <Logo size={60} />
          <h2 style={{ marginTop: '1.5rem', color: '#10b981' }}>✓ Cadastro Enviado!</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>Aguarde a aprovação do administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Logo size={56} />
          <h1 className="login-title" style={{ fontSize: '1.4rem', marginTop: '1rem' }}>Cadastrar Imobiliária</h1>
          <p className="login-subtitle">Registre sua empresa no Gestor Pro 360</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Nome da Empresa *"
            placeholder="Nome da imobiliária"
            value={form.nome}
            onChange={e => handleChange('nome', e.target.value)}
            fullWidth
          />
          <MaskedInput
            mask="cnpj"
            label="CNPJ *"
            value={form.cnpj}
            onChange={e => handleChange('cnpj', e.target.value)}
            fullWidth
          />
          <Input
            label="E-mail *"
            type="email"
            placeholder="contato@imobiliaria.com"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            fullWidth
          />
          <MaskedInput
            mask="phone"
            label="Telefone *"
            value={form.telefone}
            onChange={e => handleChange('telefone', e.target.value)}
            fullWidth
          />

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.5rem 0' }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading} style={{ marginTop: '0.5rem' }}>
            Registrar Imobiliária
          </Button>
        </form>

        <div className="login-footer">
          <p className="login-register">
            Já tem conta?{' '}
            <Link to="/login" className="login-register-link">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
