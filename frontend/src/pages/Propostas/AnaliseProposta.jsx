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
const mesAno = (m, a) => `${String(m).padStart(2, '0')}/${a}`
const TIPOS = ['ato', 'pontual', 'mensal', 'semestral', 'anual', 'unica', 'financiamento']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const fmtChave = (chave) => { const [a, m] = chave.split('-'); return `${MESES[Number(m) - 1]}/${a}` }
const criterioValor = (v) => (typeof v === 'number' ? money(v) : (v ?? '--'))

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
  const [saving, setSaving] = useState(false)
  const [enviarOpen, setEnviarOpen] = useState(false)
  const [fluxoOpen, setFluxoOpen] = useState(false)
  const [cliente, setCliente] = useState({ nome: '', sobrenome: '', cpf: '', rg: '', profissao: '', remuneracao: '' })
  const debounceRef = useRef(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      let payload
      if (id) {
        payload = (await api.get(`/propostas/${id}/analise`)).data
      } else {
        payload = (await api.post('/propostas/simular', { unidadeId: Number(unidadeIdQ) })).data
        navigate(`/dashboard/propostas/${payload.proposta.id}/analise`, { replace: true })
      }
      setData(payload)
      setSeries(payload.propostaSeries.map((s, i) => ({ ...s, ordem: i })))
      setAnalise(payload.analise)
      setTabelaSeries(payload.tabelaSeries)
      setTabelaTotal(payload.tabelaTotal)
      setCliente((c) => ({ ...c, nome: payload.proposta?.clienteNome && payload.proposta.clienteNome !== 'Cliente simulação' ? payload.proposta.clienteNome : c.nome }))
    } catch (e) {
      setErro(e.response?.data?.error || 'Não foi possível carregar a análise')
    } finally {
      setLoading(false)
    }
  }, [id, unidadeIdQ, navigate])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (!data || loading) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.post('/propostas/analise/preview', { tabelaId: data.tabela.id, unidadeId: data.unidade.id, series })
        setAnalise(res.data.analise)
        setTabelaSeries(res.data.tabelaSeries)
        setTabelaTotal(res.data.tabelaTotal)
      } catch { /* mantém último resultado */ }
    }, 450)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [series]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalProposta = useMemo(
    () => series.reduce((s, x) => s + (Number(x.valor) || 0) * (Number(x.quantidade) || 1), 0),
    [series]
  )
  const diferenca = Math.round((totalProposta - tabelaTotal) * 100) / 100

  const setSerie = (i, patch) => setSeries((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const removeSerie = (i) => setSeries((arr) => arr.filter((_, idx) => idx !== i))
  const addSerie = () => setSeries((arr) => [...arr, { nome: 'Nova série', tipo: 'pontual', inicioMes: new Date().getMonth() + 1, inicioAno: new Date().getFullYear(), quantidade: 1, valor: 0, periodicidade: 1, aposHabitese: false, ordem: arr.length }])
  const igualTabela = () => setSeries(tabelaSeries.map((s, i) => ({ ...s, ordem: i })))
  const aVista = () => setSeries([{ nome: 'À vista', tipo: 'ato', inicioMes: new Date().getMonth() + 1, inicioAno: new Date().getFullYear(), quantidade: 1, valor: Math.round(tabelaTotal * 100) / 100, periodicidade: 1, aposHabitese: false, ordem: 0 }])

  const salvar = async () => {
    setSaving(true); setErro('')
    try {
      const res = await api.put(`/propostas/${data.proposta.id}/series`, { series })
      setData(res.data); setAnalise(res.data.analise)
      setSeries(res.data.propostaSeries.map((s, i) => ({ ...s, ordem: i })))
      setTabelaTotal(res.data.tabelaTotal)
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  const enviar = async () => {
    setSaving(true); setErro('')
    try {
      await api.put(`/propostas/${data.proposta.id}/series`, { series })
      const res = await api.post(`/propostas/${data.proposta.id}/enviar`, { cliente })
      setEnviarOpen(false)
      alert(res.data.requerAprovacao
        ? 'Proposta enviada. Como há critérios fora do limite, a unidade ficou EM APROVAÇÃO com o gestor.'
        : 'Proposta enviada. A unidade foi para EM NEGOCIAÇÃO.')
      navigate('/dashboard/propostas')
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao enviar proposta') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner fullPage label="Carregando análise..." />
  if (erro && !data) return <Card><p className="ap-erro">{erro}</p><Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button></Card>

  const u = data.unidade
  const criterios = analise?.criterios || []
  const comp = analise?.comparativo || {}
  const ind = analise?.indicadores || {}
  const fluxo = analise?.fluxo || { colunas: [], linhas: [] }
  const readonly = ['aprovada', 'cancelada'].includes(data.proposta?.status)
  const falhas = criterios.filter((c) => !c.ok).map((c) => c.label)
  const aprovavel = analise?.aprovavel

  return (
    <div className="ap-page">
      <div className="ap-topbar">
        <div>
          <h1 className="page-title">Análise de proposta</h1>
          <p className="page-subtitle">{data.empreendimento.nome} · Unidade {u.identificacao || u.numero} · Tabela #{data.tabela.id}</p>
        </div>
        <div className="ap-topbar-actions">
          <Button variant="secondary" onClick={() => setFluxoOpen(true)}>Ver fluxo</Button>
          {!readonly && <Button variant="secondary" onClick={salvar} loading={saving}>Salvar rascunho</Button>}
          {!readonly && <Button onClick={() => setEnviarOpen(true)} disabled={diferenca !== 0}>Enviar proposta</Button>}
        </div>
      </div>

      {erro && <div className="ap-flash">{erro}</div>}

      {data.proposta?.status === 'aprovada' && (
        <div className="ap-banner ap-banner-ok">
          <span className="ap-banner-icon">✓</span>
          <div>
            <strong>Proposta aprovada</strong>
            <span>Próximo passo: <button className="ap-link" onClick={() => navigate(`/dashboard/propostas/${data.proposta.id}/comprador`)}>cadastrar o comprador</button>.</span>
          </div>
        </div>
      )}

      <div className={`ap-banner ${aprovavel ? 'ap-banner-ok' : 'ap-banner-warn'}`}>
        <span className="ap-banner-icon">{aprovavel ? '✓' : '!'}</span>
        <div>
          <strong>{aprovavel ? 'Proposta aprovável — segue direto para negociação' : 'Proposta requer aprovação do gestor'}</strong>
          {!aprovavel && falhas.length > 0 && <span>Fora do limite: {falhas.join(' · ')}</span>}
          {!aprovavel && analise?.formasOk === false && <span>Formas de pagamento não aceitas: {(analise.tiposForaDaLista || []).join(', ')}</span>}
        </div>
      </div>

      <div className="ap-kpis">
        <div className="ap-kpi"><small>Total da tabela</small><strong>{money(tabelaTotal)}</strong></div>
        <div className="ap-kpi"><small>Total da proposta</small><strong>{money(totalProposta)}</strong></div>
        <div className={`ap-kpi ${diferenca === 0 ? '' : 'ap-kpi-warn'}`}><small>Diferença</small><strong>{money(diferenca)}</strong></div>
        <div className={`ap-kpi ${ind.descontoNominal < 0 ? 'ap-kpi-neg' : ''}`}><small>Desconto nominal</small><strong>{money(ind.descontoNominal)}</strong><em>{pct(ind.descontoNominalPct)}{ind.descontoNominalMax != null ? ` · limite ${pct(-ind.descontoNominalMax)}` : ''}</em></div>
        <div className="ap-kpi"><small>Valor presente (proposta)</small><strong>{money(ind.valorPresenteProposta)}</strong><em>tabela {money(ind.valorPresenteTabela)}</em></div>
      </div>

      <Card padding="lg">
        <h2 className="ap-section-title">Sobre a unidade</h2>
        <div className="ap-unit-grid">
          <div><small>Unidade</small><strong>{u.identificacao || u.numero}</strong></div>
          <div><small>Dt. entrega</small><strong>{data.empreendimento.dataPrevisaoConstrucao ? new Date(data.empreendimento.dataPrevisaoConstrucao).toLocaleDateString('pt-BR') : '--'}</strong></div>
          <div><small>Tipologia</small><strong>{u.tipo || '--'}</strong></div>
          <div><small>Área privativa</small><strong>{u.area ? `${Number(u.area).toLocaleString('pt-BR')} m²` : '--'}</strong></div>
          <div><small>Vagas</small><strong>{u.vagas ?? '--'}</strong></div>
          <div><small>Validade da tabela</small><strong>{data.tabela.validadeInicio ? `${new Date(data.tabela.validadeInicio).toLocaleDateString('pt-BR')} a ${data.tabela.validadeFim ? new Date(data.tabela.validadeFim).toLocaleDateString('pt-BR') : '--'}` : '--'}</strong></div>
        </div>
      </Card>

      <div className="ap-two-col">
        <Card padding="lg">
          <h2 className="ap-section-title">Tabela de venda #{data.tabela.id}</h2>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr><th>Série</th><th>Início</th><th>Valor</th><th>Qtd</th><th>Total</th><th>%</th></tr></thead>
              <tbody>
                {tabelaSeries.map((s, i) => (
                  <tr key={i}>
                    <td>{s.nome}</td>
                    <td>{mesAno(s.inicioMes, s.inicioAno)}</td>
                    <td>{money(s.valor)}</td>
                    <td>{s.quantidade}</td>
                    <td>{money((Number(s.valor) || 0) * (Number(s.quantidade) || 1))}</td>
                    <td>{pct(s.percentualTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={4}>Total</td><td>{money(tabelaTotal)}</td><td>100%</td></tr></tfoot>
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
                <Button size="sm" variant="secondary" onClick={addSerie}>+ Série</Button>
              </div>
            )}
          </div>
          <div className="ap-table-wrap">
            <table className="ap-table ap-table-edit">
              <thead><tr><th>Série</th><th>Início</th><th>Qtd</th><th>Valor</th><th>Total</th><th /></tr></thead>
              <tbody>
                {series.map((s, i) => {
                  const total = (Number(s.valor) || 0) * (Number(s.quantidade) || 1)
                  return (
                    <tr key={i}>
                      <td>
                        <input className="ap-in ap-in-nome" value={s.nome} disabled={readonly} onChange={(e) => setSerie(i, { nome: e.target.value })} />
                        <select className="ap-in ap-in-tipo" value={s.tipo} disabled={readonly} onChange={(e) => setSerie(i, { tipo: e.target.value })}>
                          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="ap-inicio">
                        <input type="number" min="1" max="12" className="ap-in ap-in-xs" value={s.inicioMes} disabled={readonly} onChange={(e) => setSerie(i, { inicioMes: Number(e.target.value) })} />
                        <input type="number" className="ap-in ap-in-sm" value={s.inicioAno} disabled={readonly} onChange={(e) => setSerie(i, { inicioAno: Number(e.target.value) })} />
                      </td>
                      <td><input type="number" min="1" className="ap-in ap-in-xs" value={s.quantidade} disabled={readonly} onChange={(e) => setSerie(i, { quantidade: Number(e.target.value) })} /></td>
                      <td><input type="number" step="0.01" className="ap-in ap-in-md" value={s.valor} disabled={readonly} onChange={(e) => setSerie(i, { valor: Number(e.target.value) })} /></td>
                      <td>{money(total)}</td>
                      <td>{!readonly && series.length > 1 && <button className="ap-del" onClick={() => removeSerie(i)}>✕</button>}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className={diferenca === 0 ? 'ap-ok' : 'ap-warn'}>
                  <td colSpan={4}>Diferença: {money(diferenca)}</td>
                  <td>{money(totalProposta)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="ap-section-title">Resultado da análise de proposta</h2>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th /><th>Critério</th><th>Tabela</th><th>Proposta</th><th>Limite</th><th>Tolerância</th></tr></thead>
            <tbody>
              {criterios.map((c) => (
                <tr key={c.nome} className={c.ok ? '' : 'ap-row-bad'}>
                  <td><span className={`ap-dot ${c.ok ? 'ap-dot-ok' : 'ap-dot-bad'}`}>{c.ok ? '✓' : '✕'}</span></td>
                  <td>{c.label}</td>
                  <td>{criterioValor(c.tabela)}</td>
                  <td>{criterioValor(c.proposta)}</td>
                  <td>{criterioValor(c.limite)}</td>
                  <td>{criterioValor(c.tolerancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ap-fluxo-hint">Equivalência de fluxo: diferença de {money(ind.diferencaFluxo)}{ind.inicioDaPerda ? ` · início da perda em ${new Date(ind.inicioDaPerda).toLocaleDateString('pt-BR')}` : ''}. <button className="ap-link" onClick={() => setFluxoOpen(true)}>ver fluxo mês a mês</button></p>
      </Card>

      <div className="ap-two-col">
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
          </ul>
        </Card>
      </div>

      <Modal isOpen={fluxoOpen} onClose={() => setFluxoOpen(false)} title="Fluxo da proposta de compra e venda" size="xl">
        <div className="ap-table-wrap">
          <table className="ap-table ap-fluxo">
            <thead>
              <tr>
                <th>Mês/Ano</th>
                {fluxo.colunas.map((c) => <th key={c}>{c}</th>)}
                <th>Valor a ser pago</th><th>Acumulado</th><th>%=&gt;T</th><th>%=&gt;P</th>
              </tr>
            </thead>
            <tbody>
              {fluxo.linhas.map((l) => (
                <tr key={l.mesAno}>
                  <td>{fmtChave(l.mesAno)}</td>
                  {fluxo.colunas.map((c) => <td key={c}>{l.valores[c] ? money(l.valores[c]) : '—'}</td>)}
                  <td>{money(l.valorPago)}</td>
                  <td>{money(l.acumulado)}</td>
                  <td>{pct(l.pctSobreTabela)}</td>
                  <td>{pct(l.pctSobreProposta)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={fluxo.colunas.length + 1}>Total</td>
                <td>{money(fluxo.total)}</td>
                <td colSpan={3}>Total tabela: {money(fluxo.totalTabela)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Modal>

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
