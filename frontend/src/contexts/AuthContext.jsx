import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    // Restaurar usuário do sessionStorage ao carregar
    try {
      const token = sessionStorage.getItem('token')
      const userStr = sessionStorage.getItem('user')
      
      if(token && userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error)
      sessionStorage.clear()
    } finally {
      setLoading(false)
    }
  }, [])

  function logout(){
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('activeImobiliariaId')
    setUser(null)
    window.location.href = '/login'
  }

  function switchImobiliaria(imobiliariaId) {
    sessionStorage.setItem('activeImobiliariaId', String(imobiliariaId))
    setUser(current => ({ ...current, imobiliariaId: Number(imobiliariaId) }))
    window.location.reload()
  }

  function can(page, action = 'view') {
    if (user?.role === 'super_admin' || user?.role === 'admin_imobiliaria') return true
    const rule = user?.access?.find(item => item.page === page)
    return action === 'edit' ? Boolean(rule?.canEdit) : Boolean(rule?.canView)
  }

  // Não renderizar até verificar se há sessão
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTopColor: '#d4af37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, can, switchImobiliaria }}>
      {children}
    </AuthContext.Provider>
  )
}
