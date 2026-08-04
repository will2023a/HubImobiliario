import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Badge, Pagination, Spinner, EmptyState } from '../components/ui'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import './Imoveis.css'

const statusColors = {
  'disponível': 'success',
  'disponivel': 'success',
  'reservado': 'warning',
  'vendido': 'error',
  'inativo': 'default',
}

export default function Imoveis() {
  const [imoveis, setImoveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/imoveis')
      .then(res => setImoveis(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = imoveis.filter(i =>
    !search ||
    i.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(search.toLowerCase()) ||
    i.endereco?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) return <Spinner fullPage label="Carregando imóveis..." />

  return (
    <div className="imoveis-page">
      <div className="imoveis-header">
        <div>
          <h2 className="imoveis-title">Imóveis</h2>
          <p className="imoveis-subtitle">{filtered.length} imóve{filtered.length !== 1 ? 'is' : 'l'}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/create/imovel')}>+ Novo Imóvel</Button>
      </div>

      <div className="imoveis-filters">
        <input
          className="imoveis-search"
          type="text"
          placeholder="Buscar por título, cidade ou endereço..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="home"
          title="Nenhum imóvel encontrado"
          description="Cadastre imóveis para que sua equipe possa oferecê-los aos clientes."
          action={<Button onClick={() => navigate('/dashboard/create/imovel')}>Cadastrar Imóvel</Button>}
        />
      ) : (
        <>
          <div className="imoveis-grid">
            {paginated.map(imovel => (
              <Card key={imovel.id} hover padding="sm" className="imovel-card">
                <div className="imovel-card-body">
                  <h4 className="imovel-titulo">{imovel.titulo}</h4>
                  <p className="imovel-endereco">{imovel.cidade}, {imovel.estado}</p>
                  <div className="imovel-footer">
                    <span className="imovel-valor">
                      R$ {Number(imovel.valor).toLocaleString('pt-BR')}
                    </span>
                    <Badge variant={statusColors[imovel.status] || 'default'} size="sm">
                      {imovel.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
