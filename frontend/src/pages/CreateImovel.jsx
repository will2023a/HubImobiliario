import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Input, Select, Textarea } from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function CreateImovel() {
  const [form, setForm] = useState({
    titulo: '', descricao: '', valor: '', endereco: '', cidade: '', estado: '', status: 'disponível'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo || !form.valor || !form.cidade) {
      setError('Título, valor e cidade são obrigatórios')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/imoveis', { ...form, valor: parseFloat(form.valor) || 0 })
      navigate('/dashboard/imoveis')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar imóvel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="Novo Imóvel" subtitle="Cadastre um imóvel no sistema">
        <form onSubmit={handleSubmit}>
          <Input label="Título *" placeholder="Ex: Casa 3 quartos no Centro" value={form.titulo} onChange={e => handleChange('titulo', e.target.value)} fullWidth />
          <Textarea label="Descrição" placeholder="Detalhes do imóvel..." value={form.descricao} onChange={e => handleChange('descricao', e.target.value)} fullWidth />
          <Input label="Valor (R$) *" placeholder="350000" type="number" value={form.valor} onChange={e => handleChange('valor', e.target.value)} fullWidth />
          <Input label="Endereço" placeholder="Rua, número, bairro" value={form.endereco} onChange={e => handleChange('endereco', e.target.value)} fullWidth />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Cidade *" placeholder="São Paulo" value={form.cidade} onChange={e => handleChange('cidade', e.target.value)} fullWidth />
            <Input label="Estado" placeholder="SP" value={form.estado} onChange={e => handleChange('estado', e.target.value)} fullWidth />
          </div>
          <Select label="Status" value={form.status} onChange={e => handleChange('status', e.target.value)} fullWidth>
            <option value="disponível">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
            <option value="inativo">Inativo</option>
          </Select>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => navigate('/dashboard/imoveis')}>Cancelar</Button>
            <Button type="submit" loading={loading}>Salvar Imóvel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
