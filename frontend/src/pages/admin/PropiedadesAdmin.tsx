import { useState, useEffect, FormEvent } from 'react'
import api from '../../lib/api'

interface Propiedad {
  id: string
  titulo: string
  descripcionPublica?: string
  tipo: string
  precio: number
  expensas?: number | null
  ubicacion: string
  metrosCuadrados?: number | null
  ambientes?: number | null
  banos?: number | null
  contacto?: string
  activa: boolean
  destacada: boolean
  imagenes: string[]
  houseTourUrl?: string | null
}

export default function PropiedadesAdmin() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroDestacada, setFiltroDestacada] = useState<'TODAS' | 'DESTACADAS' | 'NO_DESTACADAS'>('TODAS')

  // Form state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [tipo, setTipo] = useState<'VENTA' | 'ALQUILER'>('VENTA')
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [expensas, setExpensas] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [metrosCuadrados, setMetrosCuadrados] = useState('')
  const [ambientesMode, setAmbientesMode] = useState<'mono' | 'multi'>('multi')
  const [ambientes, setAmbientes] = useState('')
  const [banos, setBanos] = useState('')
  const [contacto, setContacto] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [houseTourUrl, setHouseTourUrl] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
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

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const arr = Array.from(files)
    setImageFiles(prev => [...prev, ...arr])
    const previews = arr.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...previews])
  }

  function removeImage(idx: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  function resetForm() {
    setEditingId(null); setExistingImages([])
    setImageFiles([]); setImagePreviews([])
    setTipo('VENTA'); setMoneda('USD'); setTitulo(''); setDescripcion('')
    setPrecio(''); setExpensas(''); setUbicacion('')
    setMetrosCuadrados(''); setAmbientesMode('multi')
    setAmbientes(''); setBanos(''); setContacto('')
    setLat(''); setLng(''); setHouseTourUrl('')
    setError(''); setSuccess(''); setGeocodeError('')
  }

  async function geocodeUbicacion() {
    if (!ubicacion.trim()) { setGeocodeError('Ingresá una dirección primero.'); return }
    setGeocoding(true)
    setGeocodeError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ubicacion)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data.length === 0) { setGeocodeError('No se encontró la dirección. Probá con más detalle.'); return }
      setLat(parseFloat(data[0].lat).toFixed(6))
      setLng(parseFloat(data[0].lon).toFixed(6))
    } catch {
      setGeocodeError('Error al conectar con el servicio de mapas.')
    } finally {
      setGeocoding(false)
    }
  }

  function removeExistingImage(idx: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function openEdit(p: Propiedad) {
    resetForm()
    setEditingId(p.id)
    setShowPanel(true)
    try {
      const { data } = await api.get(`/propiedades/${p.id}`)
      setTitulo(data.titulo || '')
      setTipo(data.tipo as 'VENTA' | 'ALQUILER')
      setMoneda((data.moneda as 'USD' | 'ARS') ?? 'USD')
      setPrecio(data.precio != null ? String(data.precio) : '')
      setExpensas(data.expensas != null ? String(data.expensas) : '')
      setUbicacion(data.ubicacion || '')
      setMetrosCuadrados(data.metrosCuadrados != null ? String(data.metrosCuadrados) : '')
      if (data.ambientes === 0) {
        setAmbientesMode('mono'); setAmbientes('')
      } else {
        setAmbientesMode('multi'); setAmbientes(data.ambientes != null ? String(data.ambientes) : '')
      }
      setBanos(data.banos != null ? String(data.banos) : '')
      setContacto(data.contacto || '')
      setLat(data.lat != null ? String(data.lat) : '')
      setLng(data.lng != null ? String(data.lng) : '')
      setHouseTourUrl(data.houseTourUrl || '')
      setDescripcion(data.descripcionPublica || '')
      setExistingImages(data.imagenes || [])
    } catch {
      setError('Error al cargar los datos de la propiedad.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!tipo) { setError('Selecciona el tipo de operación.'); return }
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) { setError('El precio debe ser mayor a 0.'); return }
    if (!ubicacion.trim()) { setError('La ubicación es requerida.'); return }
    if (!titulo.trim()) { setError('El título es requerido.'); return }
    if (!contacto.trim()) { setError('El contacto es requerido.'); return }
    if (!descripcion.trim()) { setError('La descripción es requerida.'); return }

    setSaving(true)
    try {
      const ambientesVal = ambientesMode === 'mono' ? 0 : (ambientes ? parseInt(ambientes) : undefined)

      const formData = new FormData()
      formData.append('titulo', titulo)
      formData.append('descripcionPublica', descripcion)
      formData.append('descripcionPrivada', descripcion)
      formData.append('tipo', tipo)
      formData.append('moneda', moneda)
      formData.append('precio', precio)
      if (tipo === 'ALQUILER' && expensas) formData.append('expensas', expensas)
      formData.append('ubicacion', ubicacion)
      if (metrosCuadrados) formData.append('metrosCuadrados', metrosCuadrados)
      if (ambientesVal !== undefined) formData.append('ambientes', String(ambientesVal))
      if (banos) formData.append('banos', banos)
      formData.append('contacto', contacto)
      if (lat) formData.append('lat', lat)
      if (lng) formData.append('lng', lng)
      if (houseTourUrl.trim()) formData.append('houseTourUrl', houseTourUrl.trim())

      // New image files
      for (const file of imageFiles) {
        formData.append('imagenes', file)
      }

      // Existing image URLs (edit mode)
      if (editingId) {
        existingImages.forEach(url => formData.append('existingImagenes', url))
      }

      if (editingId) {
        await api.put(`/propiedades/${editingId}`, formData)
        setSuccess('¡Propiedad actualizada correctamente!')
      } else {
        await api.post('/propiedades', formData)
        setSuccess('¡Propiedad publicada correctamente!')
      }
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

  async function toggleDestacada(id: string, currentState: boolean) {
    // Optimistic update
    setPropiedades(prev => prev.map(p => p.id === id ? { ...p, destacada: !currentState } : p))
    try {
      await api.patch(`/propiedades/${id}/destacar`)
    } catch {
      // Revert on error
      setPropiedades(prev => prev.map(p => p.id === id ? { ...p, destacada: currentState } : p))
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Propiedades</h1>
        <button onClick={() => { resetForm(); setShowPanel(true) }} className="btn-add-propiedad" title="Agregar propiedad">+</button>
      </div>

      {/* Panel lateral */}
      {showPanel && (
        <div className="panel-overlay" onClick={() => setShowPanel(false)}>
          <div className="panel-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="panel-drawer-header">
              <h2>{editingId ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
              <button onClick={() => setShowPanel(false)} className="panel-close">✕</button>
            </div>

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}

            <form onSubmit={handleSubmit} className="form">
              {/* ── Imágenes (múltiples) ── */}
              <div className="form-group">
                <label>Imágenes de la propiedad</label>
                <div className="multi-image-upload" onClick={() => document.getElementById('img-input')?.click()}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <span>Hacé clic para agregar imágenes</span>
                  <span style={{ fontSize: '0.72rem', color: '#999' }}>Sin límite de cantidad</span>
                </div>
                <input id="img-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesChange} />
                {/* Existing images (edit mode) */}
                {existingImages.length > 0 && (
                  <div className="image-preview-grid">
                    {existingImages.map((src, i) => (
                      <div key={`existing-${i}`} className="image-preview-item">
                        <img src={src} alt={`imagen ${i + 1}`} />
                        <button type="button" className="image-preview-remove" onClick={() => removeExistingImage(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {/* New images to upload */}
                {imagePreviews.length > 0 && (
                  <div className="image-preview-grid">
                    {imagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="image-preview-item image-preview-new">
                        <img src={src} alt={`preview ${i + 1}`} />
                        <button type="button" className="image-preview-remove" onClick={() => removeImage(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Tipo de operación ── */}
              <div className="form-group">
                <label>Tipo de operación *</label>
                <div className="tipo-selector">
                  <button type="button" className={`tipo-btn${tipo === 'VENTA' ? ' active' : ''}`} onClick={() => setTipo('VENTA')}>Venta</button>
                  <button type="button" className={`tipo-btn${tipo === 'ALQUILER' ? ' active' : ''}`} onClick={() => setTipo('ALQUILER')}>Alquiler</button>
                </div>
              </div>

              {/* ── Moneda ── */}
              <div className="form-group">
                <label>Moneda del precio *</label>
                <div className="tipo-selector">
                  <button type="button" className={`tipo-btn${moneda === 'USD' ? ' active' : ''}`} onClick={() => setMoneda('USD')}>USD (Dólares)</button>
                  <button type="button" className={`tipo-btn${moneda === 'ARS' ? ' active' : ''}`} onClick={() => setMoneda('ARS')}>ARS (Pesos)</button>
                </div>
              </div>

              {/* ── Título ── */}
              <div className="form-group">
                <label>Título *</label>
                <input className="form-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Departamento 3 ambientes en Palermo" required />
              </div>

              {/* ── Precio + Expensas ── */}
              <div className="form-row">
                <div className="form-group">
                  <label>{tipo === 'ALQUILER' ? `Precio mensual (${moneda}) *` : `Precio total (${moneda}) *`}</label>
                  <input className="form-input" type="number" min="1" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder={tipo === 'ALQUILER' ? 'Ej: 800' : 'Ej: 150000'} required />
                </div>
                {tipo === 'ALQUILER' && (
                  <div className="form-group">
                    <label>Expensas (ARS)</label>
                    <input className="form-input" type="number" min="0" value={expensas} onChange={(e) => setExpensas(e.target.value)} placeholder="Ej: 35000" />
                  </div>
                )}
              </div>

              {/* ── Ubicación ── */}
              <div className="form-group">
                <label>Dirección completa *</label>
                <input className="form-input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Av. Corrientes 1234, Palermo, Buenos Aires" required />
              </div>

              {/* ── Metros + Baños ── */}
              <div className="form-row">
                <div className="form-group">
                  <label>Metros cuadrados</label>
                  <input className="form-input" type="number" min="1" value={metrosCuadrados} onChange={(e) => setMetrosCuadrados(e.target.value)} placeholder="Ej: 85" />
                </div>
                <div className="form-group">
                  <label>Baños</label>
                  <input className="form-input" type="number" min="0" value={banos} onChange={(e) => setBanos(e.target.value)} placeholder="Ej: 2" />
                </div>
              </div>

              {/* ── Ambientes ── */}
              <div className="form-group">
                <label>Ambientes</label>
                <div className="tipo-selector" style={{ marginBottom: ambientesMode === 'multi' ? 8 : 0 }}>
                  <button type="button" className={`tipo-btn${ambientesMode === 'mono' ? ' active' : ''}`} onClick={() => { setAmbientesMode('mono'); setAmbientes('') }}>Monoambiente</button>
                  <button type="button" className={`tipo-btn${ambientesMode === 'multi' ? ' active' : ''}`} onClick={() => setAmbientesMode('multi')}>Más ambientes</button>
                </div>
                {ambientesMode === 'multi' && (
                  <input className="form-input" type="number" min="1" value={ambientes} onChange={(e) => setAmbientes(e.target.value)} placeholder="Ej: 3" />
                )}
              </div>

              {/* ── Contacto ── */}
              <div className="form-group">
                <label>Contacto *</label>
                <input className="form-input" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej: +54 11 1234-5678" required />
              </div>

              {/* ── Coordenadas GPS (mapa) ── */}
              <div className="form-group">
                <label>Coordenadas para el mapa (opcional)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={geocodeUbicacion}
                    disabled={geocoding}
                    className="btn btn-outline btn-sm"
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {geocoding ? 'Buscando…' : '📍 Obtener coordenadas'}
                  </button>
                  {lat && lng && (
                    <a
                      href={`https://maps.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      🗺 Ver en mapa
                    </a>
                  )}
                </div>
                {geocodeError && <p className="error-msg" style={{ margin: '4px 0 8px' }}>{geocodeError}</p>}
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-input" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitud (Ej: -34.6037)" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-input" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitud (Ej: -58.3816)" />
                  </div>
                </div>
              </div>

              {/* ── House Tour (video) ── */}
              <div className="form-group">
                <label>House Tour (video URL)</label>
                <input
                  className="form-input"
                  type="url"
                  value={houseTourUrl}
                  onChange={(e) => setHouseTourUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://example.com/video.mp4"
                />
                {houseTourUrl && (
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                    Vista previa disponible al guardar
                  </p>
                )}
              </div>

              {/* ── Descripción ── */}
              <div className="form-group">
                <label>Descripción *</label>
                <textarea className="form-input" rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describí la propiedad: ambientes, características, estado..." required />
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary btn-full">
                {saving ? (editingId ? 'Guardando…' : 'Publicando…') : (editingId ? 'Guardar cambios' : 'Publicar propiedad')}
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
          <button onClick={() => { resetForm(); setShowPanel(true) }} className="btn btn-primary" style={{ marginTop: 12 }}>+ Agregar la primera propiedad</button>
        </div>
      ) : (
        <>
          {/* Buscador + filtros */}
          <div className="admin-filters-bar">
            <div className="admin-search-wrap">
              <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="admin-search-input"
                type="text"
                placeholder="Buscar por título o ubicación…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && <button className="admin-search-clear" onClick={() => setBusqueda('')}>✕</button>}
            </div>
            <div className="admin-filter-tabs">
              {(['TODAS', 'DESTACADAS', 'NO_DESTACADAS'] as const).map((f) => (
                <button key={f} className={`admin-filter-tab${filtroDestacada === f ? ' active' : ''}`} onClick={() => setFiltroDestacada(f)}>
                  {f === 'TODAS' ? 'Todas' : f === 'DESTACADAS' ? '★ Destacadas' : 'No destacadas'}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const filtradas = propiedades.filter((p) => {
              const q = busqueda.toLowerCase()
              const matchSearch = p.titulo.toLowerCase().includes(q) || (p.ubicacion || '').toLowerCase().includes(q)
              const matchDest = filtroDestacada === 'TODAS' || (filtroDestacada === 'DESTACADAS' ? p.destacada : !p.destacada)
              return matchSearch && matchDest
            })
            if (filtradas.length === 0) return <p className="empty">No se encontraron propiedades.</p>
            return (
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
                  {filtradas.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.imagenes?.[0] ? (
                          <img src={p.imagenes[0]} alt={p.titulo} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin imagen</span>}
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <p style={{ fontWeight: 500, marginBottom: 2 }}>{p.titulo}</p>
                        {p.ubicacion && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.ubicacion}</p>}
                      </td>
                      <td><span className="badge">{p.tipo}</span></td>
                      <td style={{ fontWeight: 600 }}>US$ {Number(p.precio).toLocaleString('es-AR')}</td>
                      <td>
                        <button
                          className={`star-toggle${p.destacada ? ' star-toggle--active' : ''}`}
                          onClick={() => toggleDestacada(p.id, p.destacada)}
                          title={p.destacada ? 'Quitar de destacadas' : 'Marcar como destacada'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={p.destacada ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                      </td>
                      <td className="table-actions">
                        <button onClick={() => openEdit(p)} className="btn btn-outline btn-sm">Editar</button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()}
        </>
      )}
    </div>
  )
}
