import { Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { FavoritosProvider } from './context/FavoritosContext'
import { GuardadosProvider } from './context/GuardadosContext'
import { PropiedadModalProvider } from './context/PropiedadModalContext'
import PropiedadModal from './components/PropiedadModal'
import Layout from './components/Layout'
import LegalLayout from './components/LegalLayout'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import PropiedadDetalle from './pages/PropiedadDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import VerifyEmail from './pages/VerifyEmail'
import Privacidad from './pages/legal/Privacidad'
import Terminos from './pages/legal/Terminos'
import Cookies from './pages/legal/Cookies'
import Dashboard from './pages/admin/Dashboard'
import PropiedadesAdmin from './pages/admin/PropiedadesAdmin'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'
import MetricasAdmin from './pages/admin/MetricasAdmin'
import ConsultasAdmin from './pages/admin/ConsultasAdmin'
import Historial from './pages/Historial'
import MisConsultas from './pages/MisConsultas'
import HiloConsulta from './pages/HiloConsulta'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <FavoritosProvider>
        <GuardadosProvider>
          <PropiedadModalProvider>
            <ChatProvider>
              <>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/registro" element={<Registro />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />

                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                  </Route>

                  <Route element={<LegalLayout />}>
                    <Route path="/privacidad" element={<Privacidad />} />
                    <Route path="/terminos" element={<Terminos />} />
                    <Route path="/cookies" element={<Cookies />} />
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
    </GoogleOAuthProvider>
  )
}
