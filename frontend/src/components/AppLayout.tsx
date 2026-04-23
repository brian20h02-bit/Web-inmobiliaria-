import { Outlet } from 'react-router-dom'
import PropertyHeader from './PropertyHeader'
import Footer from './Footer'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <PropertyHeader />
      <main className="app-layout-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
