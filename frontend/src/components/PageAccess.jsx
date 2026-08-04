import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function PageAccess({ page, edit = false, children }) {
  const { can } = useContext(AuthContext)
  if (!can(page, edit ? 'edit' : 'view')) return <Navigate to="/dashboard" replace />
  return children
}
