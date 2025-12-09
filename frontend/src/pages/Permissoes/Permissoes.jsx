import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import './Permissoes.css'

export default function Permissoes() {
  const [permissoes, setPermissoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  const roles = [
    { id: 'admin_imobiliaria', label: 'Admin Imobiliária', icon: '⚙️' },
    { id: 'diretor', label: 'Diretor', icon: '👔' },
    { id: 'gerente', label: 'Gerente', icon: '📊' },
    { id: 'corretor', label: 'Corretor', icon: '🤝' }
  ]

  const recursos = [
    { id: 'empreendimentos', label: 'Empreendimentos', icon: '🏢' },
    { id: 'unidades', label: 'Unidades', icon: '🏠' },
    { id: 'propostas', label: 'Propostas', icon: '📄' },
    { id: 'leads', label: 'Leads', icon: '👤' },
    { id: 'imoveis', label: 'Imóveis', icon: '🏘️' },
    { id: 'users', label: 'Usuários', icon: '👥' },
    { id: 'permissoes', label: 'Permissões', icon: '🔐' }
  ]

  const acoes = ['criar', 'ler', 'atualizar', 'deletar']

  useEffect(() => {
    loadPermissoes()
  }, [])

  const loadPermissoes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/permissoes')
      setPermissoes(response.data)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      // Inicializar com estrutura vazia se não existir
      const initialPermissoes = []
      roles.forEach(role => {
        recursos.forEach(recurso => {
          acoes.forEach(acao => {
            initialPermissoes.push({
              role: role.id,
              recurso: recurso.id,
              acao,
              permitido: false
            })
          })
        })
      })
      setPermissoes(initialPermissoes)
    } finally {
      setLoading(false)
    }
  }

  const togglePermissao = (role, recurso, acao) => {
    setPermissoes(prev => {
      const index = prev.findIndex(p => 
        p.role === role && p.recurso === recurso && p.acao === acao
      )
      
      if (index >= 0) {
        const newPermissoes = [...prev]
        newPermissoes[index] = { ...newPermissoes[index], permitido: !newPermissoes[index].permitido }
        setHasChanges(true)
        return newPermissoes
      }
      return prev
    })
  }

  const isPermitido = (role, recurso, acao) => {
    const perm = permissoes.find(p => 
      p.role === role && p.recurso === recurso && p.acao === acao
    )
    return perm?.permitido || false
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await api.post('/permissoes/bulk', { permissoes })
      alert('Permissões atualizadas com sucesso!')
      setHasChanges(false)
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      alert('Erro ao salvar permissões')
    } finally {
      setLoading(false)
    }
  }

  const acaoLabels = {
    criar: 'Criar',
    ler: 'Ler',
    atualizar: 'Editar',
    deletar: 'Excluir'
  }

  return (
    <div className="permissoes-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Permissões</h1>
          <p className="page-subtitle">Configure o que cada cargo pode fazer no sistema</p>
        </div>
        {hasChanges && (
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            Salvar Alterações
          </Button>
        )}
      </div>

      {loading && !hasChanges ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando permissões...</p>
        </div>
      ) : (
        <div className="permissoes-grid">
          {recursos.map(recurso => (
            <Card key={recurso.id} padding="lg" className="recurso-card">
              <div className="recurso-header">
                <span className="recurso-icon">{recurso.icon}</span>
                <h3 className="recurso-title">{recurso.label}</h3>
              </div>

              <div className="permissoes-matrix">
                <div className="matrix-header">
                  <div className="matrix-cell header-cell">Ação</div>
                  {roles.map(role => (
                    <div key={role.id} className="matrix-cell header-cell">
                      <div className="role-header">
                        <span>{role.icon}</span>
                        <span>{role.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {acoes.map(acao => (
                  <div key={acao} className="matrix-row">
                    <div className="matrix-cell action-cell">
                      {acaoLabels[acao]}
                    </div>
                    {roles.map(role => (
                      <div key={role.id} className="matrix-cell">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={isPermitido(role.id, recurso.id, acao)}
                            onChange={() => togglePermissao(role.id, recurso.id, acao)}
                          />
                          <span className="checkbox-custom"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
