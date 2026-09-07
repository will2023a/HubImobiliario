import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import AppIcon from '../../components/ui/AppIcon'
import MapaDisponibilidade from '../Empreendimentos/MapaDisponibilidade'
import './PropostaForm.css'

// Passo 1 da proposta: escolher a unidade. A partir daqui abre a análise
// estilo Anapro (/propostas/simular) — tabela por séries pré-preenchida,
// botão de adicionar série, cálculo por linha e análise ao vivo.
export default function PropostaForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const empIdFromUrl = searchParams.get('empreendimentoId')
  const unidadeIdFromUrl = searchParams.get('unidadeId')

  const [empreendimentos, setEmpreendimentos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(empIdFromUrl || '')
  const [unidadeId, setUnidadeId] = useState(unidadeIdFromUrl || '')
  const [mapOpen, setMapOpen] = useState(false)
  const [mapCandidate, setMapCandidate] = useState(null)

  const irParaAnalise = (uId) => {
    if (!uId) return
    const emp = selectedEmpId || empIdFromUrl
    navigate(`/dashboard/propostas/simular?${emp ? `empreendimentoId=${emp}&` : ''}unidadeId=${uId}`)
  }

  useEffect(() => {
    loadEmpreendimentos()
    if (empIdFromUrl) loadUnidades(empIdFromUrl)
    // Já veio com a unidade na URL (ex.: "Gerar proposta" numa unidade): pula direto.
    if (unidadeIdFromUrl) irParaAnalise(unidadeIdFromUrl)
  }, [empIdFromUrl]) // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const selectedEmpreendimento = empreendimentos.find(emp => Number(emp.id) === Number(selectedEmpId))
  const selectedUnidade = unidades.find(un => Number(un.id) === Number(unidadeId))

  const selectEmpreendimento = event => {
    const value = event.target.value
    setUnidadeId('')
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
    setMapOpen(false)
    irParaAnalise(mapCandidate.id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    irParaAnalise(unidadeId)
  }

  return (
    <div className="proposta-form-page">
      <div className="page-header">
        <h1 className="page-title">Nova Proposta Comercial</h1>
        <p className="page-subtitle">Escolha a unidade — a análise da proposta (séries, condições e cálculo) abre em seguida.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <div className="form-section">
            <div className="proposta-section-heading">
              <div><h2 className="section-title">Unidade</h2><p>Escolha pelos campos ou consulte a posição no mapa do empreendimento.</p></div>
              <Button type="button" variant="secondary" onClick={openMap} disabled={!selectedEmpId}><AppIcon name="building" /> Mapa de disponibilidade</Button>
            </div>
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
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {unidades.filter(un => un.status === 'disponivel' || Number(un.id) === Number(unidadeId)).map(un => (
                  <option key={un.id} value={un.id}>
                    {un.numero} - {un.tipo} - R$ {un.valorTotal?.toLocaleString('pt-BR')}
                  </option>
                ))}
              </Select>
            </div>
            {!selectedEmpId && <p className="map-helper">Selecione um empreendimento para liberar o mapa de disponibilidade.</p>}
            {selectedUnidade && (
              <div className="proposal-unit-selected">
                <i><AppIcon name="check" /></i>
                <div><small>UNIDADE SELECIONADA</small><strong>{selectedUnidade.identificacao || selectedUnidade.numero}</strong><span>{selectedEmpreendimento?.nome}{selectedUnidade.bloco ? ` · Bloco ${selectedUnidade.bloco}` : ''}</span></div>
                <div><small>ÁREA PRIVATIVA</small><strong>{selectedUnidade.area ? `${Number(selectedUnidade.area).toLocaleString('pt-BR')} m²` : '—'}</strong></div>
                <div><small>VALOR DE TABELA</small><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedUnidade.valorTotal || 0)}</strong></div>
                <b>Disponível</b>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/propostas')}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!unidadeId}>Abrir análise da proposta</Button>
          </div>
        </Card>
      </form>

      <Modal isOpen={mapOpen} onClose={() => setMapOpen(false)} title={`Mapa de disponibilidade${selectedEmpreendimento ? ` · ${selectedEmpreendimento.nome}` : ''}`} size="xl">
        <div className="proposal-map-intro"><div><strong>Escolha a unidade visualmente</strong><span>Somente unidades disponíveis podem ser selecionadas para esta proposta.</span></div><span><i />{unidades.filter(un => un.status === 'disponivel').length} disponíveis</span></div>
        <MapaDisponibilidade unidades={unidades} empreendimentoNome={selectedEmpreendimento?.nome} empreendimentoId={selectedEmpId} selectionMode selectedId={mapCandidate?.id} onSelect={setMapCandidate} />
        <div className="proposal-map-footer">
          {mapCandidate ? <div><i><AppIcon name="building" /></i><p><small>SELECIONADA</small><strong>{mapCandidate.identificacao || mapCandidate.numero}</strong><span>{mapCandidate.bloco ? `Bloco ${mapCandidate.bloco} · ` : ''}{mapCandidate.area ? `${Number(mapCandidate.area).toLocaleString('pt-BR')} m² · ` : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mapCandidate.valorTotal || 0)}</span></p></div> : <p>Selecione uma unidade disponível no mapa para continuar.</p>}
          <div><Button type="button" variant="secondary" onClick={() => setMapOpen(false)}>Cancelar</Button><Button type="button" onClick={confirmMapUnit} disabled={!mapCandidate}>Usar esta unidade</Button></div>
        </div>
      </Modal>
    </div>
  )
}
