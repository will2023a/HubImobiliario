import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Input, Select } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Tabs, Spinner } from '../../components/ui'
import './Configuracoes.css'

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
      await api.put('/config', config)
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

  if (loading) return <Spinner fullPage label="Carregando configurações..." />

  const tabs = [
    {
      key: 'empresa',
      label: 'Empresa',
      content: (
        <div className="config-section">
          <Input label="Logo URL" placeholder="https://..." value={config?.logoUrl || ''} onChange={e => updateField('logoUrl', e.target.value)} fullWidth />
          <div className="config-row">
            <Input label="Cor Primária" type="color" value={config?.corPrimaria || '#6366f1'} onChange={e => updateField('corPrimaria', e.target.value)} />
            <Input label="Cor Secundária" type="color" value={config?.corSecundaria || '#8b5cf6'} onChange={e => updateField('corSecundaria', e.target.value)} />
          </div>
          <Select label="Tema" value={config?.tema || 'dark'} onChange={e => updateField('tema', e.target.value)} fullWidth>
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </Select>
        </div>
      )
    },
    {
      key: 'horario',
      label: 'Horário',
      content: (
        <div className="config-section">
          <p className="config-hint">Horário de funcionamento (usado para automações e IA)</p>
          <div className="config-row">
            <Input label="Início" type="time" value={config?.horarioInicio || '08:00'} onChange={e => updateField('horarioInicio', e.target.value)} />
            <Input label="Fim" type="time" value={config?.horarioFim || '18:00'} onChange={e => updateField('horarioFim', e.target.value)} />
          </div>
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
        <h2>Configurações</h2>
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
