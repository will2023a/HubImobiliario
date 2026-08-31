import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui'
import './AnaliseProposta.css'

const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
const pct = (v) => `${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100
const TIPOS = [
  ['ato', 'Ato / entrada'], ['pontual', 'Pontual (30/60/90dd)'], ['mensal', 'Mensais'],
  ['semestral', 'Semestrais'], ['anual', 'Anuais'], ['unica', 'Única / balão'], ['financiamento', 'Financiamento'],
]
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS_VENC = [5, 10, 15, 20, 25, 28]
const fmtChave = (chave) => { const [a, m] = chave.split('-'); return `${MESES[Number(m) - 1]}/${a}` }
const mesInput = (s) => `${String(s.inicioAno || new Date().getFullYear()).padStart(4, '0')}-${String(s.inicioMes || 1).padStart(2, '0')}`
const criterioValor = (v) => (typeof v === 'number' ? money(v) : (v ?? '--'))
const serieRow = () => ({ nome: 'Nova série', tipo: 'pontual', inicioMes: new Date().getMonth() + 1, inicioAno: new Date().getFullYear(), quantidade: 1, valor: 0, periodicidade: 1, aposHabitese: false, vencimentoDia: null })

export default function AnaliseProposta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const unidadeIdQ = params.get('unidadeId')

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [data, setData] = useState(null)
  const [series, setSeries] = useState([])
  const [analise, setAnalise] = useState(null)
  const [tabelaSeries, setTabelaSeries] = useState([])
  const [tabelaTotal, setTabelaTotal] = useState(0)
  const [desconto, setDesconto] = useState({ tipo: 'valor', valor: 0 })
  const [dLump, setDLump] = useState({})
  const [expandido, setExpandido] = useState([])
  const [saving, setSaving] = useState(false)
  const [enviarOpen, setEnviarOpen] = useState(false)
  const [fluxoOpen, setFluxoOpen] = useState(false)
  const [descontoOpen, setDescontoOpen] = useState(false)
  const [cliente, setCliente] = useState({ nome: '', sobrenome: '', cpf: '', rg: '', profissao: '', remuneracao: '' })
  const debounceRef = useRef(null)

  const descontoR$ = useMemo(() => {
    const base = desconto.tipo === 'pct' ? (tabelaTotal * (Number(desconto.valor) || 0)) / 100 : (Number(desconto.valor) || 0)
    return Math.max(0, round2(base))
  }, [desconto, tabelaTotal])
  const meta = round2(tabelaTotal - descontoR$)
  const totalProposta = useMemo(
    () => round2(series.reduce((s, x) => s + (Number(x.valor) || 0) * (Number(x.quantidade) || 1), 0)),
    [series]
  )
  const diferenca = round2(totalProposta - meta)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      let payload
      if (id) payload = (await api.get(`/propostas/${id}/analise`)).data
      else {
        payload = (await api.post('/propostas/simular', { unidadeId: Number(unidadeIdQ) })).data
        navigate(`/dashboard/propostas/${payload.proposta.id}/analise`, { replace: true })
      }
      setData(payload)
      setSeries(payload.propostaSeries.map((s, i) => ({ ...s, ordem: i })))
      setAnalise(payload.analise)
      setTabelaSeries(payload.tabelaSeries)
      setTabelaTotal(payload.tabelaTotal)
      if (payload.proposta?.descontoAplicado > 0) setDesconto({ tipo: 'valor', valor: payload.proposta.descontoAplicado })
      setCliente((c) => ({ ...c, nome: payload.proposta?.clienteNome && payload.proposta.clienteNome !== 'Cliente simulação' ? payload.proposta.clienteNome : c.nome }))
    } catch (e) {
      setErro(e.response?.data?.error || 'Não foi possível carregar a análise')
    } finally {
      setLoading(false)
    }
  }, [id, unidadeIdQ, navigate])

  useEffect(() => { carregar() }, [carregar])

  // Recalcula (stateless) ao editar séries ou desconto.
  useEffect(() => {
    if (!data || loading) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.post('/propostas/analise/preview', { tabelaId: data.tabela.id, unidadeId: data.unidade.id, series, descontoAplicado: descontoR$ })
        setAnalise(res.data.analise)
        setTabelaSeries(res.data.tabelaSeries)
        setTabelaTotal(res.data.tabelaTotal)
      } catch { /* mantém último resultado */ }
    }, 450)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [series, descontoR$]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSerie = (i, patch) => setSeries((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const removeSerie = (i) => setSeries((arr) => arr.filter((_, idx) => idx !== i))
  const addSerie = () => setSeries((arr) => [...arr, { ...serieRow(), ordem: arr.length }])
  const igualTabela = () => { setDesconto({ tipo: 'valor', valor: 0 }); setSeries(tabelaSeries.map((s, i) => ({ ...s, ordem: i }))) }
  const aVista = () => setSeries([{ ...serieRow(), nome: 'À vista', tipo: 'ato', valor: meta, ordem: 0 }])

  // Z — preenche esta série com o valor que falta para fechar na meta, dividido pela Qtd.
  const zerarNaMeta = (i) => {
    const outras = series.reduce((s, x, idx) => (idx === i ? s : s + (Number(x.valor) || 0) * (Number(x.quantidade) || 1)), 0)
    const qtd = Math.max(1, Number(series[i].quantidade) || 1)
    setSerie(i, { valor: round2((meta - outras) / qtd) })
  }
  // D — divide o valor total digitado (ao lado do D) pela Qtd desta série.
  const dividirEmMeses = (i) => {
    const lump = Number(dLump[i]) || 0
    const qtd = Math.max(1, Number(series[i].quantidade) || 1)
    setSerie(i, { valor: round2(lump / qtd) })
  }

  const salvar = async (depois) => {
    setSaving(true); setErro('')
    try {
      const res = await api.put(`/propostas/${data.proposta.id}/series`, { series, descontoAplicado: descontoR$ })
      setData(res.data); setAnalise(res.data.analise)
      setSeries(res.data.propostaSeries.map((s, i) => ({ ...s, ordem: i })))
      setTabelaTotal(res.data.tabelaTotal)
      depois?.()
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  const enviar = async () => {
    setSaving(true); setErro('')
    try {
      await api.put(`/propostas/${data.proposta.id}/series`, { series, descontoAplicado: descontoR$ })
      const res = await api.post(`/propostas/${data.proposta.id}/enviar`, { cliente })
      setEnviarOpen(false)
      alert(res.data.requerAprovacao
        ? 'Proposta enviada. Como há critérios fora do limite, a unidade ficou EM APROVAÇÃO com o gestor.'
        : 'Proposta enviada. A unidade foi para EM NEGOCIAÇÃO.')
      navigate('/dashboard/propostas')
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao enviar proposta') }
    finally { setSaving(false) }
  }

  const toggleCrit = (nome) => setExpandido((a) => (a.includes(nome) ? a.filter((n) => n !== nome) : [...a, nome]))

  if (loading) return <Spinner fullPage label="Carregando análise..." />
  if (erro && !data) return <Card><p className="ap-erro">{erro}</p><Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button></Card>

  const u = data.unidade
  const emp = data.empreendimento
  const criterios = analise?.criterios || []
  const comp = analise?.comparativo || {}
  const ind = analise?.indicadores || {}
  const fluxo = analise?.fluxo || { colunas: [], linhas: [] }
  const readonly = ['aprovada', 'cancelada'].includes(data.proposta?.status)
  const falhas = criterios.filter((c) => !c.ok).map((c) => c.label)
  const aprovavel = analise?.aprovavel
  const mesesEntrega = emp.dataPrevisaoConstrucao
    ? Math.max(0, Math.round((new Date(emp.dataPrevisaoConstrucao) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
    : null

  return (
    <div className="ap-page">
      <div className="ap-topbar">
        <div>
          <h1 className="page-title">Análise de proposta</h1>
          <p className="page-subtitle">{emp.nome} · Unidade {u.identificacao || u.numero} · Tabela #{data.tabela.id}</p>
        </div>
        <div className="ap-topbar-actions">
          <Button variant="secondary" onClick={() => setFluxoOpen(true)}>Ver fluxo</Button>
          {!readonly && <Button variant="secondary" onClick={() => salvar()} loading={saving}>Analisar</Button>}
          {!readonly && <Button onClick={() => setEnviarOpen(true)} disabled={diferenca !== 0}>Enviar proposta</Button>}
        </div>
      </div>

      {erro && <div className="ap-flash">{erro}</div>}

      {data.proposta?.status === 'aprovada' && (
        <div className="ap-banner ap-banner-ok">
          <span className="ap-banner-icon">✓</span>
          <div><strong>Proposta aprovada</strong>
            <span>Próximo passo: <button className="ap-link" onClick={() => navigate(`/dashboard/propostas/${data.proposta.id}/cliente`)}>cadastrar o cliente</button>.</span></div>
        </div>
      )}

      <div className={`ap-banner ${aprovavel ? 'ap-banner-ok' : 'ap-banner-warn'}`}>
        <span className="ap-banner-icon">{aprovavel ? '✓' : '!'}</span>
        <div>
          <strong>{aprovavel ? 'Proposta aprovável — segue direto para negociação' : 'Proposta requer aprovação do gestor'}</strong>
          {!aprovavel && falhas.length > 0 && <span>Fora do limite: {falhas.join(' · ')}</span>}
        </div>
      </div>

      {/* Sobre a unidade */}
      <Card padding="lg">
        <h2 className="ap-section-title">Sobre a unidade</h2>
        <div className="ap-unit-grid">
          <div><small>Unidade</small><strong>{u.identificacao || u.numero}</strong></div>
          <div><small>Dt. entrega</small><strong>{emp.dataPrevisaoConstrucao ? new Date(emp.dataPrevisaoConstrucao).toLocaleDateString('pt-BR') : '--'}</strong>{mesesEntrega != null && <em>{mesesEntrega} meses para entrega</em>}</div>
          <div><small>Tipologia</small><strong>{u.tipo || '--'}</strong></div>
          <div><small>Área privativa</small><strong>{u.area ? `${Number(u.area).toLocaleString('pt-BR')} m²` : '--'}</strong></div>
          <div><small>Vagas</small><strong>{u.vagas ?? '--'}</strong></div>
          <div><small>Validade da tabela</small><strong>{data.tabela.validadeInicio ? `${new Date(data.tabela.validadeInicio).toLocaleDateString('pt-BR')} a ${data.tabela.validadeFim ? new Date(data.tabela.validadeFim).toLocaleDateString('pt-BR') : '--'}` : '--'}</strong></div>
        </div>
      </Card>

      <div className="ap-split">
        {/* ===== Coluna de edição ===== */}
        <div className="ap-col-edit">
          <Card padding="lg">
            <h2 className="ap-section-title">Tabela de venda #{data.tabela.id}</h2>
            <div className="ap-table-wrap">
              <table className="ap-table ap-table-compact">
                <thead><tr><th>Série</th><th>Início</th><th>Valor</th><th>Qtd</th><th>Após Hab.</th><th>Total</th><th>%</th></tr></thead>
                <tbody>
                  {tabelaSeries.map((s, i) => (
                    <tr key={i}>
                      <td>{s.nome}</td>
                      <td>{String(s.inicioMes).padStart(2, '0')}/{s.inicioAno}</td>
                      <td>{money(s.valor)}</td>
                      <td>{s.quantidade}</td>
                      <td>{s.aposHabitese ? 'Sim' : 'Não'}</td>
                      <td>{money((Number(s.valor) || 0) * (Number(s.quantidade) || 1))}</td>
                      <td>{pct(s.percentualTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={5}>Total</td><td>{money(tabelaTotal)}</td><td>100%</td></tr></tfoot>
              </table>
            </div>
          </Card>

          <Card padding="lg">
            <div className="ap-section-heading">
              <h2 className="ap-section-title">Proposta do cliente</h2>
              {!readonly && (
                <div className="ap-actions">
                  <Button size="sm" variant="secondary" onClick={igualTabela}>Igual tabela</Button>
                  <Button size="sm" variant="secondary" onClick={aVista}>À vista</Button>
                  <Button size="sm" variant="secondary" onClick={addSerie}>Adicionar série</Button>
                  <Button size="sm" variant={descontoR$ ? 'primary' : 'secondary'} onClick={() => setDescontoOpen(true)}>Desconto</Button>
                </div>
              )}
            </div>

            {!readonly && (
              <p className="ap-help">
                <strong>Z</strong> preenche a série com o valor que falta para fechar na meta, dividido pela Qtd.
                <strong> D</strong> divide o valor total digitado ao lado pelo nº de parcelas da série.
              </p>
            )}

            <div className="ap-table-wrap">
              <table className="ap-table ap-table-edit">
                <thead><tr><th /><th>Série</th><th>Início</th><th>Qtd</th><th>Valor da parcela</th><th>Venc.</th><th>Total</th><th>%</th></tr></thead>
                <tbody>
                  {series.map((s, i) => {
                    const total = (Number(s.valor) || 0) * (Number(s.quantidade) || 1)
                    return (
                      <tr key={i}>
                        <td>{!readonly && series.length > 1 && <button className="ap-del" title="Remover série" onClick={() => removeSerie(i)}>🗑</button>}</td>
                        <td>
                          <input className="ap-in ap-in-nome" value={s.nome} disabled={readonly} onChange={(e) => setSerie(i, { nome: e.target.value })} />
                          <select className="ap-in ap-in-tipo" value={s.tipo} disabled={readonly} onChange={(e) => setSerie(i, { tipo: e.target.value })}>
                            {TIPOS.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="month" className="ap-in ap-in-month" value={mesInput(s)} disabled={readonly}
                            onChange={(e) => { const [a, m] = e.target.value.split('-'); setSerie(i, { inicioAno: Number(a), inicioMes: Number(m) }) }} />
                        </td>
                        <td className="ap-cell-zd">
                          <input type="number" min="1" className="ap-in ap-in-xs" value={s.quantidade} disabled={readonly} onChange={(e) => setSerie(i, { quantidade: Number(e.target.value) })} />
                          {!readonly && <button className="ap-zd" title="Preencher o que falta ÷ Qtd" onClick={() => zerarNaMeta(i)}>Z</button>}
                        </td>
                        <td className="ap-cell-zd">
                          <input type="number" step="0.01" className="ap-in ap-in-md" value={s.valor} disabled={readonly} onChange={(e) => setSerie(i, { valor: Number(e.target.value) })} />
                          {!readonly && (
                            <span className="ap-dtool">
                              <input type="number" step="0.01" className="ap-in ap-in-sm" placeholder="total R$" value={dLump[i] ?? ''} onChange={(e) => setDLump((m) => ({ ...m, [i]: e.target.value }))} />
                              <button className="ap-zd" title="Dividir o total pela Qtd" onClick={() => dividirEmMeses(i)}>D</button>
                            </span>
                          )}
                        </td>
                        <td>
                          <select className="ap-in ap-in-sm" value={s.vencimentoDia || ''} disabled={readonly} onChange={(e) => setSerie(i, { vencimentoDia: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">—</option>
                            {DIAS_VENC.map((d) => <option key={d} value={d}>dia {d}</option>)}
                          </select>
                        </td>
                        <td>{money(total)}</td>
                        <td>{pct(tabelaTotal ? (total / tabelaTotal) * 100 : 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="ap-totais">
              {descontoR$ > 0 && (
                <div className="ap-totais-line"><span>Desconto na unidade</span><strong className="ap-neg">− {money(descontoR$)} ({pct(tabelaTotal ? (descontoR$ / tabelaTotal) * 100 : 0)})</strong>{!readonly && <button className="ap-link" onClick={() => setDesconto({ tipo: 'valor', valor: 0 })}>remover</button>}</div>
              )}
              <div className="ap-totais-line"><span>Meta a fechar</span><strong>{money(meta)}</strong></div>
              <div className={`ap-totais-line ap-totais-dif ${diferenca === 0 ? 'ok' : 'warn'}`}><span>Diferença</span><strong>{money(diferenca)}</strong></div>
              <div className="ap-totais-line ap-totais-total"><span>Total da proposta</span><strong>{money(totalProposta)}</strong></div>
            </div>

            {!readonly && (
              <div className="ap-footer-actions">
                <Button variant="secondary" onClick={() => navigate('/dashboard/propostas')}>Sair</Button>
                <Button variant="secondary" onClick={() => salvar()} loading={saving}>Salvar rascunho</Button>
                <Button onClick={() => setEnviarOpen(true)} disabled={diferenca !== 0}>Enviar proposta</Button>
              </div>
            )}
          </Card>
        </div>

        {/* ===== Coluna de análise ===== */}
        <div className="ap-col-result">
          <Card padding="lg">
            <h2 className="ap-section-title">Resultado da análise</h2>
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead><tr><th /><th>Critério</th><th>Tabela</th><th>Proposta</th><th>Limite</th><th>Toler.</th></tr></thead>
                <tbody>
                  {criterios.map((c) => (
                    <React.Fragment key={c.nome}>
                      <tr className={`${c.ok ? '' : 'ap-row-bad'} ${c.detalhe ? 'ap-row-exp' : ''}`} onClick={() => c.detalhe && toggleCrit(c.nome)}>
                        <td><span className={`ap-dot ${c.ok ? 'ap-dot-ok' : 'ap-dot-bad'}`}>{c.ok ? '✓' : '✕'}</span></td>
                        <td>{c.label}{c.detalhe && <span className="ap-exp-caret">{expandido.includes(c.nome) ? '▾' : '▸'}</span>}</td>
                        <td>{criterioValor(c.tabela)}</td>
                        <td>{criterioValor(c.proposta)}</td>
                        <td>{criterioValor(c.limite)}</td>
                        <td>{criterioValor(c.tolerancia)}</td>
                      </tr>
                      {c.detalhe && expandido.includes(c.nome) && (
                        <tr className="ap-detail-row"><td /><td colSpan={5}>
                          {c.detalhe.map((d, k) => <span key={k} className="ap-detail-item"><em>{d.label}:</em> {criterioValor(d.valor)}</span>)}
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="ap-section-title">Tabela comparativa</h2>
            <table className="ap-table">
              <thead><tr><th>Item</th><th>Tabela</th><th>Proposta</th></tr></thead>
              <tbody>
                <tr><td>Valor m²</td><td>{money(comp.valorM2?.tabela)}</td><td>{money(comp.valorM2?.proposta)}</td></tr>
                <tr><td>Valor m² do AV</td><td>{money(comp.valorM2Av?.tabela)}</td><td>{money(comp.valorM2Av?.proposta)}</td></tr>
                <tr><td>Captação até habite-se</td><td>{money(comp.captacaoAteHabitese?.tabela)}</td><td>{money(comp.captacaoAteHabitese?.proposta)}</td></tr>
                <tr><td>Captação após habite-se</td><td>{money(comp.captacaoAposHabitese?.tabela)}</td><td>{money(comp.captacaoAposHabitese?.proposta)}</td></tr>
                <tr><td>Captação até metade da obra</td><td>{money(comp.captacaoMetadeObra?.tabela)}</td><td>{money(comp.captacaoMetadeObra?.proposta)}</td></tr>
              </tbody>
            </table>
          </Card>

          <Card padding="lg">
            <h2 className="ap-section-title">Indicadores complementares</h2>
            <ul className="ap-ind">
              <li><span>Desconto nominal (proposta − tabela)</span><strong className={ind.descontoNominal < 0 ? 'ap-neg' : ''}>{money(ind.descontoNominal)} ({pct(ind.descontoNominalPct)})</strong></li>
              <li><span>Limite de auto-aprovação</span><strong>{ind.descontoNominalMax != null ? pct(-ind.descontoNominalMax) : '—'}</strong></li>
              <li><span>Taxa de atratividade</span><strong>{pct(ind.taxaAtratividade)}</strong></li>
              <li><span>Valor presente — tabela</span><strong>{money(ind.valorPresenteTabela)}</strong></li>
              <li><span>Valor presente — proposta</span><strong>{money(ind.valorPresenteProposta)}</strong></li>
              <li><span>Equivalência de fluxo (dif.)</span><strong className={ind.diferencaFluxo < 0 ? 'ap-neg' : ''}>{money(ind.diferencaFluxo)}</strong></li>
              <li><span>Início da perda</span><strong>{ind.inicioDaPerda ? new Date(ind.inicioDaPerda).toLocaleDateString('pt-BR') : '—'}</strong></li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Modal: desconto */}
      <Modal isOpen={descontoOpen} onClose={() => setDescontoOpen(false)} title="Desconto na unidade">
        <p className="ap-help">Reduz a meta que a proposta precisa fechar. O desconto nominal resultante é avaliado contra o limite de auto-aprovação.</p>
        <div className="ap-desc-form">
          <label className="ap-radio"><input type="radio" checked={desconto.tipo === 'valor'} onChange={() => setDesconto((d) => ({ ...d, tipo: 'valor' }))} /> Valor (R$)</label>
          <label className="ap-radio"><input type="radio" checked={desconto.tipo === 'pct'} onChange={() => setDesconto((d) => ({ ...d, tipo: 'pct' }))} /> Percentual da tabela (%)</label>
          <Input label={desconto.tipo === 'pct' ? 'Percentual (%)' : 'Valor (R$)'} type="number" step="0.01" value={desconto.valor}
            onChange={(e) => setDesconto((d) => ({ ...d, valor: e.target.value }))} />
          <p className="ap-desc-preview">Desconto: <strong>{money(descontoR$)}</strong> · Meta: <strong>{money(meta)}</strong></p>
        </div>
        <div className="ap-footer-actions">
          <Button variant="secondary" onClick={() => { setDesconto({ tipo: 'valor', valor: 0 }); setDescontoOpen(false) }}>Sem desconto</Button>
          <Button onClick={() => setDescontoOpen(false)}>Aplicar</Button>
        </div>
      </Modal>

      {/* Modal: fluxo */}
      <Modal isOpen={fluxoOpen} onClose={() => setFluxoOpen(false)} title="Fluxo da proposta de compra e venda" size="xl">
        <div className="ap-table-wrap">
          <table className="ap-table ap-fluxo">
            <thead>
              <tr><th>Mês/Ano</th>{fluxo.colunas.map((c) => <th key={c}>{c}</th>)}<th>Valor a ser pago</th><th>Acumulado</th><th>%=&gt;T</th><th>%=&gt;P</th></tr>
            </thead>
            <tbody>
              {fluxo.linhas.map((l) => (
                <tr key={l.mesAno}>
                  <td>{fmtChave(l.mesAno)}</td>
                  {fluxo.colunas.map((c) => <td key={c}>{l.valores[c] ? money(l.valores[c]) : '—'}</td>)}
                  <td>{money(l.valorPago)}</td><td>{money(l.acumulado)}</td><td>{pct(l.pctSobreTabela)}</td><td>{pct(l.pctSobreProposta)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={fluxo.colunas.length + 1}>Total</td><td>{money(fluxo.total)}</td><td colSpan={3}>Total tabela: {money(fluxo.totalTabela)}</td></tr></tfoot>
          </table>
        </div>
      </Modal>

      {/* Modal: enviar */}
      <Modal isOpen={enviarOpen} onClose={() => !saving && setEnviarOpen(false)} title="Dados do cliente para a proposta">
        <div className="ap-cliente-form">
          <Input label="Nome *" value={cliente.nome} onChange={(e) => setCliente((c) => ({ ...c, nome: e.target.value }))} />
          <Input label="Sobrenome" value={cliente.sobrenome} onChange={(e) => setCliente((c) => ({ ...c, sobrenome: e.target.value }))} />
          <Input label="CPF" value={cliente.cpf} onChange={(e) => setCliente((c) => ({ ...c, cpf: e.target.value }))} />
          <Input label="RG" value={cliente.rg} onChange={(e) => setCliente((c) => ({ ...c, rg: e.target.value }))} />
          <Input label="Profissão" value={cliente.profissao} onChange={(e) => setCliente((c) => ({ ...c, profissao: e.target.value }))} />
          <Input label="Remuneração" type="number" value={cliente.remuneracao} onChange={(e) => setCliente((c) => ({ ...c, remuneracao: e.target.value }))} />
        </div>
        {!aprovavel && <p className="ap-warn">Atenção: há critérios fora do limite. A proposta irá para aprovação do gestor.</p>}
        <div className="ap-footer-actions">
          <Button variant="secondary" onClick={() => setEnviarOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={enviar} loading={saving} disabled={!cliente.nome.trim()}>Confirmar envio</Button>
        </div>
      </Modal>
    </div>
  )
}
