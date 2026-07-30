import React, { useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Input } from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Avatar, Badge } from '../components/ui'
import api from '../services/api'
import './Perfil.css'

const roleLabels = {
  super_admin: 'Super Admin',
  admin_imobiliaria: 'Administrador',
  diretor: 'Diretor',
  gerente: 'Gerente',
  corretor: 'Corretor',
}

export default function Perfil() {
  const { user, setUser } = useContext(AuthContext)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    setMessage('')
    try {
      const res = await api.put(`/users/${user.id}`, { name: form.name })
      const updatedUser = { ...user, name: form.name }
      setUser(updatedUser)
      sessionStorage.setItem('user', JSON.stringify(updatedUser))
      setMessage('Perfil atualizado com sucesso!')
    } catch (err) {
      setMessage('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('Nova senha deve ter no mínimo 6 caracteres')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordMessage('Senhas não coincidem')
      return
    }
    setPasswordLoading(true)
    setPasswordMessage('')
    try {
      await api.put(`/users/${user.id}`, { password: passwordForm.newPassword })
      setPasswordForm({ current: '', newPassword: '', confirm: '' })
      setPasswordMessage('Senha alterada com sucesso!')
    } catch (err) {
      setPasswordMessage('Erro ao alterar senha')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="perfil-page">
      <div className="perfil-header-card">
        <Card>
          <div className="perfil-info">
            <Avatar name={user?.name} size="xl" />
            <div className="perfil-details">
              <h2 className="perfil-name">{user?.name}</h2>
              <p className="perfil-email">{user?.email}</p>
              <Badge variant="primary" size="md">{roleLabels[user?.role] || user?.role}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="perfil-forms">
        <Card title="Dados Pessoais" subtitle="Atualize seu nome">
          <form onSubmit={handleUpdateProfile}>
            <Input
              label="Nome"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <Input
              label="E-mail"
              value={form.email}
              disabled
              fullWidth
            />
            {message && (
              <p className={`perfil-msg ${message.includes('sucesso') ? 'msg-success' : 'msg-error'}`}>
                {message}
              </p>
            )}
            <Button type="submit" loading={loading}>Salvar Alterações</Button>
          </form>
        </Card>

        <Card title="Alterar Senha" subtitle="Use uma senha forte">
          <form onSubmit={handleChangePassword}>
            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
              fullWidth
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita a nova senha"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              fullWidth
            />
            {passwordMessage && (
              <p className={`perfil-msg ${passwordMessage.includes('sucesso') ? 'msg-success' : 'msg-error'}`}>
                {passwordMessage}
              </p>
            )}
            <Button type="submit" loading={passwordLoading}>Alterar Senha</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
