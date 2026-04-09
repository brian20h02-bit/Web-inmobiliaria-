import { useState, useEffect } from 'react'
import Carrusel from '../components/Carrusel'
import PropiedadCard from '../components/PropiedadCard'
import api from '../lib/api'

const FILTROS = [
  { label: 'Ver todo', value: 'todo' },
  { label: 'Comprar', value: 'venta' },
  { label: 'Alquilar', value: 'alquiler' },
  { label: 'Otros', value: 'otro' },
]

interface Propiedad {
  id: string
  titulo: string
  descripcionPublica: string
  tipo: string
  imagenes: string[]
  destacada: boolean
}

export default function Home() {
  const [destacadas, setDestacadas] = useState<Propiedad[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [filtro, setFiltro] = useState('todo')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/propiedades/destacadas')
      .then((r) => setDestacadas(r.data))
      .catch(() => setDestacadas([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = filtro !== 'todo' ? { tipo: filtro.toUpperCase() } : {}
    api.get('/propiedades', { params })
      .then((r) => {
        const data = r.data
        setPropiedades(Array.isArray(data) ? data : data.propiedades ?? [])
      })
      .catch(() => setPropiedades([]))
      .finally(() => setLoading(false))
  }, [filtro])

  return (
    <div>
      {destacadas.length > 0 ? (
        <Carrusel propiedades={destacadas} />
      ) : (
        <div className="carrusel-empty">No hay propiedades destacadas en este momento.</div>
      )}

      <div className="filtros">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            className={`filtro-btn${filtro === f.value ? ' active' : ''}`}
            onClick={() => setFiltro(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Cargando propiedades…</div>
      ) : propiedades.length === 0 ? (
        <div className="empty">No hay propiedades disponibles.</div>
      ) : (
        <div className="grid">
          {propiedades.map((p) => (
            <PropiedadCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  )
}
