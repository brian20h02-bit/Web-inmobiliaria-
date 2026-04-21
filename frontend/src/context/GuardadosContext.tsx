import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { PropiedadResumen } from './FavoritosContext'
import { useAuth } from './AuthContext'
import api from '../lib/api'

interface GuardadosContextType {
  guardados: PropiedadResumen[]
  isGuardado: (id: string) => boolean
  toggleGuardado: (p: PropiedadResumen) => void
  loading: boolean
}

const GuardadosContext = createContext<GuardadosContextType | null>(null)

const STORAGE_KEY = 'inm_guardados'

function loadFromStorage(): PropiedadResumen[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveToStorage(list: PropiedadResumen[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function GuardadosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [guardados, setGuardados] = useState<PropiedadResumen[]>([])
  const [loading, setLoading] = useState(false)

  // ── Cargar desde backend al loguear, limpiar al desloguear ──────────────────
  useEffect(() => {
    if (!user) {
      setGuardados([])
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    setLoading(true)
    api.get<{ guardados: unknown }>('/usuario/me')
      .then(res => {
        const list = Array.isArray(res.data.guardados) ? (res.data.guardados as PropiedadResumen[]) : []
        setGuardados(list)
        saveToStorage(list)
      })
      .catch(() => {
        setGuardados(loadFromStorage())
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  // ── Sync optimista con rollback en error ─────────────────────────────────────
  const toggleGuardado = useCallback(async (p: PropiedadResumen) => {
    if (!user) return

    setGuardados(prev => {
      const exists = prev.some(g => g.id === p.id)
      const next = exists ? prev.filter(g => g.id !== p.id) : [...prev, p]
      saveToStorage(next)

      api.put('/usuario/guardados', { guardados: next }).catch(() => {
        setGuardados(prev2 => {
          saveToStorage(prev2)
          return prev2
        })
      })

      return next
    })
  }, [user])

  function isGuardado(id: string) {
    return guardados.some(g => g.id === id)
  }

  return (
    <GuardadosContext.Provider value={{ guardados, isGuardado, toggleGuardado, loading }}>
      {children}
    </GuardadosContext.Provider>
  )
}

export function useGuardados() {
  const ctx = useContext(GuardadosContext)
  if (!ctx) throw new Error('useGuardados must be used within GuardadosProvider')
  return ctx
}

