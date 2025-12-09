import React, { useState } from 'react'
import api from '../services/api'

export default function CriarImovel(){
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      await api.post('/imoveis', { titulo, descricao, valor: parseFloat(valor), endereco, cidade, estado, status: 'disponível' })
      setMsg('Imóvel criado com sucesso')
      setTitulo('')
      setDescricao('')
      setValor('')
      setEndereco('')
      setCidade('')
      setEstado('')
    }catch(err){
      setMsg('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div>
      <h3>Criar Imóvel</h3>
      <form onSubmit={submit}>
        <div><input placeholder="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} /></div>
        <div><textarea placeholder="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)} /></div>
        <div><input type="number" placeholder="Valor" value={valor} onChange={e=>setValor(e.target.value)} /></div>
        <div><input placeholder="Endereço" value={endereco} onChange={e=>setEndereco(e.target.value)} /></div>
        <div><input placeholder="Cidade" value={cidade} onChange={e=>setCidade(e.target.value)} /></div>
        <div><input placeholder="Estado" value={estado} onChange={e=>setEstado(e.target.value)} /></div>
        <button type="submit">Criar</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
