import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import './PropostaForm.css'

export default function PropostaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const empIdFromUrl = searchParams.get('empreendimentoId')
  const unidadeIdFromUrl = searchParams.get('unidadeId')
  
  const [loading, setLoading] = useState(false)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(empIdFromUrl || '')
  const [formData, setFormData] = useState({
    unidadeId: unidadeIdFromUrl || '',
    clienteNome: '',
    clienteEmail: '',
    clienteTelefone: '',
    clienteCPF: '',
    clienteEndereco: '',
    formaPagamento: 'a_vista',
    valorProposta: '',
    observacoes: ''
  })

  useEffect(() => {
    loadEmpreendimentos()
    if (empIdFromUrl) {
      loadUnidades(empIdFromUrl)
    }
  }, [empIdFromUrl])

  const loadEmpreendimentos = async () => {
    try {
      const response = await api.get('/empreendimentos')
      setEmpreendimentos(response.data)
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error)
    }
  }

  const loadUnidades = async (empId) => {
    try {
      const response = await api.get(`/empreendimentos/${empId}`)
      setUnidades(response.data.unidades || [])
      setSelectedEmpId(empId)
      
      // Se tiver unidadeId na URL, pré-preencher o valor
      if (unidadeIdFromUrl) {
        const unidade = response.data.unidades?.find(u => u.id === parseInt(unidadeIdFromUrl))
        if (unidade) {
          setFormData(prev => ({ ...prev, valorProposta: unidade.valorTotal.toString() }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/propostas', {
        ...formData,
        valorProposta: parseFloat(formData.valorProposta)
      })
      alert('Proposta criada com sucesso!')
      navigate('/dashboard/propostas')
    } catch (error) {
      console.error('Erro ao criar proposta:', error)
      alert(error.response?.data?.error || 'Erro ao criar proposta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="proposta-form-page">
      <div className="page-header">
        <h1 className="page-title">Nova Proposta Comercial</h1>
        <p className="page-subtitle">Preencha os dados para criar uma nova proposta</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">Unidade</h2>
            <div className="form-grid">
              <Select
                label="Empreendimento *"
                value={selectedEmpId}
                onChange={(e) => loadUnidades(e.target.value)}
                required
                disabled={!!empIdFromUrl}
              >
                <option value="">Selecione...</option>
                {empreendimentos.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </Select>
              <Select
                label="Unidade *"
                name="unidadeId"
                value={formData.unidadeId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione...</option>
                {unidades.map(un => (
                  <option key={un.id} value={un.id}>
                    {un.numero} - {un.tipo} - R$ {un.valorTotal?.toLocaleString('pt-BR')}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">Dados do Cliente</h2>
            <div className="form-grid">
              <div className="form-field-full">
                <Input
                  label="Nome Completo *"
                  name="clienteNome"
                  value={formData.clienteNome}
                  onChange={handleChange}
                  required
                />
              </div>
              <Input
                label="Email *"
                type="email"
                name="clienteEmail"
                value={formData.clienteEmail}
                onChange={handleChange}
                required
              />
              <Input
                label="Telefone *"
                name="clienteTelefone"
                value={formData.clienteTelefone}
                onChange={handleChange}
                required
              />
              <Input
                label="CPF *"
                name="clienteCPF"
                value={formData.clienteCPF}
                onChange={handleChange}
                required
              />
              <div className="form-field-full">
                <Input
                  label="Endereço"
                  name="clienteEndereco"
                  value={formData.clienteEndereco}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">Condições Comerciais</h2>
            <div className="form-grid">
              <Select
                label="Forma de Pagamento *"
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={handleChange}
                required
              >
                <option value="a_vista">À Vista</option>
                <option value="parcelado_30_60_90">Parcelado 30/60/90 dias</option>
                <option value="mensal">Mensal</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="financiamento">Financiamento Bancário</option>
              </Select>
              <Input
                label="Valor da Proposta *"
                type="number"
                name="valorProposta"
                value={formData.valorProposta}
                onChange={handleChange}
                step="0.01"
                required
              />
              <div className="form-field-full">
                <Textarea
                  label="Observações"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/propostas')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Proposta'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
