import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import NotificacionesWidget from './NotificacionesWidget'

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <NotificacionesWidget />
    </div>
  )
}
