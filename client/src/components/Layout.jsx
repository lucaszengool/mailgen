import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-primary-25 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Support both Outlet (for nested routes) and children (for direct wrapper) */}
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}