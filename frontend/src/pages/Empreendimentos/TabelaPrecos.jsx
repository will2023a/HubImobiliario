import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { Badge, EmptyState, Spinner } from '../../components/ui'
import './TabelaPrecos.css'

const modeloLabels = {
  modelo_1: 'Modelo 1', modelo_2: 'Modelo 2', modelo_3: 'Modelo 3',
  modelo_4: 'Modelo 4', modelo_5: 'Modelo 5', flex_01: 'Flex 01', flex_02: 'Flex 02'
}

export default function TabelaPrecos({ empreendimentoId }) {
  const [tabelas, setTabelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', grupo: 'padrao', modelo: 'modelo_1' })
  const [saving, setSaving] = useState(false)
  const [activeTabela, setActiveTabela] = useState(null)
  const [itemForm, setItemForm] = useState({ descricao: '', valor: '', parcelas: '', valorParcela: '' })
  const [showItemModal, setShowItemModal] = useState(false)

  useEffect(() => { loadTabelas() }, [empreendimentoId])

  async function loadTabelas() {
    try {
      const res = await api.get(`/tabela-preco/${empreendimentoId}`)
      setTabelas(res.data)
      if (res.data.length > 0 && !activeTabela) setActiveTabela(res.data[0].id)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleCreateTabela(e) {
    e.preventDefault()
    if (!form.nome) return
    setSaving(true)
    try {
      await api.post('/tabela-preco', { ...form, empreendimentoId: parseInt(empreendimentoId) })
      setShowModal(false)
      setForm({ nome: '', grupo: 'padrao', modelo: 'modelo_1' })
      loadTabelas()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!itemForm.descricao || !itemForm.valor) return
    setSaving(true)
    try {
      await api.post(`/tabela-preco/${activeTabela}/itens`, {
        ...itemForm,
        valor: parseFloat(itemForm.valor),
        parcelas: itemForm.parcelas ? parseInt(itemForm.parcelas) : null,
        valorParcela: itemForm.valorParcela ? parseFloat(itemForm.valorParcela) : null,
      })
      setShowItemModal(false)
      setItemForm({ descricao: '', valor: '', parcelas: '', valorParcela: '' })
      loadTabelas()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('Remover este item?')) return
    try {
      await api.delete(`/tabela-preco/itens/${itemId}`)
      loadTabelas()
    } catch (err) { console.error(err) }
  }

  const currentTabela = tabelas.find(t => t.id === activeTabela)
  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (loading) return <Spinner fullPage label="Carregando tabelas..." />

  return (
    <div className="tabela-precos">
      <div className="tabela-precos-header">
        <h3>Tabelas de Preço</h3>
        <Button size="sm" onClick={() => setShowModal(true)}>+ Nova Tabela</Button>
      </div>

      {tabelas.length === 0 ? (
        <EmptyState icon="💰" title="Nenhuma tabela de preço" description="Crie tabelas de preço (NCC) para este empreendimento." action={<Button onClick={() => setShowModal(true)}>Criar Tabela</Button>} />
      ) : (
        <>
          {/* Tabs das tabelas */}
          <div className="tabela-precos-tabs">
            {tabelas.map(t => (
              <button
                key={t.id}
                className={`tp-tab ${activeTabela === t.id ? 'tp-tab-active' : ''}`}
                onClick={() => setActiveTabela(t.id)}
              >
                {t.nome}
                <Badge variant={t.ativa ? 'success' : 'default'} size="sm">
                  {t.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </button>
            ))}
          </div>

          {/* Conteúdo da tabela ativa */}
          {currentTabela && (
            <div className="tabela-precos-content">
              <div className="tp-meta">
                <span>Grupo: <strong>{currentTabela.grupo}</strong></span>
                <span>Modelo: <strong>{modeloLabels[currentTabela.modelo] || currentTabela.modelo}</strong></span>
                {currentTabela.incluirDesconto && <Badge variant="success" size="sm">Com desconto</Badge>}
                {currentTabela.incluirJuros && <Badge variant="warning" size="sm">Com juros</Badge>}
              </div>

              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Parcelas</th>
                    <th>Valor Parcela</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTabela.itens?.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.descricao}</strong></td>
                      <td>{formatCurrency(item.valor)}</td>
                      <td>{item.parcelas || '-'}</td>
                      <td>{item.valorParcela ? formatCurrency(item.valorParcela) : '-'}</td>
                      <td>
                        <button className="tp-btn-delete" onClick={() => handleDeleteItem(item.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {(!currentTabela.itens || currentTabela.itens.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhum item. Adicione condições de pagamento.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{formatCurrency(currentTabela.itens?.reduce((s, i) => s + i.valor, 0) || 0)}</strong></td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>

              <Button size="sm" variant="outline" onClick={() => setShowItemModal(true)}>+ Adicionar Item</Button>
            </div>
          )}
        </>
      )}

      {/* Modal criar tabela */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Tabela de Preço" size="md">
        <form onSubmit={handleCreateTabela}>
          <Input label="Nome *" placeholder="Ex: Tabela Padrão" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} fullWidth />
          <Select label="Grupo" value={form.grupo} onChange={e => setForm(f => ({...f, grupo: e.target.value}))} fullWidth>
            <option value="padrao">Padrão</option>
            <option value="promocional">Promocional</option>
            <option value="especial">Especial</option>
          </Select>
          <Select label="Modelo" value={form.modelo} onChange={e => setForm(f => ({...f, modelo: e.target.value}))} fullWidth>
            {Object.entries(modeloLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar Tabela</Button>
          </div>
        </form>
      </Modal>

      {/* Modal adicionar item */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Adicionar Condição de Pagamento" size="md">
        <form onSubmit={handleAddItem}>
          <Input label="Descrição *" placeholder="Ex: Entrada, Parcelas mensais, Saldo" value={itemForm.descricao} onChange={e => setItemForm(f => ({...f, descricao: e.target.value}))} fullWidth />
          <Input label="Valor (R$) *" placeholder="50000" type="number" step="0.01" value={itemForm.valor} onChange={e => setItemForm(f => ({...f, valor: e.target.value}))} fullWidth />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Nº Parcelas" placeholder="12" type="number" value={itemForm.parcelas} onChange={e => setItemForm(f => ({...f, parcelas: e.target.value}))} fullWidth />
            <Input label="Valor Parcela (R$)" placeholder="4166.67" type="number" step="0.01" value={itemForm.valorParcela} onChange={e => setItemForm(f => ({...f, valorParcela: e.target.value}))} fullWidth />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setShowItemModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Adicionar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
