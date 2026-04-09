import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import PropiedadDetalle from './pages/PropiedadDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MisConsultas from './pages/MisConsultas'
import HiloConsulta from './pages/HiloConsulta'
import ConsultasPanel from './pages/ConsultasPanel'
import Dashboard from './pages/admin/Dashboard'
import PropiedadesAdmin from './pages/admin/PropiedadesAdmin'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/propiedades/:id" element={<PropiedadDetalle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/mis-consultas" element={
            <ProtectedRoute><MisConsultas /></ProtectedRoute>
          } />
          <Route path="/consultas-panel" element={
            <ProtectedRoute><ConsultasPanel /></ProtectedRoute>
          } />
          <Route path="/consultas/:id" element={
            <ProtectedRoute><HiloConsulta /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin/propiedades" element={
            <ProtectedRoute adminOnly><PropiedadesAdmin /></ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute adminOnly><UsuariosAdmin /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
