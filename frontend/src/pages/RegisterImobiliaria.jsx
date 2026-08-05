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
  const [mode, setMode] = useState('agency')
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

    if (!form.nomeAdmin || !form.emailAdmin || !form.senha || !form.cnpj) {
      setError('Preencha os dados do responsável e o CNPJ')
      return
    }
    if (mode === 'agency' && (!form.nome || !form.email || !form.telefone)) {
      setError('Todos os campos da empresa são obrigatórios')
      return
    }

    if (unmask(form.cnpj).length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    if (mode === 'agency' && unmask(form.telefone).length < 10) {
      setError('Telefone deve ter pelo menos 10 dígitos')
      return
    }

    setLoading(true)
    try {
      if (mode === 'agency') {
        await api.post('/imobiliarias', {
          nome: form.nome, cnpj: unmask(form.cnpj), email: form.email,
          telefone: unmask(form.telefone), nomeAdmin: form.nomeAdmin,
          emailAdmin: form.emailAdmin, senha: form.senha
        })
      } else {
        await api.post('/auth/register-request', {
          name: form.nomeAdmin, email: form.emailAdmin, password: form.senha, cnpj: unmask(form.cnpj)
        })
      }
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
          <h1 className="login-title" style={{ fontSize: '1.4rem', marginTop: '1rem' }}>Solicitar cadastro</h1>
          <p className="login-subtitle">O acesso será liberado após aprovação</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <Button type="button" variant={mode === 'agency' ? 'primary' : 'secondary'} onClick={() => setMode('agency')}>Sou uma imobiliária</Button>
          <Button type="button" variant={mode === 'user' ? 'primary' : 'secondary'} onClick={() => setMode('user')}>Quero entrar em uma</Button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'agency' && <><Input
            label="Nome da Empresa *"
            placeholder="Nome da imobiliária"
            value={form.nome}
            onChange={e => handleChange('nome', e.target.value)}
            fullWidth
          />
          <Input label="E-mail comercial *" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} fullWidth />
          <MaskedInput mask="phone" label="Telefone *" value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} fullWidth />
          </>}
          <MaskedInput
            mask="cnpj"
            label="CNPJ *"
            value={form.cnpj}
            onChange={e => handleChange('cnpj', e.target.value)}
            fullWidth
          />
          <Input label="Nome completo do responsável *" value={form.nomeAdmin} onChange={e => handleChange('nomeAdmin', e.target.value)} fullWidth />
          <Input label="E-mail de acesso *" type="email" value={form.emailAdmin} onChange={e => handleChange('emailAdmin', e.target.value)} fullWidth />
          <Input label="Senha *" type="password" value={form.senha} onChange={e => handleChange('senha', e.target.value)} fullWidth />

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.5rem 0' }}>{error}</p>}

          <Button type="submit" fullWidth loading={loading} style={{ marginTop: '0.5rem' }}>
            Enviar solicitação
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
