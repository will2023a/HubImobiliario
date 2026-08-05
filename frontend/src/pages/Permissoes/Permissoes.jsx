import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import './Permissoes.css'

const pages = [
  ['dashboard', 'Dashboard'], ['pipeline', 'Pipeline'], ['leads', 'Leads'],
  ['tasks', 'Tarefas'], ['empreendimentos', 'Empreendimentos'], ['imoveis', 'Imóveis'],
  ['propostas', 'Propostas'], ['visitas', 'Visitas'], ['inbox', 'Inbox'],
  ['templates', 'Templates'], ['marketing', 'Marketing'], ['agenda', 'Agenda'],
  ['analytics', 'Analytics'], ['automations', 'Automações'], ['comissoes', 'Comissões'],
  ['users', 'Equipe'], ['permissions', 'Acessos'], ['settings', 'Configurações'],
  ['audit', 'Auditoria'], ['webhooks', 'Webhooks']
]

export default function Permissoes({ imobiliariaId }) {
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [access, setAccess] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users', { params: { imobiliariaId } }).then(({ data }) => {
      const configurable = data.filter(user => user.role !== 'super_admin')
      setUsers(configurable)
      if (configurable[0]) setUserId(String(configurable[0].id))
    }).finally(() => setLoading(false))
  }, [imobiliariaId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.get(`/users/${userId}/access`)
      .then(({ data }) => setAccess(data))
      .finally(() => setLoading(false))
  }, [userId])

  function toggle(page, field) {
    setAccess(current => current.map(rule => {
      if (rule.page !== page) return rule
      if (field === 'canView') {
        const canView = !rule.canView
        return { ...rule, canView, canEdit: canView ? rule.canEdit : false }
      }
      return { ...rule, canEdit: !rule.canEdit, canView: !rule.canEdit ? true : rule.canView }
    }))
  }

  async function save() {
    setSaving(true)
    try {
      const { data } = await api.put(`/users/${userId}/access`, { access })
      setAccess(data)
      alert('Acessos do usuário atualizados.')
    } catch (error) {
      alert(error.response?.data?.error || 'Não foi possível salvar os acessos.')
    } finally {
      setSaving(false)
    }
  }

  const selected = users.find(user => String(user.id) === userId)
  const ruleFor = page => access.find(rule => rule.page === page) || {}

  return (
    <div className="permissoes-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Acessos por usuário</h1>
          <p className="page-subtitle">Escolha quais páginas o usuário vê e se pode apenas consultar ou também editar.</p>
        </div>
        <Button variant="primary" onClick={save} disabled={!userId || loading || saving}>
          {saving ? 'Salvando...' : 'Salvar acessos'}
        </Button>
      </div>

      <Card padding="lg">
        <Select label="Usuário" value={userId} onChange={event => setUserId(event.target.value)} fullWidth>
          {users.map(user => <option key={user.id} value={user.id}>{user.name} — {user.role}</option>)}
        </Select>
        {selected && <p className="page-subtitle">Configurando: {selected.email}</p>}

        {loading ? <div className="loading-state"><div className="spinner"/><p>Carregando...</p></div> : (
          <div className="permissoes-matrix">
            <div className="matrix-header">
              <div className="matrix-cell header-cell">Página</div>
              <div className="matrix-cell header-cell">Pode visualizar</div>
              <div className="matrix-cell header-cell">Pode editar</div>
            </div>
            {pages.map(([page, label]) => {
              const rule = ruleFor(page)
              return <div className="matrix-row" key={page}>
                <div className="matrix-cell action-cell">{label}</div>
                <div className="matrix-cell"><input aria-label={`Visualizar ${label}`} type="checkbox" checked={Boolean(rule.canView)} onChange={() => toggle(page, 'canView')}/></div>
                <div className="matrix-cell"><input aria-label={`Editar ${label}`} type="checkbox" checked={Boolean(rule.canEdit)} disabled={!rule.canView} onChange={() => toggle(page, 'canEdit')}/></div>
              </div>
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
