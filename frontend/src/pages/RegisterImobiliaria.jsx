import React, { useState } from 'react'
import api from '../services/api'

export default function RegisterImobiliaria(){
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e){
    e.preventDefault();
    try{
      const res = await api.post('/imobiliarias', { nome, cnpj, email, telefone });
      setMsg('Registrado. Aguarde aprovação do super admin.');
    }catch(err){
      setMsg('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div>
      <h2>Registro de Imobiliária</h2>
      <form onSubmit={submit}>
        <div><input placeholder="Nome" value={nome} onChange={e=>setNome(e.target.value)} /></div>
        <div><input placeholder="CNPJ" value={cnpj} onChange={e=>setCnpj(e.target.value)} /></div>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input placeholder="Telefone" value={telefone} onChange={e=>setTelefone(e.target.value)} /></div>
        <button type="submit">Registrar</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
