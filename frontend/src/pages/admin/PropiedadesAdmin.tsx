import { useState, useEffect, FormEvent } from 'react'
import api from '../../lib/api'

interface Propiedad {
  id: string
  titulo: string
  tipo: string
  precio: number
  ubicacion: string
  activa: boolean
  destacada: boolean
  imagenes: string[]
}

export default function PropiedadesAdmin() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'VENTA' | 'ALQUILER'>('VENTA')
  const [descripcion, setDescripcion] = useState('')
  const [titulo, setTitulo] = useState('')
  const [precio, setPrecio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [contacto, setContacto] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function loadPropiedades() {
    api.get('/propiedades?porPagina=100')
      .then((r) => setPropiedades(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPropiedades([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPropiedades() }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  function resetForm() {
    setImageFile(null)
    setImagePreview(null)
    setTipo('VENTA')
    setDescripcion('')
    setTitulo('')
    setPrecio('')
    setUbicacion('')
    setContacto('')
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!titulo.trim()) { setError('El título es requerido.'); return }
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) { setError('El precio debe ser mayor a 0.'); return }
    if (!ubicacion.trim()) { setError('La ubicación es requerida.'); return }
    if (!contacto.trim()) { setError('El contacto es requerido.'); return }
    if (!descripcion.trim()) { setError('La descripción es requerida.'); return }

    setSaving(true)
    try {
      let imagenBase64: string | undefined
      if (imageFile) {
        // Comprimir imagen antes de convertir a base64
        imagenBase64 = await new Promise<string>((resolve) => {
          const canvas = document.createElement('canvas')
          const img = new Image()
          img.onload = () => {
            // Limitar tamaño a 1920x1440
            let width = img.width
            let height = img.height
            const maxWidth = 1920
            const maxHeight = 1440

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height)
                height = maxHeight
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            // Exportar como JPEG con calidad 0.7
            resolve(canvas.toDataURL('image/jpeg', 0.7))
          }
          img.src = URL.createObjectURL(imageFile)
        })
      }

      await api.post('/propiedades', {
        titulo,
        descripcionPublica: descripcion,
        descripcionPrivada: descripcion,
        tipo,
        precio: parseFloat(precio),
        ubicacion,
        contacto,
        imagenBase64,
      })

      setSuccess('¡Propiedad publicada correctamente!')
      resetForm()
      setShowPanel(false)
      loadPropiedades()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Error al guardar la propiedad.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta propiedad?')) return
    await api.delete(`/propiedades/${id}`).catch(() => null)
    loadPropiedades()
  }

  async function handleDestacar(id: string) {
    await api.patch(`/propiedades/${id}/destacar`).catch(() => null)
    loadPropiedades()
  }

  return (
    <div className="page-container">
      {/* Header con botón + */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Propiedades</h1>
        <button
          onClick={() => { resetForm(); setShowPanel(true) }}
          className="btn-add-propiedad"
          title="Agregar propiedad"
        >
          +
        </button>
      </div>

      {/* Panel lateral para agregar propiedad */}
      {showPanel && (
        <div className="panel-overlay" onClick={() => setShowPanel(false)}>
          <div className="panel-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="panel-drawer-header">
              <h2>Nueva propiedad</h2>
              <button onClick={() => setShowPanel(false)} className="panel-close">✕</button>
            </div>

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}

            <form onSubmit={handleSubmit} className="form">
              {/* Imagen */}
              <div className="form-group">
                <label>Imagen de la propiedad</label>
                <div
                  className="image-upload-area"
                  onClick={() => document.getElementById('img-input')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="image-preview" />
                  ) : (
                    <div className="image-upload-placeholder">
                      <span style={{ fontSize: '2rem' }}>🖼️</span>
                      <span>Hacé clic para subir una imagen</span>
                    </div>
                  )}
                </div>
                <input
                  id="img-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>

              {/* Tipo */}
              <div className="form-group">
                <label>Tipo de operación</label>
                <div className="tipo-selector">
                  <button
                    type="button"
                    className={`tipo-btn${tipo === 'VENTA' ? ' active' : ''}`}
                    onClick={() => setTipo('VENTA')}
                  >
                    Venta
                  </button>
                  <button
                    type="button"
                    className={`tipo-btn${tipo === 'ALQUILER' ? ' active' : ''}`}
                    onClick={() => setTipo('ALQUILER')}
                  >
                    Alquiler
                  </button>
                </div>
              </div>

              {/* Título */}
              <div className="form-group">
                <label>Título *</label>
                <input className="form-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Casa en el centro" required />
              </div>

              {/* Precio y Ubicación */}
              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input className="form-input" type="number" min="1" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 150000" required />
                </div>
                <div className="form-group">
                  <label>Ubicación *</label>
                  <input className="form-input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Av. Corrientes 1234" required />
                </div>
              </div>

              {/* Contacto */}
              <div className="form-group">
                <label>Contacto *</label>
                <input className="form-input" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej: +54 11 1234-5678" required />
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  className="form-input"
                  rows={5}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describí la propiedad: ambientes, características, estado..."
                  required
                />
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary btn-full">
                {saving ? 'Publicando…' : 'Publicar propiedad'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div className="loading">Cargando…</div>
      ) : propiedades.length === 0 ? (
        <div className="empty">
          <p>No hay propiedades aún.</p>
          <button onClick={() => { resetForm(); setShowPanel(true) }} className="btn btn-primary" style={{ marginTop: 12 }}>
            + Agregar la primera propiedad
          </button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Destacada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {propiedades.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.imagenes?.[0] ? (
                    <img src={p.imagenes[0]} alt={p.titulo} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin imagen</span>}
                </td>
                <td>{p.titulo}</td>
                <td><span className="badge">{p.tipo}</span></td>
                <td>${p.precio?.toLocaleString()}</td>
                <td>{p.destacada ? '⭐' : '—'}</td>
                <td className="table-actions">
                  {!p.destacada && (
                    <button onClick={() => handleDestacar(p.id)} className="btn btn-outline btn-sm">Destacar</button>
                  )}
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
