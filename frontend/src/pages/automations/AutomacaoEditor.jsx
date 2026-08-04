import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, { addEdge, applyNodeChanges, applyEdgeChanges, Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import { Badge, Spinner } from '../../components/ui'
import './AutomacaoEditor.css'

const nodeTypes = {}

const NODE_TEMPLATES = [
  { type: 'trigger', label: '⚡ Gatilho', color: '#10b981' },
  { type: 'condition', label: '❓ Condição', color: '#f59e0b' },
  { type: 'wait', label: '⏱️ Espera', color: '#8b5cf6' },
  { type: 'action_whatsapp', label: '💬 Enviar WhatsApp', color: '#25d366' },
  { type: 'action_email', label: '✉️ Enviar E-mail', color: '#3b82f6' },
  { type: 'action_task', label: '✓ Criar Tarefa', color: '#06b6d4' },
  { type: 'action_pipeline', label: '🔀 Mover Pipeline', color: '#ec4899' },
  { type: 'action_assign', label: '👤 Atribuir Corretor', color: '#f97316' },
  { type: 'ai_decide', label: '🤖 IA Decide', color: '#6366f1' },
]

export default function AutomacaoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [automation, setAutomation] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadAutomation() }, [id])

  async function loadAutomation() {
    try {
      const res = await api.get(`/automations/${id}`)
      setAutomation(res.data)
      setNodes(res.data.nodes || [])
      setEdges(res.data.edges || [])
    } catch (err) {
      console.error(err)
      navigate('/dashboard/automacoes')
    } finally {
      setLoading(false)
    }
  }

  const onNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds))
    setSaved(false)
  }, [])

  const onEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds))
    setSaved(false)
  }, [])

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#d4af37' } }, eds))
    setSaved(false)
  }, [])

  function addNode(template) {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'default',
      position: { x: 250 + Math.random() * 200, y: 100 + nodes.length * 120 },
      data: {
        label: template.label,
        nodeType: template.type,
      },
      style: {
        background: template.color + '15',
        border: `2px solid ${template.color}`,
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 500,
      }
    }
    setNodes(prev => [...prev, newNode])
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/automations/${id}`, { nodes, edges })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleToggle() {
    try {
      await api.put(`/automations/${id}/toggle`)
      loadAutomation()
    } catch (err) { console.error(err) }
  }

  if (loading) return <Spinner fullPage label="Carregando editor..." />

  return (
    <div className="automation-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/automacoes')}>← Voltar</Button>
          <span className="editor-name">{automation?.nome}</span>
          <Badge variant={automation?.status === 'ativo' ? 'success' : 'default'} size="sm">{automation?.status}</Badge>
        </div>
        <div className="editor-toolbar-right">
          {saved && <span className="editor-saved">✓ Salvo</span>}
          <Button size="sm" variant="outline" onClick={handleToggle}>
            {automation?.status === 'ativo' ? 'Pausar' : 'Ativar'}
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>Salvar Fluxo</Button>
        </div>
      </div>

      <div className="editor-content">
        {/* Node Palette */}
        <div className="editor-palette">
          <h4 className="palette-title">Nós</h4>
          <div className="palette-nodes">
            {NODE_TEMPLATES.map(t => (
              <button
                key={t.type}
                className="palette-node"
                onClick={() => addNode(t)}
                style={{ borderLeftColor: t.color }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="editor-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            deleteKeyCode="Delete"
          >
            <Background color="#e0e0e0" gap={20} />
            <Controls />
            <MiniMap nodeStrokeColor="#d4af37" nodeColor="#fef3c7" />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
