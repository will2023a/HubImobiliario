import React, { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { Badge, Spinner, EmptyState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { getSocket } from '../../services/socket'
import './Inbox.css'

const canalIcons = { whatsapp: 'WA', instagram: 'IG', facebook: 'FB', email: 'EM', chat: 'CH' }
const canalColors = { whatsapp: '#1a1a1a', instagram: '#3d3d3d', facebook: '#666666', email: '#b8941f', chat: '#808080' }

export default function Inbox() {
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [filterCanal, setFilterCanal] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => { loadConversations() }, [filterCanal])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    socket.on('conversation:message', (msg) => {
      if (msg.conversationId === activeConv?.id) {
        setMessages(prev => [...prev, msg])
      }
      loadConversations() // refresh list
    })
    return () => socket?.off('conversation:message')
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      const params = filterCanal ? `?canal=${filterCanal}` : ''
      const res = await api.get(`/conversations${params}`)
      setConversations(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function selectConversation(conv) {
    setActiveConv(conv)
    setMsgLoading(true)
    try {
      const res = await api.get(`/conversations/${conv.id}/messages`)
      setMessages(res.data)
    } catch (err) { console.error(err) }
    finally { setMsgLoading(false) }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return
    setSending(true)
    try {
      const res = await api.post(`/conversations/${activeConv.id}/messages`, { content: newMessage })
      setMessages(prev => [...prev, res.data])
      setNewMessage('')
      loadConversations()
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  if (loading) return <Spinner fullPage label="Carregando inbox..." />

  return (
    <div className="inbox-page">
      {/* Conversation List */}
      <div className="inbox-sidebar">
        <div className="inbox-sidebar-header">
          <h3>Conversas</h3>
          <select className="inbox-filter" value={filterCanal} onChange={e => setFilterCanal(e.target.value)}>
            <option value="">Todos os canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="email">E-mail</option>
          </select>
        </div>

        <div className="inbox-conv-list">
          {conversations.length === 0 ? (
            <div className="inbox-empty-list">Nenhuma conversa</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`inbox-conv-item ${activeConv?.id === conv.id ? 'inbox-conv-active' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="inbox-conv-avatar" style={{ background: canalColors[conv.canal] || '#666' }}>
                  {canalIcons[conv.canal] || 'CH'}
                </div>
                <div className="inbox-conv-info">
                  <span className="inbox-conv-name">{conv.contactName}</span>
                  <span className="inbox-conv-preview">
                    {conv.messages?.[0]?.content?.slice(0, 40) || 'Sem mensagens'}
                  </span>
                </div>
                <div className="inbox-conv-meta">
                  <span className="inbox-conv-time">{timeAgo(conv.lastMessageAt)}</span>
                  <Badge variant={conv.status === 'aberta' ? 'success' : 'default'} size="sm">{conv.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="inbox-chat">
        {!activeConv ? (
          <div className="inbox-chat-empty">
            <EmptyState icon="💬" title="Selecione uma conversa" description="Escolha uma conversa na lista para visualizar as mensagens" />
          </div>
        ) : (
          <>
            <div className="inbox-chat-header">
              <div className="inbox-chat-contact">
                <span className="inbox-chat-canal" style={{ background: canalColors[activeConv.canal] }}>{canalIcons[activeConv.canal]}</span>
                <div>
                  <strong>{activeConv.contactName}</strong>
                  <span className="inbox-chat-phone">{activeConv.contactPhone || activeConv.contactEmail || ''}</span>
                </div>
              </div>
              <Badge variant={activeConv.status === 'aberta' ? 'success' : 'default'}>{activeConv.status}</Badge>
            </div>

            <div className="inbox-messages">
              {msgLoading ? <Spinner fullPage label="Carregando mensagens..." /> : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={`inbox-msg ${msg.direction === 'outbound' ? 'inbox-msg-out' : 'inbox-msg-in'}`}>
                      <div className="inbox-msg-bubble">
                        <p>{msg.content}</p>
                        <span className="inbox-msg-time">
                          {msg.senderName && <span className="inbox-msg-sender">{msg.senderName} • </span>}
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {msg.isAI && ' · IA'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="inbox-input" onSubmit={handleSend}>
              <input
                className="inbox-input-field"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <Button type="submit" size="sm" loading={sending} disabled={!newMessage.trim()}>
                Enviar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
