import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function PrivateRoute({ children, requiredRole }){
  const { user } = useContext(AuthContext)
  
  if(!user) return <Navigate to="/login" />
  if(requiredRole && user.role !== requiredRole) return <div>Acesso negado</div>
  
  return children
}
