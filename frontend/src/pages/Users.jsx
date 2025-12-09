import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Users(){
  const [users, setUsers] = useState([])

  useEffect(()=>{
    api.get('/users').then(r=>setUsers(r.data)).catch(console.error)
  }, [])

  return (
    <div>
      <h3>Corretores</h3>
      <ul>
        {users.map(u => <li key={u.id}>{u.name} - {u.email} - {u.role}</li>)}
      </ul>
    </div>
  )
}
