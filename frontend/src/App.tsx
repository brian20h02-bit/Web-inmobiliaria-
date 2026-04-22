import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { FavoritosProvider } from './context/FavoritosContext'
import { GuardadosProvider } from './context/GuardadosContext'
import { PropiedadModalProvider } from './context/PropiedadModalContext'
import PropiedadModal from './components/PropiedadModal'
import Layout from './components/Layout'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import PropiedadDetalle from './pages/PropiedadDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/admin/Dashboard'
import PropiedadesAdmin from './pages/admin/PropiedadesAdmin'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'
import MetricasAdmin from './pages/admin/MetricasAdmin'
import ConsultasAdmin from './pages/admin/ConsultasAdmin'
import Historial from './pages/Historial'
import MisConsultas from './pages/MisConsultas'
import HiloConsulta from './pages/HiloConsulta'

export default function App() {
  return (
    <AuthProvider>
      <FavoritosProvider>
        <GuardadosProvider>
          <PropiedadModalProvider>
            <ChatProvider>
              <>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                  </Route>

                  <Route element={<AppLayout />}>
                    <Route path="/propiedades/:id" element={<PropiedadDetalle />} />
                    <Route path="/admin" element={
                      <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/admin/propiedades" element={
                      <ProtectedRoute adminOnly><PropiedadesAdmin /></ProtectedRoute>
                    } />
                    <Route path="/admin/usuarios" element={
                      <ProtectedRoute adminOnly><UsuariosAdmin /></ProtectedRoute>
                    } />
                    <Route path="/admin/metricas" element={
                      <ProtectedRoute adminOnly><MetricasAdmin /></ProtectedRoute>
                    } />
                    <Route path="/admin/consultas" element={
                      <ProtectedRoute adminOnly><ConsultasAdmin /></ProtectedRoute>
                    } />
                    <Route path="/historial" element={
                      <ProtectedRoute><Historial /></ProtectedRoute>
                    } />
                    <Route path="/mis-consultas" element={
                      <ProtectedRoute><MisConsultas /></ProtectedRoute>
                    } />
                    <Route path="/consultas/:id" element={
                      <ProtectedRoute><HiloConsulta /></ProtectedRoute>
                    } />
                  </Route>
                </Routes>
                <PropiedadModal />
              </>
            </ChatProvider>
          </PropiedadModalProvider>
        </GuardadosProvider>
      </FavoritosProvider>
    </AuthProvider>
  )
}
