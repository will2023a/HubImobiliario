import axios from 'axios'

// Configuração da URL base da API usando variável de ambiente
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:2000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // prefer sessionStorage for per-session persistence
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const activeImobiliariaId = sessionStorage.getItem('activeImobiliariaId')
    if (activeImobiliariaId) config.headers['X-Imobiliaria-Id'] = activeImobiliariaId
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - fazer logout
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
