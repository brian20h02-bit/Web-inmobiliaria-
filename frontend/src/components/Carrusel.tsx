import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

interface Propiedad {
  id: string
  titulo: string
  tipo: string
  imagenes: string[]
}

interface CarruselProps {
  propiedades: Propiedad[]
}

export default function Carrusel({ propiedades }: CarruselProps) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % propiedades.length)
  }, [propiedades.length])

  const prev = () => {
    setCurrent((c) => (c - 1 + propiedades.length) % propiedades.length)
  }

  useEffect(() => {
    if (propiedades.length === 0) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next, propiedades.length])

  if (propiedades.length === 0) return null

  const item = propiedades[current]

  return (
    <div className="carrusel">
      <button className="carrusel-btn carrusel-prev" onClick={prev} aria-label="Anterior">◀</button>
      <Link to={`/propiedades/${item.id}`} className="carrusel-slide">
        {item.imagenes?.[0] ? (
          <img src={item.imagenes[0]} alt={item.titulo} className="carrusel-img" />
        ) : (
          <div className="carrusel-placeholder" />
        )}
        <div className="carrusel-info">
          <span className="badge">{item.tipo}</span>
          <h2 className="carrusel-title">{item.titulo}</h2>
        </div>
      </Link>
      <button className="carrusel-btn carrusel-next" onClick={next} aria-label="Siguiente">▶</button>
      <div className="carrusel-dots">
        {propiedades.map((_, i) => (
          <button
            key={i}
            className={`carrusel-dot${i === current ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
