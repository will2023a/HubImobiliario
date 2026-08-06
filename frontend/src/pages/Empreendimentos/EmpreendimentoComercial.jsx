import React, { useState } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'

export default function EmpreendimentoComercial({ empreendimento, onReload }) {
  const [documento, setDocumento] = useState({ nome: '', tipo: 'memorial', url: '', publico: true })
  const [share, setShare] = useState({ clienteNome: '', clienteEmail: '', permitirPrecos: false, permitirUnidades: true, dias: 30 })
  const [message, setMessage] = useState('')

  async function addDocument(event) {
    event.preventDefault(); setMessage('')
    try { await api.post(`/empreendimentos/${empreendimento.id}/documentos`, documento); setDocumento({ nome: '', tipo: 'memorial', url: '', publico: true }); await onReload() }
    catch (error) { setMessage(error.response?.data?.error || 'Não foi possível adicionar o documento') }
  }

  async function createShare(event) {
    event.preventDefault(); setMessage('')
    try {
      const expiresAt = new Date(Date.now() + Number(share.dias) * 86400000).toISOString()
      const { data } = await api.post(`/empreendimentos/${empreendimento.id}/compartilhamentos`, { ...share, expiresAt })
      const url = `${window.location.origin}/catalogo/${data.token}`
      await navigator.clipboard?.writeText(url)
      setMessage(`Link criado e copiado: ${url}`); await onReload()
    } catch (error) { setMessage(error.response?.data?.error || 'Não foi possível criar o compartilhamento') }
  }

  async function revoke(id) { await api.patch(`/empreendimentos/${empreendimento.id}/compartilhamentos/${id}/revogar`); await onReload() }
  async function removeDocument(id) { await api.delete(`/empreendimentos/${empreendimento.id}/documentos/${id}`); await onReload() }

  return <div style={{ display: 'grid', gap: 18 }}>
    {message && <Card><p style={{ margin: 0, overflowWrap: 'anywhere' }}>{message}</p></Card>}
    <Card title="Compartilhar com cliente" subtitle="Crie um link público controlado e com validade">
      <form onSubmit={createShare} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        <Input label="Cliente" value={share.clienteNome} onChange={e => setShare(s => ({ ...s, clienteNome: e.target.value }))} />
        <Input label="E-mail" type="email" value={share.clienteEmail} onChange={e => setShare(s => ({ ...s, clienteEmail: e.target.value }))} />
        <Input label="Validade em dias" type="number" min="1" max="365" value={share.dias} onChange={e => setShare(s => ({ ...s, dias: e.target.value }))} />
        <label><input type="checkbox" checked={share.permitirUnidades} onChange={e => setShare(s => ({ ...s, permitirUnidades: e.target.checked }))} /> Mostrar unidades</label>
        <label><input type="checkbox" checked={share.permitirPrecos} onChange={e => setShare(s => ({ ...s, permitirPrecos: e.target.checked }))} /> Mostrar preços</label>
        <Button type="submit">Criar e copiar link</Button>
      </form>
      <div style={{ marginTop: 16 }}>{(empreendimento.compartilhamentos || []).map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid #ddd' }}><span>{item.clienteNome || 'Link geral'} · {item.visualizacoes} visualizações · válido até {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('pt-BR') : 'sem prazo'}</span><Button size="sm" variant="secondary" onClick={() => revoke(item.id)}>Revogar</Button></div>)}</div>
    </Card>
    <Card title="Downloads e anexos" subtitle="Cadastre links para memoriais, convenções, plantas e tabelas">
      <form onSubmit={addDocument} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 2fr auto', gap: 12, alignItems: 'end' }}>
        <Input label="Nome" value={documento.nome} onChange={e => setDocumento(d => ({ ...d, nome: e.target.value }))} required />
        <Select label="Tipo" value={documento.tipo} onChange={e => setDocumento(d => ({ ...d, tipo: e.target.value }))}><option value="memorial">Memorial</option><option value="convencao">Convenção</option><option value="planta">Planta</option><option value="tabela">Tabela</option><option value="outro">Outro</option></Select>
        <Input label="URL do arquivo" type="url" value={documento.url} onChange={e => setDocumento(d => ({ ...d, url: e.target.value }))} required />
        <Button type="submit">Adicionar</Button>
      </form>
      <div style={{ marginTop: 16 }}>{(empreendimento.documentos || []).map(doc => <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #ddd' }}><a href={doc.url} target="_blank" rel="noreferrer">{doc.nome}</a><Button size="sm" variant="secondary" onClick={() => removeDocument(doc.id)}>Excluir</Button></div>)}</div>
    </Card>
  </div>
}
