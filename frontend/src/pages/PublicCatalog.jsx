import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import ImageGallery from '../components/shared/ImageGallery'
import MiniMap from '../components/shared/MiniMap'
import './PublicCatalog.css'

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function PublicCatalog() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get(`/catalogo-publico/${token}`).then(response => setData(response.data)).catch(err => setError(err.response?.data?.error || 'Catálogo indisponível')) }, [token])
  if (error) return <main className="public-catalog public-state"><h1>Catálogo indisponível</h1><p>{error}</p></main>
  if (!data) return <main className="public-catalog public-state"><p>Carregando catálogo...</p></main>
  const emp = data.empreendimento
  return <main className="public-catalog">
    <header className="public-hero" style={emp.imagemUrl ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.18)), url(${emp.imagemUrl})` } : {}}>
      <div><span className="public-eyebrow">Apresentação comercial</span><h1>{emp.nome}</h1><p>{emp.endereco || `${emp.bairro}, ${emp.cidade} - ${emp.estado}`}</p></div>
    </header>
    <section className="public-summary">
      <div><span>Status</span><strong>{emp.status}</strong></div><div><span>Entrega</span><strong>{emp.dataPrevisaoConstrucao ? new Date(emp.dataPrevisaoConstrucao).toLocaleDateString('pt-BR') : 'Consulte'}</strong></div><div><span>Área</span><strong>{emp.areaMin ? `${emp.areaMin} a ${emp.areaMax || emp.areaMin} m²` : 'Consulte'}</strong></div><div><span>Quartos</span><strong>{emp.quartosMin ?? 'Consulte'}</strong></div>
    </section>
    {emp.descricao && <section className="public-section"><h2>O empreendimento</h2><p>{emp.descricao}</p></section>}
    <section className="public-section"><h2>Galeria</h2><ImageGallery images={emp.galeria || []} /></section>
    {emp.videoUrl && <section className="public-section"><h2>Vídeo</h2><a href={emp.videoUrl} target="_blank" rel="noreferrer">Assistir apresentação</a></section>}
    {emp.unidades && <section className="public-section"><h2>Disponibilidade</h2><div className="public-units">{emp.unidades.map(unit => <article key={unit.id}><strong>{unit.identificacao || unit.numero}</strong><span>{unit.tipo || emp.tipoUnidade}</span><span>{unit.area ? `${unit.area} m²` : ''}</span><span className="public-unit-status">{unit.status}</span>{unit.valorTotal !== undefined && <b>{money(unit.valorTotal)}</b>}</article>)}</div></section>}
    {emp.tabelasPreco?.length > 0 && <section className="public-section"><h2>Condições comerciais</h2>{emp.tabelasPreco.map(table => <div key={table.id}><h3>{table.nome}</h3>{table.itens.map(item => <p key={item.id}>{item.descricao}: <strong>{money(item.valor)}</strong></p>)}</div>)}</section>}
    {emp.documentos?.length > 0 && <section className="public-section"><h2>Downloads e anexos</h2><div className="public-documents">{emp.documentos.map(doc => <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer">{doc.nome}</a>)}</div></section>}
    <section className="public-section"><h2>Localização</h2><MiniMap latitude={emp.latitude} longitude={emp.longitude} endereco={emp.endereco} /></section>
  </main>
}
