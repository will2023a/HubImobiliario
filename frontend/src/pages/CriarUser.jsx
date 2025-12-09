import React, { useState } from 'react'
import api from '../services/api'

export default function CriarUser(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('corretor')
  const [msg, setMsg] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      await api.post('/users', { name, email, password, role })
      setMsg('Usuário criado com sucesso')
      setName('')
      setEmail('')
      setPassword('')
    }catch(err){
      setMsg('Erro: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div>
      <h3>Criar Usuário</h3>
      <form onSubmit={submit}>
        <div><input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="corretor">Corretor</option>
          </select>
        </div>
        <button type="submit">Criar</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
