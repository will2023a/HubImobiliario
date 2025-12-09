import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import RegisterImobiliaria from './pages/RegisterImobiliaria'
import Dashboard from './pages/Dashboard'
import SuperAdmin from './pages/SuperAdmin'
import AguardandoAprovacao from './pages/AguardandoAprovacao'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import './styles/global.css'

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register-imobiliaria" element={<RegisterImobiliaria/>} />
        <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao/>} />
        <Route path="/dashboard/*" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
        <Route path="/super/*" element={<PrivateRoute requiredRole="super_admin"><SuperAdmin/></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  )
}
