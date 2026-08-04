import React, { useState, useMemo } from 'react'
import './MapaDisponibilidade.css'

// 10 status completos estilo Anapro
const STATUS_CONFIG = {
  disponivel:      { label: 'Disponível', cor: '#d4af37', icon: '●' },
  reservada:       { label: 'Reservada', cor: '#b8941f', icon: '●' },
  em_aprovacao:    { label: 'Em aprovação', cor: '#999999', icon: '●' },
  em_negociacao:   { label: 'Em negociação', cor: '#666666', icon: '●' },
  venda_suspensa:  { label: 'Venda suspensa', cor: '#4d4d4d', icon: '●' },
  vendido:         { label: 'Venda aprovada', cor: '#1a1a1a', icon: '●' },
  permuta:         { label: 'Permuta', cor: '#808080', icon: '●' },
  alugada:         { label: 'Alugada', cor: '#b3b3b3', icon: '●' },
  fora_de_venda:   { label: 'Fora de venda', cor: '#2d2d2d', icon: '●' },
  pre_reservada:   { label: 'Pré-reservada', cor: '#e8c766', icon: '●' },
}

export default function MapaDisponibilidade({ unidades = [], empreendimentoNome }) {
  const [agrupamento, setAgrupamento] = useState('andar') // andar, bloco, andar_bloco
  const [filterStatus, setFilterStatus] = useState([])
  const [compact, setCompact] = useState(false)

  // Resumo por status
  const resumo = useMemo(() => {
    const result = {}
    Object.keys(STATUS_CONFIG).forEach(key => {
      const filtered = unidades.filter(u => u.status === key)
      result[key] = {
        quantidade: filtered.length,
        valor: filtered.reduce((sum, u) => sum + (u.valorTotal || 0), 0)
      }
    })
    return result
  }, [unidades])

  // Agrupamento
  const grouped = useMemo(() => {
    const groups = {}
    unidades.forEach(u => {
      let key
      if (agrupamento === 'bloco') key = u.bloco || 'Único'
      else if (agrupamento === 'andar_bloco') key = `${u.bloco || 'Único'} - Andar ${u.andar || u.numero?.charAt(0) || '?'}`
      else key = `Andar ${u.andar || u.numero?.charAt(0) || '?'}`
      
      if (!groups[key]) groups[key] = []
      groups[key].push(u)
    })
    return groups
  }, [unidades, agrupamento])

  // Filtro
  const filteredUnidades = filterStatus.length > 0
    ? unidades.filter(u => filterStatus.includes(u.status))
    : unidades

  const filteredGroups = useMemo(() => {
    if (filterStatus.length === 0) return grouped
    const result = {}
    Object.entries(grouped).forEach(([key, units]) => {
      const filtered = units.filter(u => filterStatus.includes(u.status))
      if (filtered.length > 0) result[key] = filtered
    })
    return result
  }, [grouped, filterStatus])

  function toggleStatusFilter(status) {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="mapa-disp">
      {/* Header */}
      <div className="mapa-disp-header">
        <h3 className="mapa-disp-title">{empreendimentoNome} - Disponibilidade</h3>
        <div className="mapa-disp-controls">
          <select
            className="mapa-disp-select"
            value={agrupamento}
            onChange={e => setAgrupamento(e.target.value)}
          >
            <option value="andar">Por andar</option>
            <option value="bloco">Por bloco</option>
            <option value="andar_bloco">Por andar e bloco</option>
          </select>
          <button
            className={`mapa-disp-btn ${compact ? 'active' : ''}`}
            onClick={() => setCompact(!compact)}
          >
            {compact ? 'Expandir' : 'Compactar'}
          </button>
        </div>
      </div>

      {/* Legenda / Filtros por Status */}
      <div className="mapa-disp-legend">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`mapa-disp-legend-item ${filterStatus.includes(key) ? 'legend-active' : ''} ${filterStatus.length > 0 && !filterStatus.includes(key) ? 'legend-dimmed' : ''}`}
            onClick={() => toggleStatusFilter(key)}
          >
            <span className="legend-dot" style={{ background: cfg.cor }} />
            <span className="legend-label">{cfg.label}</span>
          </button>
        ))}
      </div>

      {/* Resumo por Status */}
      <div className="mapa-disp-resumo">
        <h4>Resumo por Status</h4>
        <div className="resumo-grid">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            resumo[key]?.quantidade > 0 && (
              <div key={key} className="resumo-item">
                <span className="resumo-dot" style={{ background: cfg.cor }} />
                <span className="resumo-label">{cfg.label}</span>
                <span className="resumo-qty">{resumo[key].quantidade}</span>
                <span className="resumo-valor">{formatCurrency(resumo[key].valor)}</span>
              </div>
            )
          ))}
          <div className="resumo-item resumo-total">
            <span className="resumo-label"><strong>Total</strong></span>
            <span className="resumo-qty"><strong>{unidades.length}</strong></span>
            <span className="resumo-valor"><strong>{formatCurrency(unidades.reduce((s, u) => s + (u.valorTotal || 0), 0))}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid de Unidades */}
      <div className="mapa-disp-grid-container">
        {Object.entries(filteredGroups).length === 0 ? (
          <div className="mapa-disp-empty">Nenhuma unidade com os filtros selecionados</div>
        ) : (
          Object.entries(filteredGroups).map(([groupName, units]) => (
            <div key={groupName} className="mapa-disp-group">
              <h4 className="mapa-disp-group-title">{groupName}</h4>
              <div className={`mapa-disp-grid ${compact ? 'mapa-grid-compact' : ''}`}>
                {units.map(u => {
                  const cfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.disponivel
                  return (
                    <div
                      key={u.id}
                      className={`mapa-disp-cell ${u.status === 'vendido' ? 'cell-vendido' : ''}`}
                      style={{ borderColor: cfg.cor, '--status-color': cfg.cor }}
                      title={`${u.numero} - ${cfg.label} - ${formatCurrency(u.valorTotal)}`}
                    >
                      <span className="cell-numero">{u.numero}</span>
                      {!compact && (
                        <>
                          <span className="cell-valor">{formatCurrency(u.valorTotal)}</span>
                          <span className="cell-status" style={{ color: cfg.cor }}>{cfg.label}</span>
                        </>
                      )}
                      <span className="cell-indicator" style={{ background: cfg.cor }} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
