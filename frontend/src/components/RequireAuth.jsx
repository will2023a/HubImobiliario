import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function RequireAuth({ children }){
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const token = sessionStorage.getItem('token')
  if(!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
