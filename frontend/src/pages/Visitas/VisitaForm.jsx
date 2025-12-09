import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import './VisitaForm.css'

export default function VisitaForm() {
  const navigate = useNavigate()
  const { id: empIdFromParams } = useParams()
  const [loading, setLoading] = useState(false)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [imobiliarias, setImobiliarias] = useState([])
  const [atendentes, setAtendentes] = useState([])
  const [formData, setFormData] = useState({
    nomeVisitante: '',
    telefoneVisitante: '',
    emailVisitante: '',
    tipo: 'agendada',
    empreendimentoId: empIdFromParams || '',
    unidadeId: '',
    imobiliariaId: '',
    atendenteId: '',
    dataVisita: new Date().toISOString().slice(0, 16),
    observacoes: ''
  })

  useEffect(() => {
    loadInitialData()
    if (empIdFromParams) {
      loadUnidades(empIdFromParams)
    }
  }, [empIdFromParams])

  const loadInitialData = async () => {
    try {
      const [empRes, imobRes, userRes] = await Promise.all([
        api.get('/empreendimentos'),
        api.get('/imobiliarias'),
        api.get('/users')
      ])
      setEmpreendimentos(empRes.data)
      setImobiliarias(imobRes.data)
      setAtendentes(userRes.data.filter(u => ['corretor', 'gerente', 'diretor'].includes(u.role)))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const loadUnidades = async (empId) => {
    try {
      const response = await api.get(`/empreendimentos/${empId}`)
      setUnidades(response.data.unidades || [])
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'empreendimentoId' && value) {
      loadUnidades(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/visitas', {
        ...formData,
        empreendimentoId: parseInt(formData.empreendimentoId),
        unidadeId: parseInt(formData.unidadeId),
        imobiliariaId: parseInt(formData.imobiliariaId),
        atendenteId: parseInt(formData.atendenteId)
      })
      alert('Visita registrada com sucesso!')
      if (empIdFromParams) {
        navigate(`/dashboard/empreendimentos/${empIdFromParams}`)
      } else {
        navigate('/dashboard/visitas')
      }
    } catch (error) {
      console.error('Erro ao registrar visita:', error)
      alert(error.response?.data?.error || 'Erro ao registrar visita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="visita-form-page">
      <div className="page-header">
        <h1 className="page-title">Registrar Nova Visita</h1>
        <p className="page-subtitle">Preencha os dados da visita ao stand</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">Dados do Visitante</h2>
            <div className="form-grid">
              <div className="form-field-full">
                <Input
                  label="Nome Completo *"
                  name="nomeVisitante"
                  value={formData.nomeVisitante}
                  onChange={handleChange}
                  required
                />
              </div>
              <Input
                label="Telefone *"
                name="telefoneVisitante"
                value={formData.telefoneVisitante}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                type="email"
                name="emailVisitante"
                value={formData.emailVisitante}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">Detalhes da Visita</h2>
            <div className="form-grid">
              <Select
                label="Tipo de Visita *"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="agendada">Agendada</option>
                <option value="espontanea">Espontânea</option>
              </Select>
              <Input
                label="Data e Hora *"
                type="datetime-local"
                name="dataVisita"
                value={formData.dataVisita}
                onChange={handleChange}
                required
              />
              <Select
                label="Empreendimento *"
                name="empreendimentoId"
                value={formData.empreendimentoId}
                onChange={(e) => {
                  handleChange(e)
                  loadUnidades(e.target.value)
                }}
                required
                disabled={!!empIdFromParams}
              >
                <option value="">Selecione...</option>
                {empreendimentos.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </Select>
              <Select
                label="Unidade Visitada"
                name="unidadeId"
                value={formData.unidadeId}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {unidades.map(un => (
                  <option key={un.id} value={un.id}>
                    {un.numero} - {un.tipo}
                  </option>
                ))}
              </Select>
              <Select
                label="Imobiliária"
                name="imobiliariaId"
                value={formData.imobiliariaId}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {imobiliarias.map(imob => (
                  <option key={imob.id} value={imob.id}>{imob.nome}</option>
                ))}
              </Select>
              <Select
                label="Atendido Por *"
                name="atendenteId"
                value={formData.atendenteId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione...</option>
                {atendentes.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
              <div className="form-field-full">
                <Textarea
                  label="Observações"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Detalhes sobre a visita, interesse demonstrado, etc."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/visitas')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Visita'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
