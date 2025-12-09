import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import api from '../services/api'
import './Login.css'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      
  // store token and user in sessionStorage (cleared when browser/tab is closed)
  sessionStorage.setItem('token', response.data.token)
  sessionStorage.setItem('user', JSON.stringify(response.data.user))

  setUser(response.data.user)
      navigate('/dashboard')
    } catch (err) {
      console.error('Erro no login:', err)
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-icon">🏢</div>
          <h1 className="login-title">CRM Imobiliário</h1>
          <p className="login-subtitle">Sistema de Gestão Premium</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input 
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="credentials-label">Credenciais de teste:</p>
          <p className="credentials-value">admin@imob1.com / 123456</p>
        </div>
      </div>
    </div>
  )
}

