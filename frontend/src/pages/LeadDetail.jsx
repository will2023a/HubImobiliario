import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function LeadDetail(){
  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [atendimentos, setAtendimentos] = useState([])
  const [mensagem, setMensagem] = useState('')

  useEffect(()=>{
    api.get(`/leads/${id}`)
      .then(r => {
        setLead(r.data)
        setAtendimentos(r.data.atendimentos || [])
      })
      .catch(console.error)
  }, [id])

  async function addAtendimento(e){
    e.preventDefault()
    try{
      await api.post('/atendimentos', { leadId: Number(id), mensagem })
      setMensagem('')
      // reload atendimentos
      const res = await api.get(`/atendimentos/${id}`)
      setAtendimentos(res.data)
    }catch(err){
      console.error(err)
    }
  }

  if(!lead) return <div>Carregando...</div>

  return (
    <div>
      <h3>Lead: {lead.nome}</h3>
      <p>Email: {lead.email}</p>
      <p>Telefone: {lead.telefone}</p>
      <p>Status: {lead.status}</p>
      <p>Origem: {lead.origem}</p>

      <h4>Histórico de Atendimentos</h4>
      <ul>
        {atendimentos.map(a => (
          <li key={a.id}>{a.mensagem} - {a.corretor?.name} ({new Date(a.createdAt).toLocaleString()})</li>
        ))}
      </ul>

      <form onSubmit={addAtendimento}>
        <textarea placeholder="Nova mensagem" value={mensagem} onChange={e=>setMensagem(e.target.value)} />
        <button type="submit">Adicionar Atendimento</button>
      </form>
    </div>
  )
}
