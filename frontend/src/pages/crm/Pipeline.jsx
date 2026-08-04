import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, Badge, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import './Pipeline.css'

const defaultStages = [
  { nome: 'Novo', ordem: 1, cor: '#d4af37' },
  { nome: 'Contato', ordem: 2, cor: '#b8941f' },
  { nome: 'Qualificado', ordem: 3, cor: '#999999' },
  { nome: 'Visita', ordem: 4, cor: '#808080' },
  { nome: 'Proposta', ordem: 5, cor: '#666666' },
  { nome: 'Fechado', ordem: 6, cor: '#1a1a1a' },
  { nome: 'Perdido', ordem: 7, cor: '#3d3d3d' },
]

const tempColors = { quente: 'hot', morno: 'warm', frio: 'cold' }

export default function Pipeline() {
  const [stages, setStages] = useState([])
  const [pipelineLeads, setPipelineLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState(null)

  useEffect(() => {
    loadPipeline()
  }, [])

  async function loadPipeline() {
    try {
      let stagesRes = await api.get('/pipeline/stages')
      let stagesData = stagesRes.data

      // If no stages and user has imobiliaria, create defaults
      if ((!stagesData || stagesData.length === 0)) {
        try {
          await api.post('/pipeline/stages', { stages: defaultStages })
          stagesRes = await api.get('/pipeline/stages')
          stagesData = stagesRes.data
        } catch (e) {
          // User might not have imobiliaria (super_admin)
          stagesData = defaultStages.map((s, i) => ({ id: i + 1, ...s, _count: { leads: 0 } }))
        }
      }

      setStages(stagesData)

      const leadsRes = await api.get('/pipeline/leads')
      setPipelineLeads(leadsRes.data)
    } catch (err) {
      console.error('Erro ao carregar pipeline:', err)
    } finally {
      setLoading(false)
    }
  }

  function getLeadsForStage(stageId) {
    return pipelineLeads.filter(pl => pl.stageId === stageId)
  }

  function handleDragStart(e, pipelineLeadId) {
    setDraggingId(pipelineLeadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e, targetStageId) {
    e.preventDefault()
    if (!draggingId) return

    // Optimistic update
    setPipelineLeads(prev => prev.map(pl =>
      pl.id === draggingId ? { ...pl, stageId: targetStageId } : pl
    ))
    setDraggingId(null)

    try {
      await api.put(`/pipeline/leads/${draggingId}/stage`, { stageId: targetStageId })
    } catch (err) {
      console.error('Erro ao mover lead:', err)
      loadPipeline() // Revert on error
    }
  }

  function getDaysInStage(enteredStageAt) {
    if (!enteredStageAt) return 0
    const diff = Date.now() - new Date(enteredStageAt).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) return <Spinner fullPage label="Carregando pipeline..." />

  return (
    <div className="pipeline-page">
      <div className="pipeline-header">
        <div>
          <h2 className="pipeline-title">Pipeline de Vendas</h2>
          <p className="pipeline-subtitle">{pipelineLeads.length} lead{pipelineLeads.length !== 1 ? 's' : ''} no funil</p>
        </div>
      </div>

      <div className="pipeline-board">
        {stages.map(stage => {
          const stageLeads = getLeadsForStage(stage.id)
          return (
            <div
              key={stage.id}
              className={`pipeline-column ${draggingId ? 'pipeline-column-droppable' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="pipeline-column-header" style={{ borderTopColor: stage.cor }}>
                <span className="pipeline-column-name">{stage.nome}</span>
                <span className="pipeline-column-count">{stageLeads.length}</span>
              </div>

              <div className="pipeline-column-body">
                {stageLeads.length === 0 ? (
                  <div className="pipeline-column-empty">Sem leads</div>
                ) : (
                  stageLeads.map(pl => (
                    <div
                      key={pl.id}
                      className="pipeline-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, pl.id)}
                    >
                      <div className="pipeline-card-header">
                        <span className="pipeline-card-name">{pl.lead?.nome}</span>
                        <Badge variant={tempColors[pl.temperatura] || 'default'} size="sm">
                          {pl.temperatura}
                        </Badge>
                      </div>
                      <div className="pipeline-card-meta">
                        {pl.lead?.telefone && <span>{pl.lead.telefone}</span>}
                      </div>
                      <div className="pipeline-card-footer">
                        <span className="pipeline-card-corretor">
                          {pl.lead?.corretor?.name || 'Sem corretor'}
                        </span>
                        <span className="pipeline-card-days">
                          {getDaysInStage(pl.enteredStageAt)}d
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
