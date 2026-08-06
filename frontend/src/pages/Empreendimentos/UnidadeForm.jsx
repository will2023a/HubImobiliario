import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'

export default function UnidadeForm() {
  const { id, unidadeId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ numero: '', identificacao: '', tipo: 'apartamento', bloco: '', andar: '', area: '', quartos: '', suites: '', vagas: '', valorBase: '', juros: '0', status: 'disponivel' })
  const [error, setError] = useState('')
  const edit = Boolean(unidadeId)
  useEffect(() => { if (edit) api.get(`/unidades/${unidadeId}`).then(({ data }) => setForm(current => ({ ...current, ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value ?? ''])) }))).catch(() => setError('Unidade não encontrada')) }, [unidadeId])
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  async function submit(event) {
    event.preventDefault(); setError('')
    try {
      if (edit) await api.patch(`/unidades/${unidadeId}`, form)
      else await api.post('/unidades', { ...form, empreendimentoId: Number(id) })
      navigate(`/dashboard/empreendimentos/${id}`)
    } catch (err) { setError(err.response?.data?.error || 'Não foi possível salvar a unidade') }
  }
  return <Card title={edit ? 'Editar unidade' : 'Nova unidade'} subtitle="Dados comerciais e disponibilidade">
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
      <Input label="Número" name="numero" value={form.numero} onChange={change} required />
      <Input label="Identificação comercial" name="identificacao" value={form.identificacao} onChange={change} />
      <Select label="Tipo" name="tipo" value={form.tipo} onChange={change}><option value="apartamento">Apartamento</option><option value="casa">Casa</option><option value="lote">Lote</option><option value="studio">Studio</option><option value="loja">Loja</option></Select>
      <Input label="Bloco" name="bloco" value={form.bloco} onChange={change} />
      <Input label="Andar" type="number" name="andar" value={form.andar} onChange={change} />
      <Input label="Área (m²)" type="number" step="0.01" name="area" value={form.area} onChange={change} />
      <Input label="Quartos" type="number" min="0" name="quartos" value={form.quartos} onChange={change} />
      <Input label="Suítes" type="number" min="0" name="suites" value={form.suites} onChange={change} />
      <Input label="Vagas" type="number" min="0" name="vagas" value={form.vagas} onChange={change} />
      <Input label="Valor base" type="number" step="0.01" min="0" name="valorBase" value={form.valorBase} onChange={change} required />
      <Input label="Juros" type="number" step="0.01" min="0" name="juros" value={form.juros} onChange={change} />
      {edit && <Select label="Status" name="status" value={form.status} onChange={change}><option value="disponivel">Disponível</option><option value="reservada">Reservada</option><option value="em_aprovacao">Em aprovação</option><option value="em_negociacao">Em negociação</option><option value="venda_suspensa">Venda suspensa</option><option value="vendido">Venda aprovada</option><option value="permuta">Permuta</option><option value="alugada">Alugada</option><option value="fora_de_venda">Fora de venda</option><option value="pre_reservada">Pré-reservada</option></Select>}
      {error && <p style={{ color: '#b42318', gridColumn: '1/-1' }}>{error}</p>}
      <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}><Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button><Button type="submit">Salvar unidade</Button></div>
    </form>
  </Card>
}
