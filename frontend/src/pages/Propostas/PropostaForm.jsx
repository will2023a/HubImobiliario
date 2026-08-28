import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import AppIcon from '../../components/ui/AppIcon'
import MapaDisponibilidade from '../Empreendimentos/MapaDisponibilidade'
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
  const [mapOpen, setMapOpen] = useState(false)
  const [mapCandidate, setMapCandidate] = useState(null)
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

  const selectedEmpreendimento = empreendimentos.find(emp => Number(emp.id) === Number(selectedEmpId))
  const selectedUnidade = unidades.find(un => Number(un.id) === Number(formData.unidadeId))

  const selectEmpreendimento = event => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, unidadeId: '', valorProposta: '' }))
    setMapCandidate(null)
    if (value) loadUnidades(value)
    else { setSelectedEmpId(''); setUnidades([]) }
  }

  const openMap = () => {
    if (!selectedEmpId) return
    setMapCandidate(selectedUnidade || null)
    setMapOpen(true)
  }

  const confirmMapUnit = () => {
    if (!mapCandidate) return
    setFormData(prev => ({ ...prev, unidadeId: String(mapCandidate.id), valorProposta: String(mapCandidate.valorTotal || '') }))
    setMapOpen(false)
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
            <div className="proposta-section-heading"><div><h2 className="section-title">Unidade</h2><p>Escolha pelos campos ou consulte a posição no mapa do empreendimento.</p></div><Button type="button" variant="secondary" onClick={openMap} disabled={!selectedEmpId}><AppIcon name="building" /> Mapa de disponibilidade</Button></div>
            <div className="form-grid">
              <Select
                label="Empreendimento *"
                value={selectedEmpId}
                onChange={selectEmpreendimento}
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
                {unidades.filter(un => un.status === 'disponivel' || Number(un.id) === Number(formData.unidadeId)).map(un => (
                  <option key={un.id} value={un.id}>
                    {un.numero} - {un.tipo} - R$ {un.valorTotal?.toLocaleString('pt-BR')}
                  </option>
                ))}
              </Select>
            </div>
            {!selectedEmpId && <p className="map-helper">Selecione um empreendimento para liberar o mapa de disponibilidade.</p>}
            {selectedUnidade && <div className="proposal-unit-selected"><i><AppIcon name="check" /></i><div><small>UNIDADE SELECIONADA</small><strong>{selectedUnidade.identificacao || selectedUnidade.numero}</strong><span>{selectedEmpreendimento?.nome}{selectedUnidade.bloco ? ` · Bloco ${selectedUnidade.bloco}` : ''}</span></div><div><small>ÁREA PRIVATIVA</small><strong>{selectedUnidade.area ? `${Number(selectedUnidade.area).toLocaleString('pt-BR')} m²` : '—'}</strong></div><div><small>VALOR DE TABELA</small><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(selectedUnidade.valorTotal || 0)}</strong></div><b>Disponível</b></div>}
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
      <Modal isOpen={mapOpen} onClose={() => setMapOpen(false)} title={`Mapa de disponibilidade${selectedEmpreendimento ? ` · ${selectedEmpreendimento.nome}` : ''}`} size="xl">
        <div className="proposal-map-intro"><div><strong>Escolha a unidade visualmente</strong><span>Somente unidades disponíveis podem ser selecionadas para esta proposta.</span></div><span><i />{unidades.filter(un => un.status === 'disponivel').length} disponíveis</span></div>
        <MapaDisponibilidade unidades={unidades} empreendimentoNome={selectedEmpreendimento?.nome} empreendimentoId={selectedEmpId} selectionMode selectedId={mapCandidate?.id} onSelect={setMapCandidate} />
        <div className="proposal-map-footer">
          {mapCandidate ? <div><i><AppIcon name="building" /></i><p><small>SELECIONADA</small><strong>{mapCandidate.identificacao || mapCandidate.numero}</strong><span>{mapCandidate.bloco ? `Bloco ${mapCandidate.bloco} · ` : ''}{mapCandidate.area ? `${Number(mapCandidate.area).toLocaleString('pt-BR')} m² · ` : ''}{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(mapCandidate.valorTotal || 0)}</span></p></div> : <p>Selecione uma unidade disponível no mapa para continuar.</p>}
          <div><Button type="button" variant="secondary" onClick={() => setMapOpen(false)}>Cancelar</Button><Button type="button" onClick={confirmMapUnit} disabled={!mapCandidate}>Usar esta unidade</Button></div>
        </div>
      </Modal>
    </div>
  )
}
