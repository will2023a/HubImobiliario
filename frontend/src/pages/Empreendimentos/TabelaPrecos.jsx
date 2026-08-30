import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { Badge, EmptyState, Spinner } from '../../components/ui'
import './TabelaPrecos.css'

const modeloLabels = {
  modelo_1: 'Modelo 1', modelo_2: 'Modelo 2', modelo_3: 'Modelo 3',
  modelo_4: 'Modelo 4', modelo_5: 'Modelo 5', flex_01: 'Flex 01', flex_02: 'Flex 02',
}
const TIPOS = ['ato', 'pontual', 'mensal', 'semestral', 'anual', 'unica', 'financiamento']
const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
const novaSerie = () => ({ nome: 'Nova série', tipo: 'pontual', inicioMes: new Date().getMonth() + 1, inicioAno: new Date().getFullYear(), valor: 0, quantidade: 1, periodicidade: 1, aposHabitese: false })

export default function TabelaPrecos({ empreendimentoId }) {
  const [tabelas, setTabelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', grupo: 'padrao', modelo: 'modelo_1' })
  const [saving, setSaving] = useState(false)
  const [activeTabela, setActiveTabela] = useState(null)
  const [series, setSeries] = useState([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => { loadTabelas() }, [empreendimentoId])

  async function loadTabelas() {
    try {
      const res = await api.get(`/tabela-preco/${empreendimentoId}`)
      setTabelas(res.data)
      const first = res.data.find((t) => t.id === activeTabela) || res.data[0]
      if (first) { setActiveTabela(first.id); setSeries((first.series || []).map((s, i) => ({ ...s, ordem: i }))); setDirty(false) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function selectTabela(t) {
    setActiveTabela(t.id)
    setSeries((t.series || []).map((s, i) => ({ ...s, ordem: i })))
    setDirty(false)
  }

  async function handleCreateTabela(e) {
    e.preventDefault()
    if (!form.nome) return
    setSaving(true)
    try {
      const res = await api.post('/tabela-preco', { ...form, empreendimentoId: parseInt(empreendimentoId, 10) })
      setShowModal(false)
      setForm({ nome: '', grupo: 'padrao', modelo: 'modelo_1' })
      await loadTabelas()
      selectTabela(res.data)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const setSerie = (i, patch) => { setSeries((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s))); setDirty(true) }
  const removeSerie = (i) => { setSeries((arr) => arr.filter((_, idx) => idx !== i)); setDirty(true) }
  const addSerie = () => { setSeries((arr) => [...arr, { ...novaSerie(), ordem: arr.length }]); setDirty(true) }

  async function salvarSeries() {
    setSaving(true)
    try {
      const res = await api.put(`/tabela-preco/${activeTabela}/series`, { series })
      setSeries((res.data.series || []).map((s, i) => ({ ...s, ordem: i })))
      setDirty(false)
      await loadTabelas()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function excluirTabela() {
    if (!window.confirm('Excluir esta tabela de venda e todas as suas séries?')) return
    await api.delete(`/tabela-preco/${activeTabela}`)
    setActiveTabela(null); setSeries([])
    await loadTabelas()
  }

  const currentTabela = tabelas.find((t) => t.id === activeTabela)
  const totalGeral = series.reduce((s, x) => s + (Number(x.valor) || 0) * (Number(x.quantidade) || 1), 0)

  if (loading) return <Spinner fullPage label="Carregando tabelas..." />

  return (
    <div className="tabela-precos">
      <div className="tabela-precos-header">
        <h3>Tabelas de Venda</h3>
        <Button size="sm" onClick={() => setShowModal(true)}>+ Nova Tabela</Button>
      </div>

      {tabelas.length === 0 ? (
        <EmptyState icon="💰" title="Nenhuma tabela de venda" description="Crie tabelas com séries (Ato, 30dd, Mensais, Semestrais, Única, Financiamento) para este empreendimento." action={<Button onClick={() => setShowModal(true)}>Criar Tabela</Button>} />
      ) : (
        <>
          <div className="tabela-precos-tabs">
            {tabelas.map((t) => (
              <button key={t.id} className={`tp-tab ${activeTabela === t.id ? 'tp-tab-active' : ''}`} onClick={() => selectTabela(t)}>
                {t.nome}
                <Badge variant={t.ativa ? 'success' : 'default'} size="sm">{t.ativa ? 'Ativa' : 'Inativa'}</Badge>
              </button>
            ))}
          </div>

          {currentTabela && (
            <div className="tabela-precos-content">
              <div className="tp-meta">
                <span>Grupo: <strong>{currentTabela.grupo}</strong></span>
                <span>Modelo: <strong>{modeloLabels[currentTabela.modelo] || currentTabela.modelo}</strong></span>
                {currentTabela.tipologia && <span>Tipologia: <strong>{currentTabela.tipologia}</strong></span>}
                {currentTabela.validadeInicio && <span>Validade: <strong>{new Date(currentTabela.validadeInicio).toLocaleDateString('pt-BR')} a {currentTabela.validadeFim ? new Date(currentTabela.validadeFim).toLocaleDateString('pt-BR') : '—'}</strong></span>}
                <button className="tp-btn-delete" onClick={excluirTabela}>Excluir tabela</button>
              </div>

              <div className="tp-table-wrap">
                <table className="tp-table">
                  <thead>
                    <tr><th>Nome série</th><th>Tipo</th><th>Início</th><th>Valor</th><th>Qtd</th><th>Period.</th><th>Após Hab.</th><th>Total</th><th>%</th><th /></tr>
                  </thead>
                  <tbody>
                    {series.map((s, i) => {
                      const total = (Number(s.valor) || 0) * (Number(s.quantidade) || 1)
                      return (
                        <tr key={i}>
                          <td><input className="tp-in tp-in-md" value={s.nome} onChange={(e) => setSerie(i, { nome: e.target.value })} /></td>
                          <td>
                            <select className="tp-in" value={s.tipo} onChange={(e) => setSerie(i, { tipo: e.target.value })}>
                              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="tp-inicio">
                            <input type="number" min="1" max="12" className="tp-in tp-in-xs" value={s.inicioMes} onChange={(e) => setSerie(i, { inicioMes: Number(e.target.value) })} />
                            <input type="number" className="tp-in tp-in-sm" value={s.inicioAno} onChange={(e) => setSerie(i, { inicioAno: Number(e.target.value) })} />
                          </td>
                          <td><input type="number" step="0.01" className="tp-in tp-in-md" value={s.valor} onChange={(e) => setSerie(i, { valor: Number(e.target.value) })} /></td>
                          <td><input type="number" min="1" className="tp-in tp-in-xs" value={s.quantidade} onChange={(e) => setSerie(i, { quantidade: Number(e.target.value) })} /></td>
                          <td><input type="number" min="1" className="tp-in tp-in-xs" value={s.periodicidade} onChange={(e) => setSerie(i, { periodicidade: Number(e.target.value) })} /></td>
                          <td><input type="checkbox" checked={Boolean(s.aposHabitese)} onChange={(e) => setSerie(i, { aposHabitese: e.target.checked })} /></td>
                          <td>{money(total)}</td>
                          <td>{totalGeral ? `${Math.round((total / totalGeral) * 10000) / 100}%` : '—'}</td>
                          <td><button className="tp-btn-delete" onClick={() => removeSerie(i)}>✕</button></td>
                        </tr>
                      )
                    })}
                    {series.length === 0 && <tr><td colSpan={10} className="tp-empty">Nenhuma série. Adicione as condições de pagamento.</td></tr>}
                  </tbody>
                  <tfoot><tr><td colSpan={7}>Total</td><td>{money(totalGeral)}</td><td>{series.length ? '100%' : '—'}</td><td /></tr></tfoot>
                </table>
              </div>

              <div className="tp-content-actions">
                <Button size="sm" variant="outline" onClick={addSerie}>+ Adicionar série</Button>
                <Button size="sm" onClick={salvarSeries} loading={saving} disabled={!dirty}>Salvar séries</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Tabela de Venda" size="md">
        <form onSubmit={handleCreateTabela}>
          <Input label="Nome *" placeholder="Ex: Tabela Padrão Fevereiro" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} fullWidth />
          <Select label="Grupo" value={form.grupo} onChange={(e) => setForm((f) => ({ ...f, grupo: e.target.value }))} fullWidth>
            <option value="padrao">Padrão</option>
            <option value="promocional">Promocional</option>
            <option value="especial">Especial</option>
          </Select>
          <Select label="Modelo" value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} fullWidth>
            {Object.entries(modeloLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Tipologia (opcional)" placeholder="Ex: 2 quartos" value={form.tipologia || ''} onChange={(e) => setForm((f) => ({ ...f, tipologia: e.target.value }))} fullWidth />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar Tabela</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
