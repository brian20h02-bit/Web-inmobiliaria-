import axios from 'axios'
import { getToken, removeToken } from './auth'

// Usar el mismo origen que el frontend si está en localhost, sino usar localhost:3001
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const baseURL = isLocalhost
  ? 'http://localhost:3001/api'
  : `${window.location.protocol}//${window.location.hostname}:3001/api`

const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
