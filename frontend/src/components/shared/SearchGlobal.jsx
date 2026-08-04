import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './SearchGlobal.css'
import AppIcon from '../ui/AppIcon'

export default function SearchGlobal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (!isOpen) onClose() // toggle via parent
      }
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const search = useCallback(async (term) => {
    if (term.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(term)}`)
      setResults(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(type, item) {
    onClose()
    setQuery('')
    setResults(null)
    switch (type) {
      case 'lead': navigate(`/dashboard/leads/${item.id}`); break
      case 'empreendimento': navigate(`/dashboard/empreendimentos/${item.id}`); break
      case 'imovel': navigate('/dashboard/imoveis'); break
      case 'proposta': navigate('/dashboard/propostas'); break
      default: break
    }
  }

  if (!isOpen) return null

  const hasResults = results && (
    results.leads?.length || results.imoveis?.length ||
    results.empreendimentos?.length || results.propostas?.length
  )

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <span className="search-input-icon"><AppIcon name="search" size={18} /></span>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Buscar leads, imóveis, empreendimentos..."
            value={query}
            onChange={handleChange}
          />
          <span className="search-input-esc">ESC</span>
        </div>

        {loading && <div className="search-loading">Buscando...</div>}

        {results && !loading && (
          <div className="search-results">
            {!hasResults && (
              <div className="search-empty">Nenhum resultado para "{query}"</div>
            )}

            {results.leads?.length > 0 && (
              <div className="search-section">
                <span className="search-section-label"><AppIcon name="users" size={15} /> Leads</span>
                {results.leads.map(item => (
                  <button key={item.id} className="search-item" onClick={() => handleSelect('lead', item)}>
                    <span className="search-item-name">{item.nome}</span>
                    <span className="search-item-meta">{item.telefone}</span>
                  </button>
                ))}
              </div>
            )}

            {results.empreendimentos?.length > 0 && (
              <div className="search-section">
                <span className="search-section-label"><AppIcon name="building" size={15} /> Empreendimentos</span>
                {results.empreendimentos.map(item => (
                  <button key={item.id} className="search-item" onClick={() => handleSelect('empreendimento', item)}>
                    <span className="search-item-name">{item.nome}</span>
                    <span className="search-item-meta">{item.cidade}</span>
                  </button>
                ))}
              </div>
            )}

            {results.imoveis?.length > 0 && (
              <div className="search-section">
                <span className="search-section-label"><AppIcon name="home" size={15} /> Imóveis</span>
                {results.imoveis.map(item => (
                  <button key={item.id} className="search-item" onClick={() => handleSelect('imovel', item)}>
                    <span className="search-item-name">{item.titulo}</span>
                    <span className="search-item-meta">R$ {Number(item.valor).toLocaleString('pt-BR')}</span>
                  </button>
                ))}
              </div>
            )}

            {results.propostas?.length > 0 && (
              <div className="search-section">
                <span className="search-section-label"><AppIcon name="document" size={15} /> Propostas</span>
                {results.propostas.map(item => (
                  <button key={item.id} className="search-item" onClick={() => handleSelect('proposta', item)}>
                    <span className="search-item-name">{item.clienteNome} {item.clienteSobrenome}</span>
                    <span className="search-item-meta">{item.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
