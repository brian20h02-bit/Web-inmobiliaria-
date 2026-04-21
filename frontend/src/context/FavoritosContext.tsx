import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import api from '../lib/api'

export interface PropiedadResumen {
  id: string
  titulo: string
  tipo: string
  ubicacion?: string
  imagenUrl?: string
  precio?: number | string
}

interface FavoritosContextType {
  favoritos: PropiedadResumen[]
  isFavorito: (id: string) => boolean
  toggleFavorito: (p: PropiedadResumen) => void
  loading: boolean
}

const FavoritosContext = createContext<FavoritosContextType | null>(null)

const STORAGE_KEY = 'inm_favoritos'

function loadFromStorage(): PropiedadResumen[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveToStorage(list: PropiedadResumen[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favoritos, setFavoritos] = useState<PropiedadResumen[]>([])
  const [loading, setLoading] = useState(false)

  // ── Cargar desde backend al loguear, limpiar al desloguear ──────────────────
  useEffect(() => {
    if (!user) {
      setFavoritos([])
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    setLoading(true)
    api.get<{ favoritos: unknown }>('/usuario/me')
      .then(res => {
        const list = Array.isArray(res.data.favoritos) ? (res.data.favoritos as PropiedadResumen[]) : []
        setFavoritos(list)
        saveToStorage(list)
      })
      .catch(() => {
        // Fallback a localStorage si el backend no responde
        setFavoritos(loadFromStorage())
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  // ── Sync optimista con rollback en error ─────────────────────────────────────
  const toggleFavorito = useCallback(async (p: PropiedadResumen) => {
    if (!user) return

    setFavoritos(prev => {
      const exists = prev.some(f => f.id === p.id)
      const next = exists ? prev.filter(f => f.id !== p.id) : [...prev, p]
      saveToStorage(next)

      // Sync al backend en segundo plano (rollback si falla)
      api.put('/usuario/favoritos', { favoritos: next }).catch(() => {
        setFavoritos(prev2 => {
          // Revertir solo si el estado no cambió mientras tanto
          saveToStorage(prev2)
          return prev2
        })
      })

      return next
    })
  }, [user])

  function isFavorito(id: string) {
    return favoritos.some(f => f.id === id)
  }

  return (
    <FavoritosContext.Provider value={{ favoritos, isFavorito, toggleFavorito, loading }}>
      {children}
    </FavoritosContext.Provider>
  )
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext)
  if (!ctx) throw new Error('useFavoritos must be used within FavoritosProvider')
  return ctx
}

