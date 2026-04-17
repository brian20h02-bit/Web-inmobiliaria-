import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import PropiedadDetalle from './pages/PropiedadDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/admin/Dashboard'
import PropiedadesAdmin from './pages/admin/PropiedadesAdmin'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/propiedades/:id" element={<PropiedadDetalle />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

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
      </ChatProvider>
    </AuthProvider>
  )
}
