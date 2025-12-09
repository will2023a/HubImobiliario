import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { AuthContext } from '../../contexts/AuthContext'
import './EmpreendimentoForm.css'

export default function EmpreendimentoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const { user } = useContext(AuthContext)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imobiliarias, setImobiliarias] = useState([])
  const [formData, setFormData] = useState({
    nome: '',
    tipoUnidade: 'lote',
    quantidadeUnidades: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    imagemUrl: '',
    dataLancamento: '',
    dataPrevisaoConstrucao: '',
    contatoGerente1: '',
    nomeGerente1: '',
    contatoGerente2: '',
    nomeGerente2: '',
    contatoGerente3: '',
    nomeGerente3: '',
    imobiliariaId: ''
  })

  useEffect(() => {
    loadImobiliarias()
    if (isEdit) {
      loadEmpreendimento()
    } else if (user?.imobiliariaId) {
      // Se o usuário já tem imobiliária, preencher automaticamente
      setFormData(prev => ({ ...prev, imobiliariaId: user.imobiliariaId.toString() }))
    }
  }, [id, user])

  const loadImobiliarias = async () => {
    try {
      const response = await api.get('/imobiliarias')
      setImobiliarias(response.data)
    } catch (error) {
      console.error('Erro ao carregar imobiliárias:', error)
    }
  }

  const loadEmpreendimento = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/empreendimentos/${id}`)
      setFormData(response.data)
    } catch (error) {
      console.error('Erro ao carregar empreendimento:', error)
      alert('Erro ao carregar empreendimento')
      navigate('/dashboard/empreendimentos')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.tipoUnidade) {
      newErrors.tipoUnidade = 'Tipo de unidade é obrigatório'
    }

    if (!formData.quantidadeUnidades || formData.quantidadeUnidades <= 0) {
      newErrors.quantidadeUnidades = 'Quantidade de unidades deve ser maior que 0'
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório'
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória'
    }

    if (!formData.estado.trim()) {
      newErrors.estado = 'Estado é obrigatório'
    }

    if (!formData.imobiliariaId) {
      newErrors.imobiliariaId = 'Imobiliária é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      if (isEdit) {
        await api.patch(`/empreendimentos/${id}`, formData)
        alert('Empreendimento atualizado com sucesso!')
      } else {
        const payload = {
          ...formData,
          quantidadeUnidades: parseInt(formData.quantidadeUnidades),
          dataLancamento: formData.dataLancamento || undefined,
          dataPrevisaoConstrucao: formData.dataPrevisaoConstrucao || undefined
        }
        
        // Remover campos vazios
        Object.keys(payload).forEach(key => {
          if (payload[key] === '' || payload[key] === null) {
            delete payload[key]
          }
        })

        console.log('Enviando payload:', payload)
        const response = await api.post('/empreendimentos', payload)
        alert('Empreendimento criado com sucesso!')
        navigate(`/dashboard/empreendimentos/${response.data.id}`)
        return
      }

      navigate(`/dashboard/empreendimentos/${id}`)
    } catch (error) {
      console.error('Erro ao salvar empreendimento:', error)
      alert(error.response?.data?.error || 'Erro ao salvar empreendimento')
    } finally {
      setLoading(false)
    }
  }

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  return (
    <div className="empreendimento-form-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? '✏️ Editar Empreendimento' : '➕ Novo Empreendimento'}
          </h1>
          <p className="page-subtitle">
            {isEdit 
              ? 'Atualize as informações do empreendimento' 
              : 'Preencha os dados para criar um novo empreendimento'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="empreendimento-form">
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">📋 Informações Básicas</h2>
            
            <div className="form-grid">
              <div className="form-field-full">
                <Input
                  label="Nome do Empreendimento *"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  error={errors.nome}
                  placeholder="Ex: Residencial Jardim das Flores"
                  disabled={loading}
                />
              </div>

              <div className="form-field-full">
                <Select
                  label="Imobiliária *"
                  name="imobiliariaId"
                  value={formData.imobiliariaId}
                  onChange={handleChange}
                  error={errors.imobiliariaId}
                  disabled={loading || (user?.imobiliariaId && !isEdit)}
                >
                  <option value="">Selecione a imobiliária</option>
                  {imobiliarias.map(imob => (
                    <option key={imob.id} value={imob.id}>
                      {imob.nome}
                    </option>
                  ))}
                </Select>
                {user?.imobiliariaId && !isEdit && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Imobiliária preenchida automaticamente do seu cadastro
                  </p>
                )}
              </div>

              <div className="form-field">
                <Select
                  label="Tipo de Unidade *"
                  name="tipoUnidade"
                  value={formData.tipoUnidade}
                  onChange={handleChange}
                  error={errors.tipoUnidade}
                  disabled={loading}
                >
                  <option value="lote">Lote</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                </Select>
              </div>

              <div className="form-field">
                <Input
                  label="Quantidade de Unidades *"
                  type="number"
                  name="quantidadeUnidades"
                  value={formData.quantidadeUnidades}
                  onChange={handleChange}
                  error={errors.quantidadeUnidades}
                  placeholder="Ex: 100"
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">📍 Localização</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Bairro *"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  error={errors.bairro}
                  placeholder="Ex: Jardim Europa"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Cidade *"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  error={errors.cidade}
                  placeholder="Ex: São Paulo"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Select
                  label="Estado *"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  error={errors.estado}
                  disabled={loading}
                >
                  {estados.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">� Datas e Informações Adicionais</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Data de Lançamento"
                  type="date"
                  name="dataLancamento"
                  value={formData.dataLancamento}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Previsão de Construção"
                  type="date"
                  name="dataPrevisaoConstrucao"
                  value={formData.dataPrevisaoConstrucao}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-field-full">
                <Input
                  label="URL da Imagem"
                  name="imagemUrl"
                  value={formData.imagemUrl}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">👥 Contatos dos Gerentes</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Nome Gerente 1"
                  name="nomeGerente1"
                  value={formData.nomeGerente1}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 1"
                  name="contatoGerente1"
                  value={formData.contatoGerente1}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Nome Gerente 2"
                  name="nomeGerente2"
                  value={formData.nomeGerente2}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 2"
                  name="contatoGerente2"
                  value={formData.contatoGerente2}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Nome Gerente 3"
                  name="nomeGerente3"
                  value={formData.nomeGerente3}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 3"
                  name="contatoGerente3"
                  onChange={handleChange}
                  value={formData.contatoGerente3}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/empreendimentos')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? '⏳ Salvando...' : isEdit ? '💾 Atualizar' : '✅ Criar Empreendimento'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
