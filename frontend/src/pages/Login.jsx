import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import Logo from '../components/shared/Logo'
import api from '../services/api'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 6

  function getEmailError() {
    if (!touched.email || !email) return ''
    if (!emailValid) return 'Formato de e-mail inválido'
    return ''
  }

  function getPasswordError() {
    if (!touched.password || !password) return ''
    if (!passwordValid) return 'Mínimo 6 caracteres'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setTouched({ email: true, password: true })

    if (!emailValid || !passwordValid) return

    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user))
      if (response.data.user.imobiliariaId) sessionStorage.setItem('activeImobiliariaId', String(response.data.user.imobiliariaId))
      setUser(response.data.user)

      if (response.data.user.role === 'super_admin') {
        navigate('/super/imobiliarias')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Credenciais inválidas. Verifique e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Logo size={72} />
          <h1 className="login-title">Gestor Pro 360</h1>
          <p className="login-subtitle">Plataforma de Gestão Imobiliária</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${getEmailError() ? 'form-input-error' : ''} ${touched.email && emailValid ? 'form-input-valid' : ''}`}
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              autoComplete="email"
              required
            />
            {getEmailError() && <span className="field-error">{getEmailError()}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className={`form-input ${getPasswordError() ? 'form-input-error' : ''} ${touched.password && passwordValid ? 'form-input-valid' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              autoComplete="current-password"
              required
            />
            {getPasswordError() && <span className="field-error">{getPasswordError()}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="login-button-loading">
                <span className="login-spinner"></span>
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-register">
            Ainda não tem conta?{' '}
            <Link to="/register-imobiliaria" className="login-register-link">
              Cadastre sua imobiliária
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
