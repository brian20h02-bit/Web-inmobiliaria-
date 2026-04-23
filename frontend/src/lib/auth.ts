const TOKEN_KEY = 'inmobiliaria_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface JWTPayload {
  id: string
  email: string
  rol: string
  nombre?: string
  exp?: number
}

export function getUser(): JWTPayload | null {
  const token = getToken()
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1])) as JWTPayload

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken()
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  const user = getUser()
  return user?.rol === 'ADMINISTRADOR' || user?.rol === 'administrador'
}
