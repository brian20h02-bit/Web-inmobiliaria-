import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFavoritos } from '../context/FavoritosContext'
import { useGuardados } from '../context/GuardadosContext'
import { usePropiedadModal } from '../context/PropiedadModalContext'
import { buildPropertyCardTitle } from '../lib/propertyTitle'

interface UserMenuProps {
  email: string
  onLogout: () => void
  isAdmin?: boolean
}

const PROFILE_KEY = 'inm_profile'

interface UserProfile {
  nombre: string
  apellido: string
  telefono: string
  ciudad: string
}

function loadProfile(): UserProfile {
  try {
    return { nombre: '', apellido: '', telefono: '', ciudad: '', ...JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') }
  } catch {
    return { nombre: '', apellido: '', telefono: '', ciudad: '' }
  }
}

type Panel = 'cuenta' | 'favoritos' | 'guardados' | null

export default function UserMenu({ email, onLogout, isAdmin = false }: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [profile, setProfile] = useState<UserProfile>(loadProfile)
  const [savedMsg, setSavedMsg] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { openModal } = usePropiedadModal()

  const { favoritos, toggleFavorito } = useFavoritos()
  const { guardados, toggleGuardado } = useGuardados()

  const displayName = profile.nombre || email.split('@')[0]

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close drawer on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPanel(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function openPanel(p: Panel) {
    setDropdownOpen(false)
    setPanel(p)
    setSavedMsg(false)
  }

  function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2200)
  }

  function handleLogout() {
    setPanel(null)
    setDropdownOpen(false)
    onLogout()
  }

  function goToProperty(id: string) {
    setPanel(null)
    openModal(id)
  }

  const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  // ── Framer Motion variants ────────────────────────────────────────
  const dropdownVariants = {
    hidden:  { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1,    y: 0  },
    exit:    { opacity: 0, scale: 0.95, y: -8 },
  }

  const drawerVariants = {
    hidden:  { x: '100%', opacity: 0 },
    visible: { x: 0,      opacity: 1 },
    exit:    { x: '100%', opacity: 0 },
  }

  const overlayVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
    exit:    { opacity: 0 },
  }

  const cardItemVariants = {
    rest:  { scale: 1,    backgroundColor: 'rgba(249,250,251,1)' },
    hover: { scale: 1.01, backgroundColor: 'rgba(243,244,246,1)' },
    tap:   { scale: 0.98 },
  }

  // ── Shared property list renderer ─────────────────────────────────
  function PropList({ items, onRemove, emptyIcon, emptyText }: {
    items: typeof favoritos
    onRemove: (p: typeof favoritos[0]) => void
    emptyIcon: string
    emptyText: string
  }) {
    if (items.length === 0) {
      return (
        <p className="user-drawer-empty">
          {emptyIcon}<br />{emptyText}
        </p>
      )
    }
    return (
      <div className="user-drawer-list">
        {items.map((p) => (
          <motion.div
            key={p.id}
            className="user-drawer-prop-item"
            variants={cardItemVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={() => goToProperty(p.id)}
            style={{ cursor: 'pointer' }}
          >
            {p.imagenUrl
              ? <img src={p.imagenUrl} alt={p.titulo} className="user-drawer-prop-img" loading="lazy" />
              : <div className="user-drawer-prop-img user-drawer-prop-img--placeholder" />
            }
            <div className="user-drawer-prop-info">
              <span className="user-drawer-prop-title">{buildPropertyCardTitle(p.tipo, p.titulo, p.ubicacion)}</span>
              {p.ubicacion && <span className="user-drawer-prop-loc">{p.ubicacion}</span>}
              {p.tipo && (
                <span className="user-drawer-prop-badge">{p.tipo === 'venta' ? 'VENTA' : 'ALQUILER'}</span>
              )}
            </div>
            <button
              className="user-drawer-prop-remove"
              onClick={(e) => { e.stopPropagation(); onRemove(p) }}
              aria-label="Quitar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        ))}
      </div>
    )
  }

  // ── Shared drawer shell ───────────────────────────────────────────
  function Drawer({ id, title, children }: { id: Panel; title: string; children: React.ReactNode }) {
    return (
      <AnimatePresence>
        {panel === id && (
          <motion.div
            className="user-drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as any }}
          >
            <div className="user-drawer-header">
              <h2 className="user-drawer-title">{title}</h2>
              <button className="user-drawer-close" onClick={() => setPanel(null)} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <div className="user-drawer-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <>
      {/* ── Trigger button + dropdown ── */}
      <div className="user-menu" ref={dropdownRef}>
        <button
          className="user-menu-btn"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-expanded={dropdownOpen}
          aria-label="Menú de usuario"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span className="user-menu-name">{displayName}</span>
          <motion.span
            className="user-menu-chevron"
            animate={{ rotate: dropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              className="user-dropdown"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <button className="user-dropdown-item" onClick={() => openPanel('cuenta')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                Cuenta
              </button>
              <button className="user-dropdown-item" onClick={() => openPanel('favoritos')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                Favoritos
                {favoritos.length > 0 && <span className="user-dropdown-badge">{favoritos.length}</span>}
              </button>
              <button className="user-dropdown-item" onClick={() => openPanel('guardados')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                Guardados
                {guardados.length > 0 && <span className="user-dropdown-badge">{guardados.length}</span>}
              </button>
              {isAdmin && (
                <>
                  <div className="user-dropdown-separator" />
                  <Link to="/admin" className="user-dropdown-item user-dropdown-item--admin" onClick={() => setDropdownOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Panel de control
                  </Link>
                </>
              )}
              <div className="user-dropdown-separator" />
              <button className="user-dropdown-item user-dropdown-item--danger" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Cerrar sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Animated overlay ── */}
      <AnimatePresence>
        {panel && (
          <motion.div
            className="user-drawer-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22 }}
            onClick={() => setPanel(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Cuenta drawer ── */}
      <Drawer id="cuenta" title="Mi cuenta">
        <div className="user-drawer-field">
          <label>Nombre</label>
          <input value={profile.nombre} onChange={(e) => setProfile((p) => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" />
        </div>
        <div className="user-drawer-field">
          <label>Apellido</label>
          <input value={profile.apellido} onChange={(e) => setProfile((p) => ({ ...p, apellido: e.target.value }))} placeholder="Tu apellido" />
        </div>
        <div className="user-drawer-field">
          <label>Email</label>
          <input value={email} disabled className="disabled" readOnly />
        </div>
        <div className="user-drawer-field">
          <label>Teléfono</label>
          <input value={profile.telefono} onChange={(e) => setProfile((p) => ({ ...p, telefono: e.target.value }))} placeholder="Ej: +54 11 1234-5678" />
        </div>
        <div className="user-drawer-field">
          <label>Ciudad</label>
          <input value={profile.ciudad} onChange={(e) => setProfile((p) => ({ ...p, ciudad: e.target.value }))} placeholder="Tu ciudad" />
        </div>
        <button className={`user-drawer-save${savedMsg ? ' saved' : ''}`} onClick={saveProfile}>
          {savedMsg ? '✓ Cambios guardados' : 'Guardar cambios'}
        </button>
      </Drawer>

      {/* ── Favoritos drawer ── */}
      <Drawer id="favoritos" title="Mis favoritos">
        <PropList
          items={favoritos}
          onRemove={toggleFavorito}
          emptyIcon="❤️"
          emptyText="No tenés propiedades favoritas aún. Tocá el ❤️ en cualquier card para guardarla aquí."
        />
      </Drawer>

      {/* ── Guardados drawer ── */}
      <Drawer id="guardados" title="Propiedades guardadas">
        <PropList
          items={guardados}
          onRemove={toggleGuardado}
          emptyIcon="🔖"
          emptyText="No tenés propiedades guardadas aún. Tocá el 🔖 en cualquier card para guardarla aquí."
        />
      </Drawer>
    </>
  )
}
