import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui'
import './ParametrosAnalise.css'

const CAMPOS = [
  { key: 'prazoFinanciamentoMax', label: 'Prazo máx. de financiamento (meses)', tipo: 'int' },
  { key: 'captacaoAvistaMin', label: '% mín. de captação à vista', tipo: 'float' },
  { key: 'captacaoAteHabiteseMin', label: '% mín. de captação até habite-se', tipo: 'float' },
  { key: 'captacaoMensalMin', label: '% mín. de captação mensal', tipo: 'float' },
  { key: 'diferencaAvMax', label: '% máx. de queda no valor à vista', tipo: 'float' },
  { key: 'descontoNominalMax', label: '% de desconto que aprova automaticamente', tipo: 'float' },
  { key: 'taxaAtratividade', label: 'Taxa de atratividade (% a.m.)', tipo: 'float' },
  { key: 'toleranciaGeral', label: 'Tolerância geral (%)', tipo: 'float' },
]

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

      <div className="par-grid">
        {CAMPOS.map((c) => (
          <Input
            key={c.key}
            label={c.label}
            type="number"
            step={c.tipo === 'int' ? '1' : '0.01'}
            value={form[c.key] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
          />
        ))}
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
