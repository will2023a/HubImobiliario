import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import './Imobiliarias.css'
import AppIcon from '../../components/ui/AppIcon'

export default function Imobiliarias() {
  const [imobiliarias, setImobiliarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: ''
  })

  useEffect(() => {
    loadImobiliarias()
  }, [])

  const loadImobiliarias = async () => {
    try {
      setLoading(true)
      const response = await api.get('/imobiliarias')
      setImobiliarias(response.data)
    } catch (error) {
      console.error('Erro ao carregar imobiliárias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, novoStatus) => {
    try {
      await api.patch(`/imobiliarias/${id}`, { status: novoStatus })
      loadImobiliarias()
      alert('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const handleCreateInput = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
  }

  const resetCreateForm = () => {
    setCreateForm({ nome: '', cnpj: '', email: '', telefone: '' })
    setCreateError('')
  }

  const closeCreateModal = () => {
    if (creating) return
    setShowCreateModal(false)
    resetCreateForm()
  }

  const handleCreateImobiliaria = async (e) => {
    e.preventDefault()
    setCreateError('')

    if (!createForm.nome || !createForm.cnpj || !createForm.email || !createForm.telefone) {
      setCreateError('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      setCreating(true)
      await api.post('/imobiliarias', createForm)
      await loadImobiliarias()
      setShowCreateModal(false)
      resetCreateForm()
      alert('Imobiliária criada com sucesso!')
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar imobiliária.'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  const filteredImobiliarias = imobiliarias.filter(imob => {
    const matchSearch = imob.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       imob.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
    const isPendente = imob.status === 'pendente' || imob.status === 'aguardando_aprovacao'
    const matchStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'pendente' ? isPendente : imob.status === filterStatus)
    return matchSearch && matchStatus
  })

  const statusConfig = {
    ativa: { label: 'Ativa', color: '#1a1a1a' },
    pendente: { label: 'Pendente', color: '#b8941f' },
    aguardando_aprovacao: { label: 'Pendente', color: '#b8941f' },
    inativa: { label: 'Inativa', color: '#666666' }
  }

  const stats = {
    total: imobiliarias.length,
    ativas: imobiliarias.filter(i => i.status === 'ativa').length,
    pendentes: imobiliarias.filter(i => i.status === 'pendente' || i.status === 'aguardando_aprovacao').length,
    inativas: imobiliarias.filter(i => i.status === 'inativa').length
  }

  return (
    <div className="imobiliarias-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Imobiliárias</h1>
          <p className="page-subtitle">Administração global de todas as imobiliárias</p>
        </div>
        <Button icon="+" onClick={() => setShowCreateModal(true)}>
          Criar Imobiliária
        </Button>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="building" /></div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="check" /></div>
          <div className="stat-content">
            <div className="stat-label">Ativas</div>
            <div className="stat-value">{stats.ativas}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="clock" /></div>
          <div className="stat-content">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{stats.pendentes}</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon"><AppIcon name="building" /></div>
          <div className="stat-content">
            <div className="stat-label">Inativas</div>
            <div className="stat-value">{stats.inativas}</div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="filters-section">
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="todos">Todos os Status</option>
            <option value="ativa">Ativa</option>
            <option value="pendente">Pendente</option>
            <option value="inativa">Inativa</option>
          </Select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando imobiliárias...</p>
          </div>
        ) : filteredImobiliarias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><AppIcon name="building" size={32} /></div>
            <h3>Nenhuma imobiliária encontrada</h3>
          </div>
        ) : (
          <div className="imobiliarias-table">
            <table>
              <thead>
                <tr>
                  <th>Imobiliária</th>
                  <th>CNPJ</th>
                  <th>Cidade/Estado</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredImobiliarias.map(imob => (
                  <tr key={imob.id}>
                    <td>
                      <div className="imob-info">
                        <strong>{imob.nome}</strong>
                        <span>{imob.email}</span>
                      </div>
                    </td>
                    <td>{imob.cnpj}</td>
                    <td>{imob.cidade}/{imob.estado}</td>
                    <td>{imob.admin?.name || 'N/A'}</td>
                    <td>
                      <span className="status-badge" style={{ 
                        background: statusConfig[imob.status]?.color 
                      }}>
                        {statusConfig[imob.status]?.icon} {statusConfig[imob.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {(imob.status === 'pendente' || imob.status === 'aguardando_aprovacao') && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStatusChange(imob.id, 'ativa')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(imob.id, 'inativa')}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {imob.status === 'ativa' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(imob.id, 'inativa')}
                          >
                            Desativar
                          </Button>
                        )}
                        {imob.status === 'inativa' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(imob.id, 'ativa')}
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Nova Imobiliária"
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={closeCreateModal} disabled={creating}>
              Cancelar
            </Button>
            <Button type="submit" form="create-imobiliaria-form" loading={creating}>
              Criar Imobiliária
            </Button>
          </>
        )}
      >
        <form id="create-imobiliaria-form" className="create-imob-form" onSubmit={handleCreateImobiliaria}>
          <Input
            label="Nome"
            placeholder="Nome da imobiliária"
            value={createForm.nome}
            onChange={(e) => handleCreateInput('nome', e.target.value)}
            required
            fullWidth
          />
          <Input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={createForm.cnpj}
            onChange={(e) => handleCreateInput('cnpj', e.target.value)}
            required
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            placeholder="contato@imobiliaria.com"
            value={createForm.email}
            onChange={(e) => handleCreateInput('email', e.target.value)}
            required
            fullWidth
          />
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={createForm.telefone}
            onChange={(e) => handleCreateInput('telefone', e.target.value)}
            required
            fullWidth
          />
          {createError && <p className="form-error">{createError}</p>}
        </form>
      </Modal>
    </div>
  )
}
