import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import RegisterImobiliaria from './pages/RegisterImobiliaria'
import Dashboard from './pages/Dashboard'
import SuperAdmin from './pages/SuperAdmin'
import AguardandoAprovacao from './pages/AguardandoAprovacao'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './components/ui/Toast'
import PrivateRoute from './components/PrivateRoute'
import PublicCatalog from './pages/PublicCatalog'
import './styles/global.css'
import './styles/responsive.css'

export default function App(){
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Login/>} />
              <Route path="/login" element={<Login/>} />
              <Route path="/register-imobiliaria" element={<RegisterImobiliaria/>} />
              <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao/>} />
              <Route path="/catalogo/:token" element={<PublicCatalog/>} />
              <Route path="/dashboard/*" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
              <Route path="/super/*" element={<PrivateRoute requiredRole="super_admin"><SuperAdmin/></PrivateRoute>} />
            </Routes>
          </ToastProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  )
}
