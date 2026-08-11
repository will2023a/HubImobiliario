import React, { useState } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import AppIcon from '../../components/ui/AppIcon'
import './EmpreendimentoComercial.css'

const STATUS = {
  disponivel: 'Disponível', reservada: 'Reservada', em_aprovacao: 'Em aprovação',
  em_negociacao: 'Em negociação', venda_suspensa: 'Venda suspensa', vendido: 'Venda aprovada',
  permuta: 'Permuta', alugada: 'Alugada', fora_de_venda: 'Fora de venda', pre_reservada: 'Pré-reservada'
}

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const cpfMask = value => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export default function EmpreendimentoComercial({ empreendimento, onReload }) {
  const [documento, setDocumento] = useState({ nome: '', tipo: 'memorial', url: '', publico: true })
  const [share, setShare] = useState({ clienteNome: '', clienteEmail: '', permitirPrecos: false, permitirUnidades: true, dias: 30 })
  const [message, setMessage] = useState('')
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('disponivel')
  const [unidadeReserva, setUnidadeReserva] = useState(null)
  const [reserva, setReserva] = useState({ clienteNome: '', clienteCpf: '', horas: 48 })
  const [reservaError, setReservaError] = useState('')
  const [savingReserva, setSavingReserva] = useState(false)

  const unidades = (empreendimento.unidades || []).filter(unidade => {
    const texto = `${unidade.identificacao || ''} ${unidade.numero || ''} ${unidade.bloco || ''} ${unidade.tipo || ''}`.toLowerCase()
    return (!status || unidade.status === status) && texto.includes(busca.toLowerCase().trim())
  })

  function openReserva(unidade) {
    setReserva({ clienteNome: '', clienteCpf: '', horas: 48 })
    setReservaError('')
    setUnidadeReserva(unidade)
  }

  async function createReservation(event) {
    event.preventDefault(); setReservaError(''); setSavingReserva(true)
    try {
      await api.post(`/unidades/${unidadeReserva.id}/reservas`, reserva)
      setUnidadeReserva(null)
      setMessage(`Reserva da unidade ${unidadeReserva.identificacao || unidadeReserva.numero} criada com sucesso.`)
      await onReload()
    } catch (error) {
      setReservaError(error.response?.data?.error || 'Não foi possível reservar a unidade')
    } finally { setSavingReserva(false) }
  }

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
    <Card title="Central de reservas" subtitle={`Escolha uma unidade de ${empreendimento.nome} e registre o cliente sem redigitar os dados do imóvel`}>
      <div className="reserva-toolbar">
        <Input label="Buscar unidade" placeholder="Número, bloco ou tipo" value={busca} onChange={event => setBusca(event.target.value)} />
        <Select label="Status" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <div className="reserva-toolbar-count"><strong>{unidades.length}</strong><span>unidade(s) encontrada(s)</span></div>
      </div>

      <div className="reserva-unidades">
        {unidades.map(unidade => <article className="reserva-unidade" key={unidade.id}>
          <div className="reserva-unidade-icon"><AppIcon name="building" /></div>
          <div className="reserva-unidade-name"><small>{unidade.bloco ? `BLOCO ${unidade.bloco}` : 'UNIDADE'}</small><strong>{unidade.identificacao || unidade.numero}</strong><span>{unidade.tipo || empreendimento.tipoUnidade || 'Imóvel'}</span></div>
          <div><small>ÁREA PRIVATIVA</small><strong>{unidade.area ? `${Number(unidade.area).toLocaleString('pt-BR')} m²` : '—'}</strong></div>
          <div><small>PREÇO DE VENDA</small><strong>{money(unidade.valorTotal)}</strong><span>{unidade.area ? `${money((unidade.valorTotal || 0) / unidade.area)}/m²` : ''}</span></div>
          <span className={`reserva-status status-${unidade.status}`}>{STATUS[unidade.status] || unidade.status}</span>
          {unidade.status === 'disponivel'
            ? <Button size="sm" onClick={() => openReserva(unidade)}>Reservar unidade</Button>
            : <Button size="sm" variant="secondary" disabled>Indisponível</Button>}
        </article>)}
        {!unidades.length && <div className="reserva-empty"><AppIcon name="search" /><strong>Nenhuma unidade encontrada</strong><span>Altere a busca ou selecione outro status.</span></div>}
      </div>
    </Card>
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
    <Modal isOpen={Boolean(unidadeReserva)} onClose={() => !savingReserva && setUnidadeReserva(null)} title="Nova reserva" size="lg" closeOnOverlay={!savingReserva}>
      {unidadeReserva && <form className="reserva-form" onSubmit={createReservation}>
        <div className="reserva-selected">
          <div className="reserva-unidade-icon"><AppIcon name="building" /></div>
          <div><small>UNIDADE SELECIONADA</small><strong>{unidadeReserva.identificacao || unidadeReserva.numero}</strong><span>{empreendimento.nome}{unidadeReserva.bloco ? ` · Bloco ${unidadeReserva.bloco}` : ''}</span></div>
          <div><small>VALOR DE TABELA</small><strong>{money(unidadeReserva.valorTotal)}</strong></div>
          <div><small>STATUS ATUAL</small><span className="reserva-status status-disponivel">Disponível</span></div>
        </div>
        <div className="reserva-form-heading"><h3>Dados do cliente</h3><p>A unidade será bloqueada assim que a reserva for confirmada.</p></div>
        <div className="reserva-form-grid">
          <Input label="Nome completo" value={reserva.clienteNome} onChange={event => setReserva(current => ({ ...current, clienteNome: event.target.value }))} placeholder="Nome do comprador" required autoFocus />
          <Input label="CPF" value={reserva.clienteCpf} onChange={event => setReserva(current => ({ ...current, clienteCpf: cpfMask(event.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" />
          <Select label="Prazo da reserva" value={reserva.horas} onChange={event => setReserva(current => ({ ...current, horas: Number(event.target.value) }))}>
            <option value="24">24 horas</option><option value="48">48 horas</option><option value="72">3 dias</option><option value="168">7 dias</option><option value="360">15 dias</option><option value="720">30 dias</option>
          </Select>
        </div>
        <div className="reserva-notice"><AppIcon name="clock" /><p><strong>Bloqueio temporário</strong><span>Durante esse prazo, a unidade ficará como Reservada e não poderá receber outra reserva. O vencimento libera a unidade automaticamente.</span></p></div>
        {reservaError && <p className="reserva-error">{reservaError}</p>}
        <div className="reserva-actions"><Button type="button" variant="secondary" onClick={() => setUnidadeReserva(null)} disabled={savingReserva}>Cancelar</Button><Button type="submit" disabled={savingReserva}>{savingReserva ? 'Confirmando...' : 'Confirmar reserva'}</Button></div>
      </form>}
    </Modal>
  </div>
}
