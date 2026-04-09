import { Link } from 'react-router-dom'

interface PropiedadCardProps {
  id: string
  titulo: string
  descripcionPublica: string
  tipo: string
  imagenes: string[]
}

export default function PropiedadCard({ id, titulo, descripcionPublica, tipo, imagenes }: PropiedadCardProps) {
  return (
    <div className="card">
      <div className="card-img-wrapper">
        {imagenes?.[0] ? (
          <img src={imagenes[0]} alt={titulo} className="card-img" />
        ) : (
          <div className="card-img-placeholder" />
        )}
        <span className="badge card-badge">{tipo}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{titulo}</h3>
        <p className="card-desc">{descripcionPublica?.slice(0, 100)}{descripcionPublica?.length > 100 ? '…' : ''}</p>
        <Link to={`/propiedades/${id}`} className="btn btn-primary card-btn">Ver más →</Link>
      </div>
    </div>
  )
}
