import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Leads(){
  const [leads, setLeads] = useState([])

  useEffect(()=>{
    api.get('/leads').then(r=>setLeads(r.data)).catch(console.error)
  }, [])

  return (
    <div>
      <h3>Leads</h3>
      <ul>
        {leads.map(l => <li key={l.id}>{l.nome} - {l.status}</li>)}
      </ul>
    </div>
  )
}
