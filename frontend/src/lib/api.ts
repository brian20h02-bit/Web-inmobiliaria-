import axios from 'axios'
import { getToken, removeToken } from './auth'

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001/api'

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
    // Don't redirect on 401 for delete-account — let the caller handle it
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !url.includes('/auth/cuenta')) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
