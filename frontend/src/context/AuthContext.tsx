import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getToken, setToken, removeToken, getUser } from '../lib/auth'

interface User {
  id: string
  email: string
  rol: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken)
  const [user, setUser] = useState<User | null>(getUser)

  useEffect(() => {
    const t = getToken()
    setTokenState(t)
    setUser(getUser())
  }, [])

  function login(newToken: string) {
    setToken(newToken)
    setTokenState(newToken)
    setUser(getUser())
  }

  function logout() {
    removeToken()
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
