import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import './MarketingForm.css'

export default function MarketingForm() {
  const navigate = useNavigate()
  const { id: empIdFromParams } = useParams()
  const [loading, setLoading] = useState(false)
  const [empreendimentos, setEmpreendimentos] = useState([])
  const [formData, setFormData] = useState({
    tipo: 'banner',
    empreendimentoId: empIdFromParams || '',
    quantidadeInicial: '',
    descricao: ''
  })

  useEffect(() => {
    loadEmpreendimentos()
  }, [])

  const loadEmpreendimentos = async () => {
    try {
      const response = await api.get('/empreendimentos')
      setEmpreendimentos(response.data)
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error)
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
      await api.post('/marketing', {
        ...formData,
        empreendimentoId: parseInt(formData.empreendimentoId),
        quantidadeInicial: parseInt(formData.quantidadeInicial),
        quantidadeEstoque: parseInt(formData.quantidadeInicial)
      })
      alert('Material adicionado ao estoque!')
      if (empIdFromParams) {
        navigate(`/dashboard/empreendimentos/${empIdFromParams}`)
      } else {
        navigate('/dashboard/marketing')
      }
    } catch (error) {
      console.error('Erro ao adicionar material:', error)
      alert(error.response?.data?.error || 'Erro ao adicionar material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="marketing-form-page">
      <div className="page-header">
        <h1 className="page-title">Adicionar Material ao Estoque</h1>
        <p className="page-subtitle">Registre novos banners ou folders</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">Informações do Material</h2>
            <div className="form-grid">
              <Select
                label="Tipo de Material *"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="banner">Banner</option>
                <option value="folder">Folder</option>
              </Select>
              <Select
                label="Empreendimento *"
                name="empreendimentoId"
                value={formData.empreendimentoId}
                onChange={handleChange}
                required
                disabled={!!empIdFromParams}
              >
                <option value="">Selecione...</option>
                {empreendimentos.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </Select>
              <Input
                label="Quantidade Inicial *"
                type="number"
                name="quantidadeInicial"
                value={formData.quantidadeInicial}
                onChange={handleChange}
                min="1"
                required
              />
              <div className="form-field-full">
                <Textarea
                  label="Descrição"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Detalhes sobre o material (tamanho, características, etc.)"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/marketing')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Adicionar ao Estoque'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
