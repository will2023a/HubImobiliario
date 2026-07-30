import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'

const SocketContext = createContext()

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (user) {
      const token = sessionStorage.getItem('token')
      if (token) {
        const socket = connectSocket(token)
        
        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))

        return () => {
          disconnectSocket()
          setConnected(false)
        }
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket: getSocket(), connected }}>
      {children}
    </SocketContext.Provider>
  )
}
