import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Footer from './Footer'

// Guards a group of routes to a set of allowed roles, and renders the
// sidebar + content frame. Nested routes render their own TopBar so each
// page controls its own title/subtitle.
export default function AppShell({ allowedRoles }) {
  const { role, user } = useAuth()

  if (!role) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar role={role} userName={user?.name} />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}
