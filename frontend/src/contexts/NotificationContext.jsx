import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from './AuthContext'
import { getSocket } from '../services/socket'
import api from '../services/api'

const NotificationContext = createContext()

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load initial notifications
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  // Listen for real-time notifications
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    function handleNewNotification(notification) {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('notification:new', handleNewNotification)
    return () => socket.off('notification:new', handleNewNotification)
  }, [user])

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications?limit=20')
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch (err) {
      // Silently fail — notifications are non-critical
    }
  }

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loadNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}
