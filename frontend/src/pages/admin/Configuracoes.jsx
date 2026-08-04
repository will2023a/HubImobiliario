import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Input } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Tabs, Spinner } from '../../components/ui'
import './Configuracoes.css'
import AppIcon from '../../components/ui/AppIcon'

export default function Configuracoes() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      const res = await api.get('/config')
      setConfig(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const response = await api.put('/config', config)
      setConfig(response.data)
      setMessage('Configurações salvas com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field, value) {
    setConfig(c => ({ ...c, [field]: value }))
  }

  function updateOrganization(field, value) {
    setConfig(current => ({
      ...current,
      imobiliaria: { ...current.imobiliaria, [field]: value }
    }))
  }

  if (loading) return <Spinner fullPage label="Carregando configurações..." />

  const tabs = [
    {
      key: 'empresa',
      label: 'Imobiliária',
      content: (
        <div className="config-section">
          <div className="config-row">
            <Input label="Nome da imobiliária" value={config?.imobiliaria?.nome || ''} onChange={e => updateOrganization('nome', e.target.value)} />
            <Input label="CNPJ" value={config?.imobiliaria?.cnpj || ''} disabled />
          </div>
          <div className="config-row">
            <Input label="E-mail comercial" type="email" value={config?.imobiliaria?.email || ''} onChange={e => updateOrganization('email', e.target.value)} />
            <Input label="Telefone" value={config?.imobiliaria?.telefone || ''} onChange={e => updateOrganization('telefone', e.target.value)} />
          </div>
          <Input label="URL do logotipo" placeholder="https://..." value={config?.logoUrl || ''} onChange={e => updateField('logoUrl', e.target.value)} fullWidth />
          <div className="config-summary">
            <span>Status <strong>{config?.imobiliaria?.status || '—'}</strong></span>
            <span>Plano <strong>{config?.imobiliaria?.plan || '—'}</strong></span>
            <span>Identidade <strong>Preto, branco e dourado</strong></span>
          </div>
        </div>
      )
    },
    {
      key: 'operacao',
      label: 'Operação',
      content: (
        <div className="config-section">
          <p className="config-hint">Horário de funcionamento (usado para automações e IA)</p>
          <div className="config-row">
            <Input label="Início" type="time" value={config?.horarioInicio || '08:00'} onChange={e => updateField('horarioInicio', e.target.value)} />
            <Input label="Fim" type="time" value={config?.horarioFim || '18:00'} onChange={e => updateField('horarioFim', e.target.value)} />
          </div>
          <div className="config-note">Os horários são utilizados pela agenda, automações e atendimento. A identidade visual permanece padronizada em preto, branco e dourado.</div>
        </div>
      )
    },
    {
      key: 'administracao',
      label: 'Administração',
      content: (
        <div className="admin-links-grid">
          <Link to="/dashboard/permissoes" className="admin-link-card"><AppIcon name="users"/><span><strong>Acessos dos usuários</strong><small>Defina páginas e níveis de edição.</small></span></Link>
          <Link to="/dashboard/equipe" className="admin-link-card"><AppIcon name="users"/><span><strong>Equipe</strong><small>Cadastre e organize os colaboradores.</small></span></Link>
          <Link to="/dashboard/auditoria" className="admin-link-card"><AppIcon name="document"/><span><strong>Auditoria</strong><small>Consulte alterações e ações administrativas.</small></span></Link>
          <Link to="/dashboard/webhooks" className="admin-link-card"><AppIcon name="bolt"/><span><strong>Integrações</strong><small>Configure webhooks e eventos externos.</small></span></Link>
        </div>
      )
    },
    {
      key: 'comissoes',
      label: 'Comissões',
      content: (
        <div className="config-section">
          <p className="config-hint">Percentuais de comissão por role (aplicados automaticamente nas vendas aprovadas)</p>
          <Input label="Comissão Corretor (%)" type="number" step="0.1" min="0" max="100" value={config?.comissaoCorretor ?? 3} onChange={e => updateField('comissaoCorretor', parseFloat(e.target.value))} fullWidth />
          <Input label="Comissão Gerente (%)" type="number" step="0.1" min="0" max="100" value={config?.comissaoGerente ?? 1} onChange={e => updateField('comissaoGerente', parseFloat(e.target.value))} fullWidth />
          <Input label="Comissão Diretor (%)" type="number" step="0.1" min="0" max="100" value={config?.comissaoDiretor ?? 0.5} onChange={e => updateField('comissaoDiretor', parseFloat(e.target.value))} fullWidth />
        </div>
      )
    },
  ]

  return (
    <div className="configuracoes-page">
      <div className="configuracoes-header">
        <div><h2>Configurações administrativas</h2><p>Gerencie a imobiliária, operação, comissões e acessos.</p></div>
        <Button onClick={handleSave} loading={saving}>Salvar Alterações</Button>
      </div>

      {message && (
        <p className={`config-message ${message.includes('sucesso') ? 'msg-success' : 'msg-error'}`}>
          {message}
        </p>
      )}

      <Card>
        <Tabs tabs={tabs} defaultTab="empresa" />
      </Card>
    </div>
  )
}
