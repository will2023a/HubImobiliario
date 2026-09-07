import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui'
import './ParametrosAnalise.css'

const GRUPOS = [
  {
    titulo: 'Limites de captação',
    campos: [
      { key: 'prazoFinanciamentoMax', label: 'Prazo máx. de financiamento (meses)', tipo: 'int' },
      { key: 'captacaoAvistaMin', label: '% mín. de captação à vista', tipo: 'float' },
      { key: 'captacaoAteHabiteseMin', label: '% mín. de captação até habite-se', tipo: 'float' },
      { key: 'captacaoAteHabiteseMenos1Min', label: '% mín. de captação até habite-se − 1', tipo: 'float' },
      { key: 'captacaoMensalMaxParcela', label: '% máx. de uma parcela mensal (sobre o total)', tipo: 'float' },
      { key: 'diferencaAvMax', label: '% máx. de queda no valor à vista', tipo: 'float' },
      { key: 'descontoNominalMax', label: '% de desconto que aprova automaticamente', tipo: 'float' },
      { key: 'toleranciaGeral', label: 'Tolerância geral (%)', tipo: 'float' },
    ],
  },
  {
    titulo: 'Taxas financeiras',
    campos: [
      { key: 'taxaAtratividadeAntesHabitese', label: 'Taxa de atratividade — antes do habite-se (% a.m.)', tipo: 'float' },
      { key: 'taxaAtratividadeAposHabitese', label: 'Taxa de atratividade — após o habite-se (% a.m.)', tipo: 'float' },
      { key: 'taxaAtratividade', label: 'Taxa de atratividade única (% a.m.) — legado / fallback', tipo: 'float' },
      { key: 'taxaDescontoFluxo', label: 'Taxa de desconto de fluxo p/ PV líquido (% a.m.)', tipo: 'float' },
      { key: 'grl', label: 'GRL (%)', tipo: 'float' },
    ],
  },
]
const CAMPOS = GRUPOS.flatMap((g) => g.campos)

const FORMAS = [
  { key: 'ato', label: 'Ato / entrada' },
  { key: 'pontual', label: 'Pontuais (30/60/90dd)' },
  { key: 'mensal', label: 'Mensais' },
  { key: 'semestral', label: 'Semestrais' },
  { key: 'anual', label: 'Anuais' },
  { key: 'unica', label: 'Única / balão' },
  { key: 'financiamento', label: 'Financiamento' },
]

export default function ParametrosAnalise({ empreendimentoId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({})
  const [formas, setFormas] = useState([])

  useEffect(() => { load() }, [empreendimentoId])

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/empreendimentos/${empreendimentoId}/parametros-analise`)
      const data = res.data || {}
      const next = { exigirIntercalacao: Boolean(data.exigirIntercalacao) }
      CAMPOS.forEach((c) => { next[c.key] = data[c.key] ?? '' })
      next.dataReferenciaCaptacao = data.dataReferenciaCaptacao ? String(data.dataReferenciaCaptacao).slice(0, 10) : ''
      setForm(next)
      setFormas(Array.isArray(data.formasPagamento) && data.formasPagamento.length ? data.formasPagamento : FORMAS.map((f) => f.key))
    } catch { setMsg('Erro ao carregar parâmetros') }
    finally { setLoading(false) }
  }

  const toggleForma = (key) => setFormas((arr) => (arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]))

  async function salvar(e) {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      await api.put(`/empreendimentos/${empreendimentoId}/parametros-analise`, { ...form, formasPagamento: formas })
      setMsg('Parâmetros salvos.')
    } catch (e) { setMsg(e.response?.data?.error || 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner label="Carregando parâmetros..." />

  return (
    <form className="par-analise" onSubmit={salvar}>
      <div className="par-head">
        <div>
          <h3>Parâmetros de análise de proposta</h3>
          <p>Limites usados na simulação de venda, com base nesta tabela e no cadastro do empreendimento. Deixe em branco para não avaliar o critério.</p>
        </div>
      </div>

      {GRUPOS.map((g) => (
        <div key={g.titulo} className="par-bloco">
          <strong>{g.titulo}</strong>
          <div className="par-grid">
            {g.campos.map((c) => (
              <Input
                key={c.key}
                label={c.label}
                type="number"
                step={c.tipo === 'int' ? '1' : '0.01'}
                value={form[c.key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="par-bloco">
        <strong>Datas e regras</strong>
        <div className="par-grid">
          <Input
            label="Data de referência para “captação até a data”"
            type="date"
            value={form.dataReferenciaCaptacao ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, dataReferenciaCaptacao: e.target.value }))}
          />
        </div>
        <label className="par-check">
          <input type="checkbox" checked={Boolean(form.exigirIntercalacao)} onChange={(e) => setForm((f) => ({ ...f, exigirIntercalacao: e.target.checked }))} />
          Exigir intercalação de parcelas (semestrais/anuais entre as mensais)
        </label>
      </div>

      <div className="par-formas">
        <strong>Formas de pagamento aceitas</strong>
        <p>A proposta do cliente só pode usar séries destes tipos. Fora disso, o envio é bloqueado.</p>
        <div className="par-formas-grid">
          {FORMAS.map((f) => (
            <label key={f.key} className="par-check">
              <input type="checkbox" checked={formas.includes(f.key)} onChange={() => toggleForma(f.key)} />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <p className="par-nota">Propostas dentro de todos os limites e com desconto até o percentual de auto-aprovação seguem direto para negociação. Acima disso, vão para o gestor aprovar.</p>
      {msg && <p className="par-msg">{msg}</p>}
      <div className="par-actions"><Button type="submit" loading={saving}>Salvar parâmetros</Button></div>
    </form>
  )
}
