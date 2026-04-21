import { createContext, useContext, useState, ReactNode } from 'react'

interface PropiedadModalContextType {
  selectedId: string | null
  openModal: (id: string) => void
  closeModal: () => void
}

const PropiedadModalContext = createContext<PropiedadModalContextType | null>(null)

export function PropiedadModalProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openModal = (id: string) => setSelectedId(id)
  const closeModal = () => setSelectedId(null)

  return (
    <PropiedadModalContext.Provider value={{ selectedId, openModal, closeModal }}>
      {children}
    </PropiedadModalContext.Provider>
  )
}

export function usePropiedadModal() {
  const ctx = useContext(PropiedadModalContext)
  if (!ctx) throw new Error('usePropiedadModal must be used within PropiedadModalProvider')
  return ctx
}
