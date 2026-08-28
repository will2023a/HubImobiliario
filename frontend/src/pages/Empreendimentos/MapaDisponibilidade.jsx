import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import AppIcon from '../../components/ui/AppIcon'
import './MapaDisponibilidade.css'

// 10 status completos estilo Anapro
const STATUS_CONFIG = {
  disponivel:      { label: 'Disponível', cor: '#d4af37' },
  pre_reservada:   { label: 'Pré-reservada', cor: '#e8c766' },
  reservada:       { label: 'Reservada', cor: '#b8941f' },
  em_aprovacao:    { label: 'Em aprovação', cor: '#999999' },
  em_negociacao:   { label: 'Em negociação', cor: '#666666' },
  venda_suspensa:  { label: 'Venda suspensa', cor: '#4d4d4d' },
  vendido:         { label: 'Venda aprovada', cor: '#1a1a1a' },
  permuta:         { label: 'Permuta', cor: '#808080' },
  alugada:         { label: 'Alugada', cor: '#b3b3b3' },
  fora_de_venda:   { label: 'Fora de venda', cor: '#2d2d2d' },
}

// Ações de mudança de status disponíveis no menu da unidade (estilo Anapro)
const STATUS_ACTIONS = [
  { status: 'pre_reservada',  label: 'Pré-reservar' },
  { status: 'em_aprovacao',   label: 'Enviar para aprovação' },
  { status: 'em_negociacao',  label: 'Colocar em negociação' },
  { status: 'venda_suspensa', label: 'Suspender venda' },
  { status: 'vendido',        label: 'Aprovar venda' },
  { status: 'permuta',        label: 'Registrar permuta' },
  { status: 'alugada',        label: 'Marcar como alugada' },
  { status: 'fora_de_venda',  label: 'Tirar de venda' },
  { status: 'disponivel',     label: 'Liberar unidade' },
]

const money = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const FILTROS_VAZIOS = { numero: '', andar: '', bloco: '', tipo: '', vagas: '', precoMin: '', precoMax: '' }

export default function MapaDisponibilidade({
  unidades = [],
  empreendimentoNome,
  empreendimentoId,
  onReload,
  selectionMode = false,
  selectedId = null,
  onSelect,
}) {
  const navigate = useNavigate()
  const manage = !selectionMode && typeof onReload === 'function'

  const [view, setView] = useState('mapa') // mapa | tabela
  const [agrupamento, setAgrupamento] = useState('andar') // andar, bloco, andar_bloco
  const [filterStatus, setFilterStatus] = useState([])
  const [compact, setCompact] = useState(false)
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)

  const [detailUnit, setDetailUnit] = useState(null)
  const [menuFor, setMenuFor] = useState(null) // id da linha com menu aberto (tabela)
  const [reservaUnit, setReservaUnit] = useState(null)
  const [reserva, setReserva] = useState({ clienteNome: '', clienteCpf: '', horas: 48 })
  const [statusAlvo, setStatusAlvo] = useState(null) // { unit, status }
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    if (menuFor == null) return
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuFor(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuFor])

  // Opções distintas para os selects do painel de filtros
  const opcoes = useMemo(() => {
    const uniq = (arr) => [...new Set(arr.filter((v) => v !== null && v !== undefined && v !== ''))]
    return {
      andares: uniq(unidades.map((u) => u.andar)).sort((a, b) => a - b),
      blocos: uniq(unidades.map((u) => u.bloco)).sort(),
      tipos: uniq(unidades.map((u) => u.tipo)).sort(),
      vagas: uniq(unidades.map((u) => u.vagas)).sort((a, b) => a - b),
    }
  }, [unidades])

  // Aplica painel de filtros + filtro por status
  const filteredUnidades = useMemo(() => {
    const min = parseFloat(filtros.precoMin)
    const max = parseFloat(filtros.precoMax)
    return unidades.filter((u) => {
      if (filterStatus.length && !filterStatus.includes(u.status)) return false
      if (filtros.numero && !`${u.numero} ${u.identificacao || ''}`.toLowerCase().includes(filtros.numero.toLowerCase().trim())) return false
      if (filtros.andar !== '' && String(u.andar) !== String(filtros.andar)) return false
      if (filtros.bloco !== '' && String(u.bloco || '') !== String(filtros.bloco)) return false
      if (filtros.tipo !== '' && String(u.tipo || '') !== String(filtros.tipo)) return false
      if (filtros.vagas !== '' && String(u.vagas) !== String(filtros.vagas)) return false
      if (!Number.isNaN(min) && (u.valorTotal || 0) < min) return false
      if (!Number.isNaN(max) && (u.valorTotal || 0) > max) return false
      return true
    })
  }, [unidades, filterStatus, filtros])

  const grouped = useMemo(() => {
    const groups = {}
    filteredUnidades.forEach((u) => {
      let key
      if (agrupamento === 'bloco') key = u.bloco ? `Bloco ${u.bloco}` : 'Único'
      else if (agrupamento === 'andar_bloco') key = `${u.bloco ? `Bloco ${u.bloco}` : 'Único'} · Andar ${u.andar ?? u.numero?.charAt(0) ?? '?'}`
      else key = `Andar ${u.andar ?? u.numero?.charAt(0) ?? '?'}`
      if (!groups[key]) groups[key] = []
      groups[key].push(u)
    })
    return groups
  }, [filteredUnidades, agrupamento])

  const resumo = useMemo(() => {
    const result = {}
    Object.keys(STATUS_CONFIG).forEach((key) => {
      const list = unidades.filter((u) => u.status === key)
      result[key] = { quantidade: list.length, valor: list.reduce((s, u) => s + (u.valorTotal || 0), 0) }
    })
    return result
  }, [unidades])

  const filtrosAtivos = filterStatus.length > 0 || Object.values(filtros).some((v) => v !== '')

  function toggleStatusFilter(status) {
    setFilterStatus((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS)
    setFilterStatus([])
  }

  function abrirUnidade(u) {
    if (selectionMode) {
      if (u.status === 'disponivel') onSelect?.(u)
      return
    }
    setErro(''); setAviso('')
    setDetailUnit(u)
  }

  function pedirReserva(u) {
    setDetailUnit(null); setMenuFor(null); setErro('')
    setReserva({ clienteNome: '', clienteCpf: '', horas: 48 })
    setReservaUnit(u)
  }

  function pedirStatus(u, status) {
    setDetailUnit(null); setMenuFor(null); setErro(''); setMotivo('')
    setStatusAlvo({ unit: u, status })
  }

  async function confirmarReserva(e) {
    e.preventDefault()
    setBusy(true); setErro('')
    try {
      await api.post(`/unidades/${reservaUnit.id}/reservas`, reserva)
      setReservaUnit(null)
      setAviso(`Reserva da unidade ${reservaUnit.identificacao || reservaUnit.numero} criada.`)
      await onReload?.()
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível reservar a unidade')
    } finally {
      setBusy(false)
    }
  }

  async function confirmarStatus(e) {
    e.preventDefault()
    setBusy(true); setErro('')
    try {
      await api.patch(`/unidades/${statusAlvo.unit.id}`, { status: statusAlvo.status, motivo: motivo.trim() || undefined })
      setStatusAlvo(null)
      setAviso(`Unidade ${statusAlvo.unit.identificacao || statusAlvo.unit.numero} agora está "${STATUS_CONFIG[statusAlvo.status]?.label}".`)
      await onReload?.()
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível alterar o status')
    } finally {
      setBusy(false)
    }
  }

  function gerarProposta(u) {
    setDetailUnit(null); setMenuFor(null)
    navigate(`/dashboard/propostas/nova?empreendimentoId=${empreendimentoId || u.empreendimentoId}&unidadeId=${u.id}`)
  }

  const precoM2 = (u) => (u.area ? (u.valorTotal || 0) / u.area : null)

  // Lista de ações para uma unidade (usada no popup e no menu da tabela)
  const acoesDaUnidade = (u) => {
    const acoes = []
    if (u.status === 'disponivel') acoes.push({ key: 'reservar', label: 'Reservar', primary: true, run: () => pedirReserva(u) })
    if (empreendimentoId && u.status === 'disponivel') acoes.push({ key: 'proposta', label: 'Gerar proposta', run: () => gerarProposta(u) })
    STATUS_ACTIONS.filter((a) => a.status !== u.status).forEach((a) =>
      acoes.push({ key: a.status, label: a.label, dot: STATUS_CONFIG[a.status].cor, run: () => pedirStatus(u, a.status) })
    )
    return acoes
  }

  return (
    <div className="mapa-disp">
      {(aviso || erro) && (
        <div className={`mapa-disp-flash ${erro ? 'is-error' : ''}`}>
          <span>{erro || aviso}</span>
          <button type="button" onClick={() => { setErro(''); setAviso('') }}>✕</button>
        </div>
      )}

      {/* Header + abas de visão */}
      <div className="mapa-disp-header">
        <h3 className="mapa-disp-title">{empreendimentoNome} — Disponibilidade</h3>
        <div className="mapa-disp-controls">
          <div className="mapa-disp-viewtabs">
            <button className={view === 'mapa' ? 'active' : ''} onClick={() => setView('mapa')}>Mapa</button>
            <button className={view === 'tabela' ? 'active' : ''} onClick={() => setView('tabela')}>Tabela de preços</button>
          </div>
          {view === 'mapa' && (
            <>
              <select className="mapa-disp-select" value={agrupamento} onChange={(e) => setAgrupamento(e.target.value)}>
                <option value="andar">Por andar</option>
                <option value="bloco">Por bloco</option>
                <option value="andar_bloco">Por andar e bloco</option>
              </select>
              <button className="mapa-disp-zoom" onClick={() => setCompact(true)} title="Diminuir">–</button>
              <button className="mapa-disp-zoom" onClick={() => setCompact(false)} title="Aumentar">+</button>
            </>
          )}
        </div>
      </div>

      {/* Legenda / filtros por status */}
      <div className="mapa-disp-legend">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`mapa-disp-legend-item ${filterStatus.includes(key) ? 'legend-active' : ''} ${filterStatus.length > 0 && !filterStatus.includes(key) ? 'legend-dimmed' : ''}`}
            onClick={() => toggleStatusFilter(key)}
          >
            <span className="legend-dot" style={{ background: cfg.cor }} />
            <span className="legend-label">{cfg.label}</span>
            <span className="legend-count">{resumo[key]?.quantidade || 0}</span>
          </button>
        ))}
      </div>

      <div className="mapa-disp-body">
        {/* Painel de filtros lateral (estilo Anapro) */}
        <aside className="mapa-disp-filtros">
          <div className="filtros-head">
            <strong>Filtros</strong>
            {filtrosAtivos && <button type="button" onClick={limparFiltros}>Limpar</button>}
          </div>
          <Input label="Número" value={filtros.numero} onChange={(e) => setFiltros((f) => ({ ...f, numero: e.target.value }))} placeholder="Ex.: 101, L-A" />
          <Select label="Andar" value={filtros.andar} onChange={(e) => setFiltros((f) => ({ ...f, andar: e.target.value }))}>
            <option value="">Todos</option>
            {opcoes.andares.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select label="Bloco" value={filtros.bloco} onChange={(e) => setFiltros((f) => ({ ...f, bloco: e.target.value }))}>
            <option value="">Todos</option>
            {opcoes.blocos.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Planta / tipo" value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
            <option value="">Todas</option>
            {opcoes.tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Vagas" value={filtros.vagas} onChange={(e) => setFiltros((f) => ({ ...f, vagas: e.target.value }))}>
            <option value="">Todas</option>
            {opcoes.vagas.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
          <div className="filtros-faixa">
            <span className="input-label">Faixa de preço</span>
            <div>
              <Input type="number" placeholder="Mínimo" value={filtros.precoMin} onChange={(e) => setFiltros((f) => ({ ...f, precoMin: e.target.value }))} />
              <Input type="number" placeholder="Máximo" value={filtros.precoMax} onChange={(e) => setFiltros((f) => ({ ...f, precoMax: e.target.value }))} />
            </div>
          </div>
          <div className="filtros-resultado">
            <strong>{filteredUnidades.length}</strong> de {unidades.length} unidades
          </div>
        </aside>

        <div className="mapa-disp-main">
          {view === 'mapa' ? (
            <div className="mapa-disp-grid-container">
              {Object.entries(grouped).length === 0 ? (
                <div className="mapa-disp-empty">Nenhuma unidade com os filtros selecionados</div>
              ) : (
                Object.entries(grouped).map(([groupName, units]) => (
                  <div key={groupName} className="mapa-disp-group">
                    <h4 className="mapa-disp-group-title">{groupName} <span>({units.length})</span></h4>
                    <div className={`mapa-disp-grid ${compact ? 'mapa-grid-compact' : ''}`}>
                      {units.map((u) => {
                        const cfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.disponivel
                        const selDisabled = selectionMode && u.status !== 'disponivel'
                        return (
                          <button
                            type="button"
                            key={u.id}
                            className={`mapa-disp-cell ${selectionMode ? 'cell-selection' : 'cell-clickable'} ${Number(selectedId) === u.id ? 'cell-selected' : ''}`}
                            style={{ borderColor: cfg.cor, '--status-color': cfg.cor }}
                            title={`${u.identificacao || u.numero} · ${cfg.label} · ${money(u.valorTotal)}`}
                            disabled={selDisabled}
                            onClick={() => abrirUnidade(u)}
                          >
                            <span className="cell-numero">{u.identificacao || u.numero}</span>
                            {!compact && (
                              <>
                                <span className="cell-valor">{money(u.valorTotal)}</span>
                                <span className="cell-status" style={{ color: cfg.cor }}>{cfg.label}</span>
                              </>
                            )}
                            <span className="cell-indicator" style={{ background: cfg.cor }} />
                            {selectionMode && u.status === 'disponivel' && <span className="cell-select-hint">Selecionar</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mapa-disp-tabela-wrap">
              <table className="mapa-disp-tabela">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Área privativa total</th>
                    <th>Preço de venda</th>
                    <th>Preço do m²</th>
                    <th>Status</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUnidades.length === 0 && (
                    <tr><td colSpan={6} className="mapa-disp-empty">Nenhuma unidade com os filtros selecionados</td></tr>
                  )}
                  {filteredUnidades.map((u) => {
                    const cfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.disponivel
                    const m2 = precoM2(u)
                    return (
                      <tr key={u.id} className={Number(selectedId) === u.id ? 'row-selected' : ''}>
                        <td><strong>{u.identificacao || u.numero}</strong>{u.bloco ? <div className="td-sub">Bloco {u.bloco}{u.andar != null ? ` · ${u.andar}º` : ''}</div> : null}</td>
                        <td>{u.area ? `${Number(u.area).toLocaleString('pt-BR')} m²` : '—'}</td>
                        <td>{money(u.valorTotal)}</td>
                        <td>{m2 ? money(m2) : '—'}</td>
                        <td><span className="mapa-disp-pill" style={{ background: cfg.cor }}>{cfg.label}</span></td>
                        <td className="td-acoes">
                          {selectionMode ? (
                            <Button size="sm" disabled={u.status !== 'disponivel'} onClick={() => onSelect?.(u)}>
                              {Number(selectedId) === u.id ? 'Selecionada' : 'Selecionar'}
                            </Button>
                          ) : (
                            <div className="mapa-disp-menu" ref={menuFor === u.id ? menuRef : null}>
                              <button type="button" className="mapa-disp-menu-btn" onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}>
                                Menu ▾
                              </button>
                              {menuFor === u.id && (
                                <div className="mapa-disp-menu-list">
                                  <button type="button" onClick={() => { setMenuFor(null); abrirUnidade(u) }}>Detalhes do imóvel</button>
                                  {manage
                                    ? acoesDaUnidade(u).map((a) => (
                                        <button type="button" key={a.key} className={a.primary ? 'is-primary' : ''} onClick={a.run}>
                                          {a.dot && <span className="menu-dot" style={{ background: a.dot }} />}{a.label}
                                        </button>
                                      ))
                                    : <span className="menu-empty">Sem ações disponíveis</span>}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Popup de detalhes da unidade */}
      <Modal
        isOpen={Boolean(detailUnit)}
        onClose={() => setDetailUnit(null)}
        title={detailUnit ? `Unidade ${detailUnit.identificacao || detailUnit.numero}` : ''}
        size="lg"
      >
        {detailUnit && (
          <div className="mapa-disp-detail">
            <div className="detail-status">
              <span className="menu-dot" style={{ background: (STATUS_CONFIG[detailUnit.status] || {}).cor }} />
              {(STATUS_CONFIG[detailUnit.status] || {}).label || detailUnit.status}
            </div>
            <div className="detail-grid">
              <div><small>Andar</small><strong>{detailUnit.andar ?? '—'}</strong></div>
              <div><small>Bloco</small><strong>{detailUnit.bloco || '—'}</strong></div>
              <div><small>Planta / tipo</small><strong>{detailUnit.tipo || '—'}</strong></div>
              <div><small>Vagas</small><strong>{detailUnit.vagas ?? '—'}</strong></div>
              <div><small>Quartos / suítes</small><strong>{(detailUnit.quartos ?? '—')} / {(detailUnit.suites ?? '—')}</strong></div>
              <div><small>Área privativa</small><strong>{detailUnit.area ? `${Number(detailUnit.area).toLocaleString('pt-BR')} m²` : '—'}</strong></div>
              <div><small>Preço de venda</small><strong>{money(detailUnit.valorTotal)}</strong></div>
              <div><small>Preço do m²</small><strong>{precoM2(detailUnit) ? money(precoM2(detailUnit)) : '—'}</strong></div>
            </div>

            {manage ? (
              <div className="detail-actions">
                {acoesDaUnidade(detailUnit).map((a) => (
                  <Button key={a.key} size="sm" variant={a.primary ? 'primary' : 'secondary'} onClick={a.run}>
                    {a.dot && <span className="menu-dot" style={{ background: a.dot }} />}{a.label}
                  </Button>
                ))}
              </div>
            ) : selectionMode ? (
              <div className="detail-actions">
                <Button disabled={detailUnit.status !== 'disponivel'} onClick={() => { onSelect?.(detailUnit); setDetailUnit(null) }}>
                  Usar esta unidade
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Modal de reserva */}
      <Modal
        isOpen={Boolean(reservaUnit)}
        onClose={() => !busy && setReservaUnit(null)}
        title={reservaUnit ? `Reservar ${reservaUnit.identificacao || reservaUnit.numero}` : ''}
        closeOnOverlay={!busy}
      >
        {reservaUnit && (
          <form className="mapa-disp-form" onSubmit={confirmarReserva}>
            <div className="form-selected">
              <div><small>UNIDADE</small><strong>{reservaUnit.identificacao || reservaUnit.numero}</strong><span>{empreendimentoNome}{reservaUnit.bloco ? ` · Bloco ${reservaUnit.bloco}` : ''}</span></div>
              <div><small>VALOR DE TABELA</small><strong>{money(reservaUnit.valorTotal)}</strong></div>
            </div>
            <Input label="Nome completo do cliente" value={reserva.clienteNome} onChange={(e) => setReserva((r) => ({ ...r, clienteNome: e.target.value }))} required autoFocus />
            <Input label="CPF do cliente" value={reserva.clienteCpf} onChange={(e) => setReserva((r) => ({ ...r, clienteCpf: e.target.value }))} placeholder="000.000.000-00" inputMode="numeric" />
            <Select label="Prazo da reserva" value={reserva.horas} onChange={(e) => setReserva((r) => ({ ...r, horas: Number(e.target.value) }))}>
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
              <option value={72}>3 dias</option>
              <option value={168}>7 dias</option>
              <option value={360}>15 dias</option>
              <option value={720}>30 dias</option>
            </Select>
            <p className="form-notice"><AppIcon name="clock" size={16} /> A unidade fica bloqueada como <strong>Reservada</strong> durante o prazo e é liberada automaticamente no vencimento.</p>
            {erro && <p className="form-error">{erro}</p>}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setReservaUnit(null)} disabled={busy}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Confirmando...' : 'Confirmar reserva'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de mudança de status */}
      <Modal
        isOpen={Boolean(statusAlvo)}
        onClose={() => !busy && setStatusAlvo(null)}
        title={statusAlvo ? `Alterar status — ${statusAlvo.unit.identificacao || statusAlvo.unit.numero}` : ''}
        closeOnOverlay={!busy}
      >
        {statusAlvo && (
          <form className="mapa-disp-form" onSubmit={confirmarStatus}>
            <p className="form-status-line">
              <span className="menu-dot" style={{ background: (STATUS_CONFIG[statusAlvo.unit.status] || {}).cor }} />
              {(STATUS_CONFIG[statusAlvo.unit.status] || {}).label}
              <span className="form-arrow">→</span>
              <span className="menu-dot" style={{ background: (STATUS_CONFIG[statusAlvo.status] || {}).cor }} />
              <strong>{(STATUS_CONFIG[statusAlvo.status] || {}).label}</strong>
            </p>
            <Textarea label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Registro no histórico da unidade" />
            {erro && <p className="form-error">{erro}</p>}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setStatusAlvo(null)} disabled={busy}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Confirmar'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
