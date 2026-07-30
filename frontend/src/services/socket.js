import { io } from 'socket.io-client'

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:2000'

let socket = null

export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    console.log('🔌 WebSocket conectado')
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket desconectado:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('🔌 Erro WebSocket:', error.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

export default { connectSocket, disconnectSocket, getSocket }
