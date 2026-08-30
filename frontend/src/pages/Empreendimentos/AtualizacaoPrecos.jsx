import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge, EmptyState, Spinner } from '../../components/ui'
import './AtualizacaoPrecos.css'

const SITUACAO = {
  agendada: { label: 'Agendada', variant: 'warning' },
  processando: { label: 'Processando', variant: 'default' },
  concluida: { label: 'Concluído', variant: 'success' },
  cancelada: { label: 'Cancelado', variant: 'default' },
  erro: { label: 'Erro', variant: 'danger' },
}
const METODO_LABEL = { manter: 'Manter os dados atuais', percentual: 'Reajuste percentual (%)', valor_fixo: 'Acréscimo em valor fixo (R$)' }

const fmtDate = (d) => (d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

export default function AtualizacaoPrecos({ empreendimentoId, onChanged }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ titulo: '', justificativa: '', metodo: 'percentual', valorParametro: '', executarEm: '' })

  useEffect(() => { load() }, [empreendimentoId])

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/atualizacoes-preco/empreendimento/${empreendimentoId}`)
      setJobs(res.data)
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao carregar histórico') }
    finally { setLoading(false) }
  }

  async function criar(e) {
    e.preventDefault()
    setSaving(true); setErro('')
    try {
      await api.post('/atualizacoes-preco', {
        empreendimentoId: Number(empreendimentoId),
        titulo: form.titulo,
        justificativa: form.justificativa,
        metodo: form.metodo,
        valorParametro: form.metodo === 'manter' ? undefined : form.valorParametro,
        executarEm: form.executarEm || undefined,
      })
      setOpen(false)
      setForm({ titulo: '', justificativa: '', metodo: 'percentual', valorParametro: '', executarEm: '' })
      await load()
      onChanged?.()
    } catch (e) { setErro(e.response?.data?.error || 'Erro ao criar atualização') }
    finally { setSaving(false) }
  }

  async function acao(id, tipo) {
    if (tipo === 'desfazer' && !window.confirm('Desfazer restaura os preços anteriores de todas as unidades afetadas. Continuar?')) return
    try {
      await api.post(`/atualizacoes-preco/${id}/${tipo}`, {})
      await load()
      onChanged?.()
    } catch (e) { setErro(e.response?.data?.error || 'Não foi possível concluir a ação') }
  }

  if (loading) return <Spinner label="Carregando atualizações..." />

  return (
    <div className="atu-precos">
      <div className="atu-header">
        <div>
          <h3>Atualização de preço das unidades</h3>
          <p>Reajuste os preços de todas as unidades deste empreendimento de uma vez. Aplica na hora ou em data agendada.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>+ Nova atualização</Button>
      </div>

      {erro && <div className="atu-flash">{erro}</div>}

      {jobs.length === 0 ? (
        <EmptyState icon="🏷️" title="Nenhuma atualização" description="As atualizações de preço deste empreendimento aparecem aqui." />
      ) : (
        <div className="atu-table-wrap">
          <table className="atu-table">
            <thead><tr><th>#</th><th>Título</th><th>Método</th><th>Inclusão</th><th>Executar em</th><th>Criado por</th><th>Situação</th><th>Unid.</th><th /></tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.id}</td>
                  <td>{j.titulo}{j.justificativa ? <div className="atu-sub">{j.justificativa}</div> : null}</td>
                  <td>{METODO_LABEL[j.metodo]}{j.valorParametro != null ? ` · ${j.valorParametro}` : ''}</td>
                  <td>{fmtDate(j.createdAt)}</td>
                  <td>{j.executarEm ? fmtDate(j.executarEm) : (j.executadaEm ? fmtDate(j.executadaEm) : 'Imediata')}</td>
                  <td>{j.criadoPor?.name || '—'}</td>
                  <td><Badge variant={SITUACAO[j.situacao]?.variant || 'default'} size="sm">{SITUACAO[j.situacao]?.label || j.situacao}</Badge>{j.erroMensagem ? <div className="atu-sub">{j.erroMensagem}</div> : null}</td>
                  <td>{j.qtdUnidades}</td>
                  <td className="atu-acoes">
                    {j.situacao === 'agendada' && <button onClick={() => acao(j.id, 'cancelar')}>Cancelar</button>}
                    {j.situacao === 'concluida' && j.metodo !== 'manter' && <button onClick={() => acao(j.id, 'desfazer')}>Desfazer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title="Atualização de preço das unidades" size="md">
        <form onSubmit={criar} className="atu-form">
          <Input label="Título *" placeholder="Ex: Atualização tabela - Fevereiro" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} fullWidth required />
          <Textarea label="Justificativa" placeholder="Escreva por que você está atualizando os preços" value={form.justificativa} onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))} rows={2} fullWidth />
          <Select label="Método de atualização" value={form.metodo} onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))} fullWidth>
            {Object.entries(METODO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          {form.metodo !== 'manter' && (
            <Input
              label={form.metodo === 'percentual' ? 'Percentual (%) — use negativo para reduzir' : 'Valor fixo (R$) — use negativo para reduzir'}
              type="number" step="0.01" value={form.valorParametro}
              onChange={(e) => setForm((f) => ({ ...f, valorParametro: e.target.value }))} fullWidth required
            />
          )}
          <Input label="Agendar execução para" type="datetime-local" value={form.executarEm} onChange={(e) => setForm((f) => ({ ...f, executarEm: e.target.value }))} fullWidth />
          <p className="atu-hint">Deixe a data vazia para aplicar imediatamente.</p>
          {erro && <p className="atu-flash">{erro}</p>}
          <div className="atu-form-actions">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar atualização</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
