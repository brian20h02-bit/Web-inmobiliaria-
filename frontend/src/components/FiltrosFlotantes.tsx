import { useState, useRef, useEffect, useCallback } from 'react'

/* ── Types ─────────────────────────────────────────────────────── */
export interface FiltrosState {
  tipo: string               // 'todo' | 'venta' | 'alquiler' | 'otro'
  ciudad: string
  tipoPropiedad: string      // '' | 'casa' | 'departamento' | 'galpon' | 'cochera' | 'terreno'
  ambientes: string          // '' | '1' | '2' | '3' | '4'
  banos: string              // '' | '1' | '2' | '3' | '4'
}

interface Props {
  filtros: FiltrosState
  onChange: (f: FiltrosState) => void
}

const EMPTY: FiltrosState = { tipo: 'todo', ciudad: '', tipoPropiedad: '', ambientes: '', banos: '' }

/* ── Icons ─────────────────────────────────────────────────────── */
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconKey = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
)
const IconChevron = () => (
  <svg className="ff-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

/* ── Component ─────────────────────────────────────────────────── */
export default function FiltrosFlotantes({ filtros, onChange }: Props) {
  const [openDD, setOpenDD] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // local draft (edited inside dropdown, applied on close)
  const [draft, setDraft] = useState<FiltrosState>(filtros)

  // sync draft when parent changes
  useEffect(() => { setDraft(filtros) }, [filtros])

  // close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (barRef.current && !barRef.current.contains(e.target as Node)) {
      setOpenDD(null)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  /* helpers */
  function toggle(dd: string) {
    if (openDD === dd) {
      // closing → apply
      onChange(draft)
      setOpenDD(null)
    } else {
      setOpenDD(dd)
    }
  }

  function applyAndClose() {
    onChange(draft)
    setOpenDD(null)
  }

  function handleVerTodo() {
    onChange({ ...EMPTY })
    setOpenDD(null)
  }

  function isActive(tipo: string) {
    return filtros.tipo === tipo
  }

  /* ── Dropdown: Comprar / Alquilar ─────────────────────────────── */
  function renderResidentialDD() {
    const tipoPropOptions = ['Casa', 'Departamento']
    return (
      <div className="ff-dropdown">
        <div className="ff-dd-section">
          <label className="ff-dd-label">Ciudad</label>
          <input
            className="ff-dd-input"
            type="text"
            placeholder="Ej: Buenos Aires"
            value={draft.ciudad}
            onChange={(e) => setDraft({ ...draft, ciudad: e.target.value })}
          />
        </div>

        <div className="ff-dd-section">
          <label className="ff-dd-label">Tipo de propiedad</label>
          <div className="ff-dd-pills">
            {tipoPropOptions.map((t) => {
              const val = t.toLowerCase()
              const selected = draft.tipoPropiedad === val
              return (
                <button
                  key={val}
                  type="button"
                  className={`ff-dd-pill${selected ? ' active' : ''}`}
                  onClick={() => setDraft({ ...draft, tipoPropiedad: selected ? '' : val, ambientes: selected ? '' : draft.ambientes, banos: selected ? '' : draft.banos })}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {draft.tipoPropiedad === 'departamento' && (
          <>
            <div className="ff-dd-section">
              <label className="ff-dd-label">Ambientes</label>
              <div className="ff-dd-pills">
                {['1', '2', '3', '4'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ff-dd-pill small${draft.ambientes === n ? ' active' : ''}`}
                    onClick={() => setDraft({ ...draft, ambientes: draft.ambientes === n ? '' : n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="ff-dd-section">
              <label className="ff-dd-label">Baños</label>
              <div className="ff-dd-pills">
                {['1', '2', '3', '4'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ff-dd-pill small${draft.banos === n ? ' active' : ''}`}
                    onClick={() => setDraft({ ...draft, banos: draft.banos === n ? '' : n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="button" className="ff-dd-apply" onClick={applyAndClose}>Aplicar</button>
      </div>
    )
  }

  /* ── Dropdown: Otros ───────────────────────────────────────────── */
  function renderOtrosDD() {
    const tipos = [
      { label: 'Galpones', value: 'galpon' },
      { label: 'Cocheras', value: 'cochera' },
      { label: 'Terrenos', value: 'terreno' },
    ]
    return (
      <div className="ff-dropdown">
        <div className="ff-dd-section">
          <label className="ff-dd-label">Ciudad</label>
          <input
            className="ff-dd-input"
            type="text"
            placeholder="Ej: Buenos Aires"
            value={draft.ciudad}
            onChange={(e) => setDraft({ ...draft, ciudad: e.target.value })}
          />
        </div>
        <div className="ff-dd-section">
          <label className="ff-dd-label">Tipo</label>
          <div className="ff-dd-pills">
            {tipos.map((t) => {
              const selected = draft.tipoPropiedad === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`ff-dd-pill${selected ? ' active' : ''}`}
                  onClick={() => setDraft({ ...draft, tipoPropiedad: selected ? '' : t.value })}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        <button type="button" className="ff-dd-apply" onClick={applyAndClose}>Aplicar</button>
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  const TABS = [
    { id: 'todo', label: 'Ver todo', icon: <IconGrid />, hasDD: false },
    { id: 'venta', label: 'Comprar', icon: <IconHome />, hasDD: true },
    { id: 'alquiler', label: 'Alquilar', icon: <IconKey />, hasDD: true },
    { id: 'otro', label: 'Otros', icon: <IconMore />, hasDD: true },
  ]

  return (
    <div className="ff-bar-wrap" ref={barRef}>
      <div className="ff-bar">
        {TABS.map((tab) => (
          <div key={tab.id} className="ff-tab-wrap">
            <button
              type="button"
              className={`ff-tab${isActive(tab.id) ? ' active' : ''}${openDD === tab.id ? ' open' : ''}`}
              onClick={() => {
                if (tab.id === 'todo') {
                  handleVerTodo()
                } else {
                  // first click on inactive → activate + open DD
                  if (filtros.tipo !== tab.id) {
                    const next = { ...EMPTY, tipo: tab.id }
                    setDraft(next)
                    onChange(next)
                    setOpenDD(tab.id)
                  } else {
                    toggle(tab.id)
                  }
                }
              }}
            >
              <span className="ff-tab-icon">{tab.icon}</span>
              <span className="ff-tab-label">{tab.label}</span>
              {tab.hasDD && <IconChevron />}
            </button>

            {/* Dropdown */}
            {openDD === tab.id && tab.hasDD && (
              <div className="ff-dd-anchor">
                {tab.id === 'otro' ? renderOtrosDD() : renderResidentialDD()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
