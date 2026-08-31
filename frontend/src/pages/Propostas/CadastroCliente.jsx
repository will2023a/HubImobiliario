import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Spinner } from '../../components/ui'
import './CadastroCliente.css'

const CAMPOS_TEXTO = ['nome', 'sobrenome', 'cpf', 'rg', 'orgaoExpedidor', 'nacionalidade', 'estadoCivil', 'profissao', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'conjugeNome', 'conjugeCpf', 'conjugeRg', 'conjugeProfissao', 'observacoes']
const vazio = () => ({ ...Object.fromEntries(CAMPOS_TEXTO.map((k) => [k, ''])), nacionalidade: 'Brasileira', dataNascimento: '', rendaMensal: '', conjugeRendaMensal: '', leadId: '' })
const COM_CONJUGE = ['casado', 'uniao_estavel']

export default function CadastroCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [meta, setMeta] = useState(null)
  const [leads, setLeads] = useState([])
  const [form, setForm] = useState(vazio())

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const { data } = await api.get(`/propostas/${id}/cliente`)
      setMeta(data.proposta)
      setLeads(data.leads || [])
      if (data.cliente) {
        const c = data.cliente
        setForm({
          ...vazio(),
          ...Object.fromEntries(CAMPOS_TEXTO.map((k) => [k, c[k] ?? ''])),
          dataNascimento: c.dataNascimento ? c.dataNascimento.slice(0, 10) : '',
          rendaMensal: c.rendaMensal ?? '',
          conjugeRendaMensal: c.conjugeRendaMensal ?? '',
          leadId: c.leadId ? String(c.leadId) : '',
        })
      } else {
        setForm((f) => ({ ...f, nome: data.proposta?.clienteNome && data.proposta.clienteNome !== 'Cliente simulação' ? data.proposta.clienteNome : '' }))
      }
    } catch (e) {
      setErro(e.response?.data?.error || 'Não foi possível carregar o cadastro')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const temConjuge = COM_CONJUGE.includes(form.estadoCivil)

  async function salvar(e) {
    e.preventDefault()
    setSaving(true); setErro(''); setOk('')
    try {
      const { data } = await api.put(`/propostas/${id}/cliente`, { ...form, leadId: form.leadId || null })
      setOk(data.concluido ? 'Cadastro do cliente concluído.' : 'Cadastro salvo (ainda faltam campos obrigatórios para concluir).')
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner fullPage label="Carregando cadastro..." />
  if (erro && !meta) return <Card><p className="cli-erro">{erro}</p><Button variant="secondary" onClick={() => navigate('/dashboard/propostas')}>Voltar</Button></Card>

  return (
    <div className="cli-page">
      <div className="page-header">
        <h1 className="page-title">Cadastro do cliente</h1>
        <p className="page-subtitle">{meta?.empreendimento} · Unidade {meta?.unidade} · Proposta #{meta?.id}</p>
      </div>

      {meta?.status !== 'aprovada' && (
        <div className="cli-flash cli-flash-warn">Esta proposta ainda não está aprovada. O cliente só pode ser cadastrado depois da aprovação do gestor.</div>
      )}
      {erro && <div className="cli-flash cli-flash-err">{erro}</div>}
      {ok && <div className="cli-flash cli-flash-ok">{ok}</div>}

      <form onSubmit={salvar}>
        <Card padding="lg">
          <h2 className="cli-sec">Dados pessoais</h2>
          <div className="cli-grid">
            <Input label="Nome *" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
            <Input label="Sobrenome" value={form.sobrenome} onChange={(e) => set('sobrenome', e.target.value)} />
            <Input label="CPF *" value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            <Input label="RG" value={form.rg} onChange={(e) => set('rg', e.target.value)} />
            <Input label="Órgão expedidor" value={form.orgaoExpedidor} onChange={(e) => set('orgaoExpedidor', e.target.value)} />
            <Input label="Data de nascimento" type="date" value={form.dataNascimento} onChange={(e) => set('dataNascimento', e.target.value)} />
            <Input label="Nacionalidade" value={form.nacionalidade} onChange={(e) => set('nacionalidade', e.target.value)} />
            <Select label="Estado civil" value={form.estadoCivil} onChange={(e) => set('estadoCivil', e.target.value)}>
              <option value="">Selecione...</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="uniao_estavel">União estável</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viuvo">Viúvo(a)</option>
            </Select>
            <Input label="Profissão" value={form.profissao} onChange={(e) => set('profissao', e.target.value)} />
            <Input label="Renda mensal (R$)" type="number" step="0.01" value={form.rendaMensal} onChange={(e) => set('rendaMensal', e.target.value)} />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Telefone" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="cli-sec">Endereço</h2>
          <div className="cli-grid">
            <Input label="CEP" value={form.cep} onChange={(e) => set('cep', e.target.value)} />
            <Input label="Logradouro" value={form.logradouro} onChange={(e) => set('logradouro', e.target.value)} />
            <Input label="Número" value={form.numero} onChange={(e) => set('numero', e.target.value)} />
            <Input label="Complemento" value={form.complemento} onChange={(e) => set('complemento', e.target.value)} />
            <Input label="Bairro" value={form.bairro} onChange={(e) => set('bairro', e.target.value)} />
            <Input label="Cidade" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
            <Input label="Estado (UF)" value={form.estado} onChange={(e) => set('estado', e.target.value)} maxLength={2} />
          </div>
        </Card>

        {temConjuge && (
          <Card padding="lg">
            <h2 className="cli-sec">Cônjuge / co-participante</h2>
            <div className="cli-grid">
              <Input label="Nome do cônjuge" value={form.conjugeNome} onChange={(e) => set('conjugeNome', e.target.value)} />
              <Input label="CPF do cônjuge" value={form.conjugeCpf} onChange={(e) => set('conjugeCpf', e.target.value)} placeholder="000.000.000-00" />
              <Input label="RG do cônjuge" value={form.conjugeRg} onChange={(e) => set('conjugeRg', e.target.value)} />
              <Input label="Profissão do cônjuge" value={form.conjugeProfissao} onChange={(e) => set('conjugeProfissao', e.target.value)} />
              <Input label="Renda mensal do cônjuge (R$)" type="number" step="0.01" value={form.conjugeRendaMensal} onChange={(e) => set('conjugeRendaMensal', e.target.value)} />
            </div>
          </Card>
        )}

        <Card padding="lg">
          <h2 className="cli-sec">Vínculo e observações</h2>
          <div className="cli-grid">
            <Select label="Vincular a um lead do CRM" value={form.leadId} onChange={(e) => set('leadId', e.target.value)}>
              <option value="">Sem vínculo</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.nome}{l.telefone ? ` · ${l.telefone}` : ''}</option>)}
            </Select>
          </div>
          <Textarea label="Observações" value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} />
        </Card>

        <div className="cli-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/propostas')}>Voltar às propostas</Button>
          <Button type="submit" loading={saving} disabled={meta?.status !== 'aprovada'}>Salvar cadastro</Button>
        </div>
      </form>
    </div>
  )
}
