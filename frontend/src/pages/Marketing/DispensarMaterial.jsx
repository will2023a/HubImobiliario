import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import './DispensarMaterial.css'

export default function DispensarMaterial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    quantidade: '',
    dispensadoPara: '',
    observacoes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post(`/marketing/${id}/dispensar`, {
        quantidade: parseInt(formData.quantidade),
        dispensadoPara: formData.dispensadoPara,
        observacoes: formData.observacoes
      })
      alert('Material dispensado com sucesso!')
      navigate('/dashboard/marketing')
    } catch (error) {
      console.error('Erro ao dispensar material:', error)
      alert(error.response?.data?.error || 'Erro ao dispensar material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dispensar-page">
      <div className="page-header">
        <h1 className="page-title">Dispensar Material</h1>
        <p className="page-subtitle">Registre a saída de material do estoque</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">Informações da Dispensação</h2>
            <div className="form-grid">
              <Input
                label="Quantidade *"
                type="number"
                name="quantidade"
                value={formData.quantidade}
                onChange={handleChange}
                min="1"
                required
              />
              <Input
                label="Dispensado Para *"
                name="dispensadoPara"
                value={formData.dispensadoPara}
                onChange={handleChange}
                placeholder="Nome da pessoa ou imobiliária"
                required
              />
              <div className="form-field-full">
                <Textarea
                  label="Observações"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Motivo da dispensação, evento, etc."
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
              {loading ? 'Salvando...' : 'Confirmar Dispensação'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
