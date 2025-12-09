import React, { useState } from 'react'
import api from '../services/api'

export default function CriarLead(){
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [origem, setOrigem] = useState('site')
  const [msg, setMsg] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      await api.post('/leads', { nome, email, telefone, origem, status: 'novo' })
      setMsg('Lead criado com sucesso')
      setNome('')
      setEmail('')
      setTelefone('')
    }catch(err){
      setMsg('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div>
      <h3>Criar Lead</h3>
      <form onSubmit={submit}>
        <div><input placeholder="Nome" value={nome} onChange={e=>setNome(e.target.value)} /></div>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input placeholder="Telefone" value={telefone} onChange={e=>setTelefone(e.target.value)} /></div>
        <div>
          <select value={origem} onChange={e=>setOrigem(e.target.value)}>
            <option value="site">Site</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
        <button type="submit">Criar</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
