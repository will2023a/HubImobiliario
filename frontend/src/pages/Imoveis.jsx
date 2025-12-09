import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Imoveis(){
  const [imoveis, setImoveis] = useState([])

  useEffect(()=>{
    api.get('/imoveis').then(r=>setImoveis(r.data)).catch(console.error)
  }, [])

  return (
    <div>
      <h3>Imóveis</h3>
      <ul>
        {imoveis.map(i => <li key={i.id}>{i.titulo} - R$ {i.valor}</li>)}
      </ul>
    </div>
  )
}
